comment on table public.spaced_repetition_state is
	'Deprecated by v3 spaced_repetition_items and spaced_repetition_reviews. Kept for additive-only migration safety.';

create table if not exists public.diagnostic_question_versions (
	topic_area_id text not null references public.topic_areas(id) on delete restrict,
	release_id text not null references public.content_releases(id) on delete restrict,
	question_id text not null,
	question_version int not null,
	ordering int not null check (ordering > 0),
	created_at timestamptz not null default now(),
	primary key (topic_area_id, release_id, question_id, question_version),
	unique (topic_area_id, release_id, ordering),
	foreign key (question_id, question_version) references public.quiz_question_versions(question_id, version) on delete restrict
);

alter table public.diagnostic_question_versions enable row level security;

create policy "Diagnostic question tags are readable by signed-in learners"
	on public.diagnostic_question_versions for select to authenticated using (true);

insert into public.diagnostic_question_versions (
	topic_area_id,
	release_id,
	question_id,
	question_version,
	ordering
)
select
	release.scope_id,
	release.id,
	ranked.content_id,
	ranked.content_version,
	ranked.ordering
from public.content_releases release
join lateral (
	select
		item.content_id,
		item.content_version,
		row_number() over (
			order by
				case question.difficulty
					when 'easy' then 0
					when 'medium' then 1
					else 2
				end,
				item.content_id
		) as ordering
	from public.content_release_items item
	join public.quiz_question_versions question
		on question.question_id = item.content_id
		and question.version = item.content_version
	where item.release_id = release.id
		and item.content_type = 'quiz_question'
		and question.lifecycle_status = 'active'
	limit 5
) ranked on true
where release.status = 'published'
	and release.scope_type = 'topic_area'
on conflict (topic_area_id, release_id, question_id, question_version) do nothing;

