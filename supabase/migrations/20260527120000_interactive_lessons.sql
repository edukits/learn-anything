alter table public.lesson_versions
	add column if not exists render_blocks jsonb not null default '[]'::jsonb,
	add constraint lesson_versions_render_blocks_array check (jsonb_typeof(render_blocks) = 'array');

create table public.lesson_interaction_links (
	lesson_id text not null,
	lesson_version int not null,
	interaction_slug text not null,
	interaction_type text not null check (interaction_type in ('concept_check', 'scenario_choice', 'mini_practice')),
	question_id text not null,
	question_version int not null,
	ordering int not null check (ordering > 0),
	primary key (lesson_id, lesson_version, interaction_slug, ordering),
	foreign key (lesson_id, lesson_version) references public.lesson_versions(lesson_id, version) on delete restrict,
	foreign key (question_id, question_version) references public.quiz_question_versions(question_id, version) on delete restrict
);

create index lesson_interaction_links_question_idx
	on public.lesson_interaction_links (question_id, question_version);

alter table public.lesson_interaction_links enable row level security;

create policy "Lesson interaction links are readable by signed-in learners"
	on public.lesson_interaction_links for select to authenticated using (true);

create table public.lesson_interaction_attempts (
	id uuid primary key default extensions.gen_random_uuid(),
	user_id uuid not null references auth.users(id) on delete cascade,
	topic_area_id text not null references public.topic_areas(id) on delete restrict,
	release_id text not null references public.content_releases(id) on delete restrict,
	lesson_id text not null,
	lesson_version int not null,
	interaction_slug text not null,
	submission_key text not null,
	completed_at timestamptz not null default now(),
	foreign key (lesson_id, lesson_version) references public.lesson_versions(lesson_id, version) on delete restrict,
	unique (user_id, submission_key)
);

create table public.lesson_interaction_attempt_answers (
	attempt_id uuid not null references public.lesson_interaction_attempts(id) on delete cascade,
	user_id uuid not null references auth.users(id) on delete cascade,
	question_id text not null,
	question_version int not null,
	skill_id text not null references public.skills(id) on delete restrict,
	device text not null,
	selected_choice_id text not null,
	correct_choice_id text not null,
	is_correct boolean not null,
	answer_value jsonb not null default 'null'::jsonb,
	correct_answer_value jsonb not null default 'null'::jsonb,
	grading_strategy text not null default 'multiple_choice',
	answered_at timestamptz not null default now(),
	primary key (attempt_id, question_id, question_version),
	foreign key (question_id, question_version) references public.quiz_question_versions(question_id, version) on delete restrict
);

alter table public.lesson_interaction_attempts enable row level security;
alter table public.lesson_interaction_attempt_answers enable row level security;

create policy "Lesson interaction attempts are readable by owner"
	on public.lesson_interaction_attempts for select to authenticated using ((select auth.uid()) = user_id);

create policy "Lesson interaction answers are readable by owner"
	on public.lesson_interaction_attempt_answers for select to authenticated using ((select auth.uid()) = user_id);

alter table public.skill_mastery_events
	drop constraint if exists skill_mastery_events_source_type_check,
	add constraint skill_mastery_events_source_type_check
	check (source_type in ('diagnostic', 'quiz', 'drill', 'review', 'lesson_interaction'));

alter table public.spaced_repetition_reviews
	drop constraint if exists spaced_repetition_reviews_source_check,
	add constraint spaced_repetition_reviews_source_check
	check (source in ('quiz', 'review', 'diagnostic', 'drill', 'lesson_interaction'));

create or replace function public.record_learning_answer_outcomes(
	p_user_id uuid,
	p_topic_area_id text,
	p_release_id text,
	p_source text,
	p_source_id text,
	p_outcomes jsonb,
	p_mastery_weight numeric
)
returns void
language plpgsql
security definer
set search_path = public, app_private
as $$
declare
	v_answer record;
	v_delta numeric;
	v_previous_mastery numeric;
	v_next_mastery numeric;
	v_mastery_event_id uuid;
	v_source_key text;
	v_item record;
	v_item_id uuid;
	v_grade int;
	v_grade_label text;
	v_previous_state text;
	v_next_state text;
	v_previous_review_count int;
	v_next_review_count int;
	v_previous_lapse_count int;
	v_next_lapse_count int;
	v_previous_interval int;
	v_next_interval int;
	v_previous_ease numeric;
	v_next_ease numeric;
	v_review_event_id uuid;
	v_reviewed_at timestamptz;