create or replace function public.record_learning_answer_outcomes(
	p_user_id uuid,
	p_topic_area_id text,
	p_release_id text,
	p_source text,
	p_source_id text,
	p_outcomes jsonb
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
	if p_source not in ('quiz', 'review', 'diagnostic', 'drill') then
		raise exception 'Unsupported learning outcome source: %', p_source;
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
		v_delta := case when v_answer.is_correct then 0.12 else -0.10 end;

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
			jsonb_build_object('is_correct', v_answer.is_correct, 'source_id', p_source_id),
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

revoke execute on function public.record_learning_answer_outcomes(uuid, text, text, text, text, jsonb)
	from anon, authenticated, public;
grant execute on function public.record_learning_answer_outcomes(uuid, text, text, text, text, jsonb)
	to service_role;

create or replace function public.submit_quiz_with_outcomes(
	p_user_id uuid,
	p_topic_area_id text,
	p_release_id text,
	p_quiz_id text,
	p_quiz_version int,
	p_answers jsonb,
	p_submission_key text
)
returns table (
	attempt_id uuid,
	activity_event_id uuid,
	score numeric,
	correct_count int,
	question_count int,
	xp_awarded int
)
language plpgsql
security definer
set search_path = public, app_private
as $$
declare
	v_result record;
	v_outcomes jsonb;
begin
	select *
	into v_result
	from public.submit_quiz(
		p_user_id,
		p_topic_area_id,
		p_release_id,
		p_quiz_id,
		p_quiz_version,
		p_answers,
		p_submission_key
	);

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
	from public.quiz_attempt_answers answers
	where answers.attempt_id = v_result.attempt_id;

	perform public.record_learning_answer_outcomes(
		p_user_id,
		p_topic_area_id,
		p_release_id,
		'quiz',
		v_result.attempt_id::text,
		coalesce(v_outcomes, '[]'::jsonb)
	);

	return query
	select
		v_result.attempt_id,
		v_result.activity_event_id,
		v_result.score,
		v_result.correct_count,
		v_result.question_count,
		v_result.xp_awarded;
end;
$$;

create or replace function public.complete_review_session_with_outcomes(
	p_user_id uuid,
	p_topic_area_id text,
	p_release_id text,
	p_review_session_id uuid,
	p_answers jsonb,
	p_submission_key text
)
returns table (
	attempt_id uuid,
	activity_event_id uuid,
	score numeric,
	correct_count int,
	question_count int,
	xp_awarded int
)
language plpgsql
security definer
set search_path = public, app_private
as $$
declare
	v_result record;
	v_outcomes jsonb;
begin
	select *
	into v_result
	from public.complete_review_session(
		p_user_id,
		p_topic_area_id,
		p_release_id,
		p_review_session_id,
		p_answers,
		p_submission_key
	);

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
	from public.quiz_attempt_answers answers
	where answers.attempt_id = v_result.attempt_id;

	perform public.record_learning_answer_outcomes(
		p_user_id,
		p_topic_area_id,
		p_release_id,
		'review',
		v_result.attempt_id::text,
		coalesce(v_outcomes, '[]'::jsonb)
	);

	return query
	select
		v_result.attempt_id,
		v_result.activity_event_id,
		v_result.score,
		v_result.correct_count,
		v_result.question_count,
		v_result.xp_awarded;
end;
$$;

revoke execute on function public.submit_quiz_with_outcomes(uuid, text, text, text, int, jsonb, text)
	from anon, authenticated, public;
grant execute on function public.submit_quiz_with_outcomes(uuid, text, text, text, int, jsonb, text)
	to service_role;

revoke execute on function public.complete_review_session_with_outcomes(uuid, text, text, uuid, jsonb, text)
	from anon, authenticated, public;
grant execute on function public.complete_review_session_with_outcomes(uuid, text, text, uuid, jsonb, text)
	to service_role;

create or replace function public.submit_diagnostic_attempt(
	p_user_id uuid,
	p_topic_area_id text,
	p_release_id text,
	p_submission_key text,
	p_answers jsonb
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
	from public.diagnostic_attempts
	where user_id = p_user_id and submission_key = p_submission_key;

	if v_existing_attempt_id is not null then
		return query select v_existing_attempt_id;
		return;
	end if;

	insert into public.diagnostic_attempts (
		user_id,
		topic_area_id,
		release_id,
		status,
		submission_key,
		started_at,
		completed_at
	)
	values (
		p_user_id,
		p_topic_area_id,
		p_release_id,
		'completed',
		p_submission_key,
		v_completed_at,
		v_completed_at
	)
	returning id into v_attempt_id;

	insert into public.diagnostic_attempt_answers (
		diagnostic_attempt_id,
		user_id,
		question_id,
		question_version,
		skill_id,
		device,
		selected_choice_id,
		correct_choice_id,
		is_correct,
		answered_at
	)
	select
		v_attempt_id,
		p_user_id,
		input.question_id,
		input.question_version,
		input.skill_id,
		input.device,
		input.selected_choice_id,
		input.correct_choice_id,
		input.selected_choice_id = input.correct_choice_id,
		v_completed_at
	from jsonb_to_recordset(p_answers) as input(
		question_id text,
		question_version int,
		skill_id text,
		device text,
		selected_choice_id text,
		correct_choice_id text
	)
	join public.quiz_question_versions question
		on question.question_id = input.question_id
		and question.version = input.question_version
		and question.skill_id = input.skill_id
		and question.correct_choice_id = input.correct_choice_id;

	insert into public.diagnostic_placement_outcomes (
		diagnostic_attempt_id,
		skill_id,
		outcome,
		confidence
	)
	select
		v_attempt_id,
		answers.skill_id,
		case
			when avg(case when answers.is_correct then 1 else 0 end) >= 0.8 then 'placed_out'
			else 'needs_practice'
		end,
		least(1, round((count(*)::numeric / 2), 2))
	from public.diagnostic_attempt_answers answers
	where answers.diagnostic_attempt_id = v_attempt_id
	group by answers.skill_id;

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
	from public.diagnostic_attempt_answers answers
	where answers.diagnostic_attempt_id = v_attempt_id;

	perform public.record_learning_answer_outcomes(
		p_user_id,
		p_topic_area_id,
		p_release_id,
		'diagnostic',
		v_attempt_id::text,
		coalesce(v_outcomes, '[]'::jsonb)
	);

	return query select v_attempt_id;
end;
$$;

revoke execute on function public.submit_diagnostic_attempt(uuid, text, text, text, jsonb)
	from anon, authenticated, public;
grant execute on function public.submit_diagnostic_attempt(uuid, text, text, text, jsonb)
	to service_role;