begin
	if p_source not in ('quiz', 'review', 'diagnostic', 'drill', 'lesson_interaction') then
		raise exception 'Unsupported learning outcome source: %', p_source;
	end if;

	if p_mastery_weight <= 0 or p_mastery_weight > 1 then
		raise exception 'mastery weight must be > 0 and <= 1';
	end if;

	if jsonb_typeof(p_outcomes) <> 'array' then
		raise exception 'outcomes must be a JSON array';
	end if;

	for v_answer in
		select *
		from jsonb_to_recordset(p_outcomes) as answer(
			question_id text,
			question_version int,
			skill_id text,
			is_correct boolean,
			answered_at timestamptz,
			response_time_ms int
		)
	loop
		v_reviewed_at := coalesce(v_answer.answered_at, now());
		v_source_key := p_source || ':' || p_source_id || ':' || v_answer.question_id || '@' || v_answer.question_version;
		v_delta := round(((case when v_answer.is_correct then 0.12 else -0.10 end) * p_mastery_weight)::numeric, 3);

		insert into public.skill_mastery_projections (
			user_id,
			topic_area_id,
			skill_id,
			mastery_score,
			evidence_count,
			updated_at
		)
		values (
			p_user_id,
			p_topic_area_id,
			v_answer.skill_id,
			0.5,
			0,
			v_reviewed_at
		)
		on conflict (user_id, topic_area_id, skill_id) do nothing;

		select mastery_score
		into v_previous_mastery
		from public.skill_mastery_projections
		where user_id = p_user_id
			and topic_area_id = p_topic_area_id
			and skill_id = v_answer.skill_id
		for update;

		v_next_mastery := least(1, greatest(0, round((v_previous_mastery + v_delta)::numeric, 3)));

		insert into public.skill_mastery_events (
			user_id,
			topic_area_id,
			skill_id,
			source_type,
			source_id,
			source_key,
			question_id,
			question_version,
			delta,
			previous_mastery_score,
			new_mastery_score,
			evidence,
			occurred_at
		)
		values (
			p_user_id,
			p_topic_area_id,
			v_answer.skill_id,
			p_source,
			p_source_id,
			v_source_key,
			v_answer.question_id,
			v_answer.question_version,
			v_delta,
			v_previous_mastery,
			v_next_mastery,
			jsonb_build_object(
				'is_correct', v_answer.is_correct,
				'source_id', p_source_id,
				'mastery_weight', p_mastery_weight
			),
			v_reviewed_at
		)
		on conflict (user_id, source_key) where source_key is not null do nothing
		returning id into v_mastery_event_id;

		if v_mastery_event_id is not null then
			update public.skill_mastery_projections
			set mastery_score = v_next_mastery,
				evidence_count = evidence_count + 1,
				updated_at = v_reviewed_at
			where user_id = p_user_id
				and topic_area_id = p_topic_area_id
				and skill_id = v_answer.skill_id;
		end if;

		insert into public.spaced_repetition_items (
			user_id,
			topic_area_id,
			release_id,
			question_id,
			question_version,
			skill_id
		)
		values (
			p_user_id,
			p_topic_area_id,
			p_release_id,
			v_answer.question_id,
			v_answer.question_version,
			v_answer.skill_id
		)
		on conflict (user_id, question_id, question_version) do nothing;

		select *
		into v_item
		from public.spaced_repetition_items
		where user_id = p_user_id
			and question_id = v_answer.question_id
			and question_version = v_answer.question_version
		for update;

		v_item_id := v_item.id;
		v_grade_label := case when v_answer.is_correct then 'good' else 'again' end;
		v_grade := case when v_answer.is_correct then 4 else 1 end;
		v_previous_state := coalesce(v_item.state, 'new');
		v_previous_review_count := coalesce(v_item.review_count, 0);
		v_previous_lapse_count := coalesce(v_item.lapse_count, 0);
		v_previous_interval := coalesce(v_item.interval_days, 0);
		v_previous_ease := coalesce(v_item.ease_factor, 2.5);

		if v_answer.is_correct then
			v_next_review_count := v_previous_review_count + 1;
			v_next_lapse_count := v_previous_lapse_count;
			v_next_ease := v_previous_ease;
			v_next_interval := case
				when v_next_review_count = 1 then 1
				when v_next_review_count = 2 then 6
				else greatest(1, round(greatest(1, v_previous_interval) * v_next_ease)::int)
			end;
			v_next_state := case when v_next_interval >= 21 then 'mastered' else 'review' end;
		else
			v_next_review_count := v_previous_review_count + 1;
			v_next_lapse_count := v_previous_lapse_count + 1;
			v_next_ease := greatest(1.3, round((v_previous_ease - 0.2)::numeric, 2));
			v_next_interval := 1;
			v_next_state := 'learning';
		end if;

		insert into public.spaced_repetition_reviews (
			item_id,
			source_key,
			user_id,
			topic_area_id,
			question_id,
			question_version,
			grade,
			grade_label,
			response_time_ms,
			previous_state,
			next_state,
			previous_learning_state,
			new_learning_state,
			previous_interval_days,
			new_interval_days,
			previous_ease_factor,
			new_ease_factor,
			source,
			reviewed_at
		)
		values (
			v_item_id,
			v_source_key,
			p_user_id,
			p_topic_area_id,
			v_answer.question_id,
			v_answer.question_version,
			v_grade,
			v_grade_label,
			coalesce(v_answer.response_time_ms, 0),
			jsonb_build_object(
				'learningState', v_previous_state,
				'reviewCount', v_previous_review_count,
				'lapseCount', v_previous_lapse_count,
				'easeFactor', v_previous_ease,
				'intervalDays', v_previous_interval,
				'dueAt', v_item.due_at,
				'lastReviewedAt', v_item.last_reviewed_at
			),
			jsonb_build_object(
				'learningState', v_next_state,
				'reviewCount', v_next_review_count,
				'lapseCount', v_next_lapse_count,
				'easeFactor', v_next_ease,
				'intervalDays', v_next_interval,
				'dueAt', v_reviewed_at + make_interval(days => v_next_interval),
				'lastReviewedAt', v_reviewed_at
			),
			v_previous_state,
			v_next_state,
			v_previous_interval,
			v_next_interval,
			v_previous_ease,
			v_next_ease,
			p_source,
			v_reviewed_at
		)
		on conflict (user_id, source_key) where source_key is not null do nothing
		returning id into v_review_event_id;

		if v_review_event_id is not null then
			update public.spaced_repetition_items
			set topic_area_id = p_topic_area_id,
				release_id = p_release_id,
				skill_id = v_answer.skill_id,
				state = v_next_state,
				repetitions = v_next_review_count,
				review_count = v_next_review_count,
				lapse_count = v_next_lapse_count,
				ease_factor = v_next_ease,
				interval_days = v_next_interval,
				due_at = v_reviewed_at + make_interval(days => v_next_interval),
				last_reviewed_at = v_reviewed_at,
				updated_at = now()
			where id = v_item_id;
		end if;
	end loop;
end;
$$;

revoke execute on function public.record_learning_answer_outcomes(uuid, text, text, text, text, jsonb, numeric)
	from anon, authenticated, public;
grant execute on function public.record_learning_answer_outcomes(uuid, text, text, text, text, jsonb, numeric)
	to service_role;

create or replace function public.submit_lesson_interaction_answer(
	p_user_id uuid,
	p_topic_area_id text,
	p_release_id text,
	p_lesson_id text,
	p_lesson_version int,
	p_interaction_slug text,
	p_answers jsonb,
	p_submission_key text
)
returns table (
	attempt_id uuid
)
language plpgsql
security definer
set search_path = public, app_private
as $$
declare
	v_attempt_id uuid;
	v_existing_attempt_id uuid;
	v_completed_at timestamptz := now();
	v_expected_count int := 0;
	v_inserted_count int := 0;
	v_outcomes jsonb;
begin
	if coalesce(p_submission_key, '') = '' then
		raise exception 'submission key is required';
	end if;

	if jsonb_typeof(p_answers) <> 'array' then
		raise exception 'answers must be a JSON array';
	end if;

	select id
	into v_existing_attempt_id
	from public.lesson_interaction_attempts
	where user_id = p_user_id and submission_key = p_submission_key;

	if v_existing_attempt_id is not null then
		return query select v_existing_attempt_id;
		return;
	end if;

	select count(*)
	into v_expected_count
	from public.lesson_interaction_links
	where lesson_id = p_lesson_id
		and lesson_version = p_lesson_version
		and interaction_slug = p_interaction_slug;

	if v_expected_count = 0 then
		raise exception 'lesson interaction not found';
	end if;

	if jsonb_array_length(p_answers) <> v_expected_count then
		raise exception 'answer count does not match lesson interaction question count';
	end if;

	insert into public.lesson_interaction_attempts (
		user_id,
		topic_area_id,
		release_id,
		lesson_id,
		lesson_version,
		interaction_slug,
		submission_key,
		completed_at
	)
	values (
		p_user_id,
		p_topic_area_id,
		p_release_id,
		p_lesson_id,
		p_lesson_version,
		p_interaction_slug,
		p_submission_key,
		v_completed_at
	)
	returning id into v_attempt_id;

	insert into public.lesson_interaction_attempt_answers (
		attempt_id,
		user_id,
		question_id,
		question_version,
		skill_id,
		device,
		selected_choice_id,
		correct_choice_id,
		is_correct,
		answer_value,
		correct_answer_value,
		grading_strategy,
		answered_at
	)
	select
		v_attempt_id,
		p_user_id,
		input.question_id,
		input.question_version,
		question.skill_id,
		question.device,
		grade.selected_choice_id,
		grade.correct_choice_id,
		grade.is_correct,
		grade.answer_value,
		grade.correct_answer_value,
		grade.grading_strategy,
		v_completed_at
	from jsonb_to_recordset(p_answers) as input(
		question_id text,
		question_version int,
		selected_choice_id text,
		answer_value jsonb
	)
	join public.lesson_interaction_links link
		on link.lesson_id = p_lesson_id
		and link.lesson_version = p_lesson_version
		and link.interaction_slug = p_interaction_slug
		and link.question_id = input.question_id
		and link.question_version = input.question_version
	join public.quiz_question_versions question
		on question.question_id = input.question_id
		and question.version = input.question_version
	cross join lateral app_private.grade_question_result(question, to_jsonb(input)) grade;

	get diagnostics v_inserted_count = row_count;
	if v_inserted_count <> v_expected_count then
		raise exception 'lesson interaction answers did not match expected questions';
	end if;

	select jsonb_agg(
		jsonb_build_object(
			'question_id', answers.question_id,
			'question_version', answers.question_version,
			'skill_id', answers.skill_id,
			'is_correct', answers.is_correct,
			'answered_at', answers.answered_at,
			'response_time_ms', 0
		)
	)
	into v_outcomes
	from public.lesson_interaction_attempt_answers answers
	where answers.attempt_id = v_attempt_id;

	perform public.record_learning_answer_outcomes(
		p_user_id,
		p_topic_area_id,
		p_release_id,
		'lesson_interaction',
		v_attempt_id::text,
		coalesce(v_outcomes, '[]'::jsonb),
		0.35
	);

	return query select v_attempt_id;
end;
$$;

revoke execute on function public.submit_lesson_interaction_answer(uuid, text, text, text, int, text, jsonb, text)
	from anon, authenticated, public;
grant execute on function public.submit_lesson_interaction_answer(uuid, text, text, text, int, text, jsonb, text)
	to service_role;
