alter table public.spaced_repetition_items
	add column if not exists consecutive_correct_count int not null default 0 check (consecutive_correct_count >= 0);

alter table public.spaced_repetition_reviews
	add column if not exists is_correct boolean,
	add column if not exists elapsed_days int,
	add column if not exists lateness_days int;

alter table public.quiz_attempt_answers
	add column if not exists response_time_ms int not null default 0 check (response_time_ms >= 0);

alter table public.diagnostic_attempt_answers
	add column if not exists response_time_ms int not null default 0 check (response_time_ms >= 0);

alter table public.lesson_interaction_attempt_answers
	add column if not exists response_time_ms int not null default 0 check (response_time_ms >= 0);

create or replace function app_private.answer_response_time_ms(p_answer jsonb)
returns int
language sql
immutable
as $$
	select case
		when coalesce(p_answer ->> 'response_time_ms', '') ~ '^\d+$'
			then least((p_answer ->> 'response_time_ms')::int, 3600000)
		else 0
	end;
$$;

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
	v_previous_consecutive_correct_count int;
	v_next_consecutive_correct_count int;
	v_previous_interval int;
	v_next_interval int;
	v_previous_ease numeric;
	v_next_ease numeric;
	v_review_event_id uuid;
	v_reviewed_at timestamptz;
	v_response_time_ms int;
	v_elapsed_days int;
	v_lateness_days int;
	v_late_boost numeric;
	v_difficulty text;
	v_difficulty_multiplier numeric;
	v_candidate_interval int;
	v_max_interval_days constant int := 1095;
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
		v_response_time_ms := least(greatest(coalesce(v_answer.response_time_ms, 0), 0), 3600000);
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

		select coalesce(question.difficulty, 'medium')
		into v_difficulty
		from public.quiz_question_versions question
		where question.question_id = v_answer.question_id
			and question.version = v_answer.question_version;
		v_difficulty := coalesce(v_difficulty, 'medium');

		v_item_id := v_item.id;
		v_previous_state := coalesce(v_item.state, 'new');
		v_previous_review_count := coalesce(v_item.review_count, 0);
		v_previous_lapse_count := coalesce(v_item.lapse_count, 0);
		v_previous_consecutive_correct_count := coalesce(v_item.consecutive_correct_count, 0);
		v_previous_interval := coalesce(v_item.interval_days, 0);
		v_previous_ease := coalesce(v_item.ease_factor, 2.5);
		v_elapsed_days := case
			when v_item.last_reviewed_at is null then 0
			else greatest(0, floor(extract(epoch from (v_reviewed_at - v_item.last_reviewed_at)) / 86400)::int)
		end;
		v_lateness_days := greatest(0, v_elapsed_days - v_previous_interval);

		if not v_answer.is_correct then
			v_grade_label := 'again';
		elsif v_response_time_ms >= 45000 then
			v_grade_label := 'hard';
		elsif (
			v_previous_interval > 0
			and v_lateness_days >= ceil(v_previous_interval * 0.5)::int
			and v_elapsed_days > v_previous_interval
			and (v_response_time_ms = 0 or v_response_time_ms <= 10000)
		) or (
			v_response_time_ms > 0
			and v_response_time_ms <= 10000
			and v_previous_consecutive_correct_count >= 2
			and v_difficulty <> 'hard'
		) then
			v_grade_label := 'easy';
		else
			v_grade_label := 'good';
		end if;

		v_grade := case v_grade_label
			when 'again' then 1
			when 'hard' then 3
			when 'easy' then 5
			else 4
		end;

		v_next_review_count := v_previous_review_count + 1;
		v_next_lapse_count := v_previous_lapse_count + case when v_grade_label = 'again' then 1 else 0 end;
		v_next_consecutive_correct_count := case
			when v_grade_label = 'again' then 0
			else v_previous_consecutive_correct_count + 1
		end;

		v_next_ease := case v_grade_label
			when 'again' then greatest(1.3, round((v_previous_ease - 0.20)::numeric, 2))
			when 'hard' then greatest(1.3, round((v_previous_ease - 0.05)::numeric, 2))
			when 'easy' then least(3.0, greatest(1.3, round((v_previous_ease + 0.08)::numeric, 2)))
			else least(3.0, greatest(1.3, round((v_previous_ease + 0.03)::numeric, 2)))
		end;

		if v_grade_label = 'again' then
			v_next_interval := case
				when v_previous_interval < 7 then 1
				else greatest(1, least(7, round(v_previous_interval * 0.15)::int))
			end;
		elsif v_grade_label = 'hard' then
			v_next_interval := case
				when v_next_consecutive_correct_count <= 1 then 1
				else least(v_max_interval_days, greatest(1, ceil(greatest(1, v_previous_interval) * 1.2)::int))
			end;
		elsif v_next_consecutive_correct_count = 1 then
			v_next_interval := least(v_max_interval_days, case
				when v_grade_label = 'easy' then 4
				when v_difficulty = 'easy' then 2
				else 1
			end);
		elsif v_next_consecutive_correct_count = 2 then
			v_next_interval := least(v_max_interval_days, case
				when v_grade_label = 'easy' then greatest(8, case when v_difficulty = 'hard' then 4 when v_difficulty = 'easy' then 8 else 6 end)
				when v_difficulty = 'hard' then 4
				when v_difficulty = 'easy' then 8
				else 6
			end);
		else
			v_late_boost := case
				when v_lateness_days <= 0 or v_previous_interval <= 0 then 1
				else 1 + least(0.5, (v_lateness_days::numeric / v_previous_interval) * 0.25)
			end;
			v_difficulty_multiplier := case v_difficulty
				when 'easy' then 1.15
				when 'hard' then 0.85
				else 1
			end;
			v_candidate_interval := round(
				greatest(1, v_previous_interval)
				* v_next_ease
				* case when v_grade_label = 'easy' then 1.3 else 1 end
				* v_late_boost
				* v_difficulty_multiplier
			)::int;
			v_next_interval := least(
				v_max_interval_days,
				greatest(
					1,
					case when v_previous_interval >= v_max_interval_days then v_max_interval_days else v_previous_interval + 1 end,
					v_candidate_interval
				)
			);
		end if;

		v_next_state := case
			when v_next_interval < 2 then 'learning'
			when v_next_interval >= 90 then 'mastered'
			else 'review'
		end;

		insert into public.spaced_repetition_reviews (
			item_id,
			source_key,
			user_id,
			topic_area_id,
			question_id,
			question_version,
			grade,
			grade_label,
			is_correct,
			response_time_ms,
			elapsed_days,
			lateness_days,
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
			v_answer.is_correct,
			v_response_time_ms,
			v_elapsed_days,
			v_lateness_days,
			jsonb_build_object(
				'learningState', v_previous_state,
				'reviewCount', v_previous_review_count,
				'lapseCount', v_previous_lapse_count,
				'consecutiveCorrectCount', v_previous_consecutive_correct_count,
				'easeFactor', v_previous_ease,
				'intervalDays', v_previous_interval,
				'dueAt', v_item.due_at,
				'lastReviewedAt', v_item.last_reviewed_at
			),
			jsonb_build_object(
				'learningState', v_next_state,
				'reviewCount', v_next_review_count,
				'lapseCount', v_next_lapse_count,
				'consecutiveCorrectCount', v_next_consecutive_correct_count,
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
				consecutive_correct_count = v_next_consecutive_correct_count,
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
	v_should_record_outcomes boolean := false;
begin
	if coalesce(p_submission_key, '') = '' then
		raise exception 'submission key is required';
	end if;

	if jsonb_typeof(p_answers) <> 'array' then
		raise exception 'answers must be a JSON array';
	end if;

	perform pg_advisory_xact_lock(
		hashtext(p_user_id::text),
		hashtext(p_release_id || ':' || p_lesson_id || ':' || p_lesson_version::text || ':' || p_interaction_slug)
	);

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

	select not exists (
		select 1
		from public.lesson_interaction_attempts
		where user_id = p_user_id
			and release_id = p_release_id
			and lesson_id = p_lesson_id
			and lesson_version = p_lesson_version
			and interaction_slug = p_interaction_slug
	)
	into v_should_record_outcomes;

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
		answered_at,
		response_time_ms
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
		v_completed_at,
		app_private.answer_response_time_ms(to_jsonb(input))
	from jsonb_to_recordset(p_answers) as input(
		question_id text,
		question_version int,
		selected_choice_id text,
		answer_value jsonb,
		response_time_ms int
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

	if v_should_record_outcomes then
		select jsonb_agg(
			jsonb_build_object(
				'question_id', answers.question_id,
				'question_version', answers.question_version,
				'skill_id', answers.skill_id,
				'is_correct', answers.is_correct,
				'answered_at', answers.answered_at,
				'response_time_ms', answers.response_time_ms
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
	end if;

	return query select v_attempt_id;
end;
$$;

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
	v_question_count int := 0;
	v_inserted_count int := 0;
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

	select count(*)
	into v_question_count
	from public.diagnostic_question_versions
	where topic_area_id = p_topic_area_id
		and release_id = p_release_id;

	if jsonb_array_length(p_answers) <> v_question_count then
		raise exception 'answer count does not match diagnostic question count';
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
		answered_at,
		answer_value,
		correct_answer_value,
		grading_strategy,
		response_time_ms
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
		v_completed_at,
		grade.answer_value,
		grade.correct_answer_value,
		grade.grading_strategy,
		app_private.answer_response_time_ms(to_jsonb(input))
	from jsonb_to_recordset(p_answers) as input(
		question_id text,
		question_version int,
		skill_id text,
		device text,
		selected_choice_id text,
		answer_value jsonb,
		response_time_ms int
	)
	join public.diagnostic_question_versions diagnostic_question
		on diagnostic_question.topic_area_id = p_topic_area_id
		and diagnostic_question.release_id = p_release_id
		and diagnostic_question.question_id = input.question_id
		and diagnostic_question.question_version = input.question_version
	join public.quiz_question_versions question
		on question.question_id = input.question_id
		and question.version = input.question_version
		and question.skill_id = input.skill_id
	cross join lateral app_private.grade_question_result(question, to_jsonb(input)) grade;

	get diagnostics v_inserted_count = row_count;
	if v_inserted_count <> v_question_count then
		raise exception 'diagnostic answers did not match expected questions';
	end if;

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
			'response_time_ms', answers.response_time_ms
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
	v_activity_at timestamptz := now();
	v_activity_id uuid;
	v_attempt_id uuid;
	v_existing_attempt record;
	v_source_key text;
	v_question record;
	v_answer jsonb;
	v_grade record;
	v_is_correct boolean;
	v_correct_count int := 0;
	v_question_count int := 0;
	v_score numeric(5, 2) := 0;
	v_xp_awarded int := 0;
	v_xp_points int := app_private.xp_points('quiz_attempt');
	v_outcomes jsonb;
begin
	if p_submission_key is null or length(trim(p_submission_key)) = 0 then
		raise exception 'submission_key is required';
	end if;

	if jsonb_typeof(p_answers) <> 'array' then
		raise exception 'answers must be a JSON array';
	end if;

	v_source_key := 'quiz:' || p_release_id || ':' || p_quiz_id || '@' || p_quiz_version || ':' || p_submission_key;

	select id, score, correct_count, question_count
	into v_existing_attempt
	from public.quiz_attempts
	where user_id = p_user_id and submission_key = p_submission_key;

	if found then
		select id into v_activity_id from public.activity_events
		where user_id = p_user_id and source_key = v_source_key;

		return query
		select v_existing_attempt.id, v_activity_id, v_existing_attempt.score, v_existing_attempt.correct_count, v_existing_attempt.question_count, 0;
		return;
	end if;

	if not exists (
		select 1
		from public.content_release_items
		where release_id = p_release_id
			and content_type = 'quiz'
			and content_id = p_quiz_id
			and content_version = p_quiz_version
	) then
		raise exception 'quiz is not part of release';
	end if;

	select count(*)
	into v_question_count
	from public.quiz_question_to_quiz link
	join public.quiz_question_versions question
		on question.question_id = link.question_id
		and question.version = link.question_version
	where link.quiz_id = p_quiz_id
		and link.quiz_version = p_quiz_version
		and question.lifecycle_status = 'active';

	if jsonb_array_length(p_answers) <> v_question_count then
		raise exception 'answer count does not match quiz question count';
	end if;

	for v_question in
		select question.*
		from public.quiz_question_to_quiz link
		join public.quiz_question_versions question
			on question.question_id = link.question_id
			and question.version = link.question_version
		where link.quiz_id = p_quiz_id
			and link.quiz_version = p_quiz_version
			and question.lifecycle_status = 'active'
		order by link.ordering
	loop
		select to_jsonb(answer)
		into v_answer
		from jsonb_to_recordset(p_answers) as answer(
			question_id text,
			selected_choice_id text,
			answer_value jsonb,
			response_time_ms int
		)
		where answer.question_id = v_question.question_id;

		if v_answer is null then
			raise exception 'missing answer for question %', v_question.question_id;
		end if;

		v_is_correct := app_private.grade_question_answer(v_question, v_answer);
		if v_is_correct then
			v_correct_count := v_correct_count + 1;
		end if;
	end loop;

	v_score := round((v_correct_count::numeric / greatest(v_question_count, 1)) * 100, 2);

	insert into public.quiz_attempts (
		user_id, quiz_id, quiz_version, release_id, score, correct_count, question_count,
		attempt_kind, submission_key, completed_at
	)
	values (
		p_user_id, p_quiz_id, p_quiz_version, p_release_id, v_score, v_correct_count, v_question_count,
		'quiz', p_submission_key, v_activity_at
	)
	on conflict (user_id, submission_key) where submission_key is not null do nothing
	returning id into v_attempt_id;

	if v_attempt_id is null then
		select id, score, correct_count, question_count
		into v_existing_attempt
		from public.quiz_attempts
		where user_id = p_user_id and submission_key = p_submission_key;

		select id into v_activity_id from public.activity_events
		where user_id = p_user_id and source_key = v_source_key;

		return query
		select v_existing_attempt.id, v_activity_id, v_existing_attempt.score, v_existing_attempt.correct_count, v_existing_attempt.question_count, 0;
		return;
	end if;

	for v_question in
		select question.*
		from public.quiz_question_to_quiz link
		join public.quiz_question_versions question
			on question.question_id = link.question_id
			and question.version = link.question_version
		where link.quiz_id = p_quiz_id
			and link.quiz_version = p_quiz_version
			and question.lifecycle_status = 'active'
		order by link.ordering
	loop
		select to_jsonb(answer)
		into v_answer
		from jsonb_to_recordset(p_answers) as answer(
			question_id text,
			selected_choice_id text,
			answer_value jsonb,
			response_time_ms int
		)
		where answer.question_id = v_question.question_id;

		select *
		into v_grade
		from app_private.grade_question_result(v_question, v_answer);

		insert into public.quiz_attempt_answers (
			attempt_id, user_id, question_id, question_version, skill_id, device,
			selected_choice_id, correct_choice_id, is_correct, answered_at,
			answer_value, correct_answer_value, grading_strategy, response_time_ms
		)
		values (
			v_attempt_id, p_user_id, v_question.question_id, v_question.version, v_question.skill_id, v_question.device,
			v_grade.selected_choice_id, v_grade.correct_choice_id, v_grade.is_correct, v_activity_at,
			v_grade.answer_value, v_grade.correct_answer_value, v_grade.grading_strategy, app_private.answer_response_time_ms(v_answer)
		);
	end loop;

	insert into public.activity_events (
		user_id, topic_area_id, release_id, activity_type, source_type, source_id, source_version, source_key, metadata, occurred_at
	)
	values (
		p_user_id, p_topic_area_id, p_release_id, 'quiz_completed', 'quiz', p_quiz_id, p_quiz_version, v_source_key,
		jsonb_build_object('attempt_id', v_attempt_id, 'score', v_score, 'correct_count', v_correct_count, 'question_count', v_question_count),
		v_activity_at
	)
	on conflict (user_id, source_key) do update set metadata = public.activity_events.metadata
	returning id into v_activity_id;

	insert into public.xp_events (user_id, source_type, source_id, points)
	values (p_user_id, 'quiz_attempt', v_source_key, v_xp_points)
	on conflict (user_id, source_type, source_id) do nothing;
	get diagnostics v_xp_awarded = row_count;
	v_xp_awarded := v_xp_awarded * v_xp_points;

	perform app_private.touch_streak(p_user_id, v_activity_id, v_activity_at);

	insert into public.user_progress (
		user_id, topic_area_id, release_id, intro_lesson_completed, quiz_completed,
		latest_attempt_id, latest_score, best_score, total_attempts
	)
	values (p_user_id, p_topic_area_id, p_release_id, true, true, v_attempt_id, v_score, v_score, 1)
	on conflict (user_id, topic_area_id, release_id) do update
		set intro_lesson_completed = true,
			quiz_completed = true,
			latest_attempt_id = v_attempt_id,
			latest_score = v_score,
			best_score = greatest(coalesce(public.user_progress.best_score, 0), v_score),
			total_attempts = public.user_progress.total_attempts + 1,
			updated_at = now();

	insert into public.daily_goal_settings (user_id)
	values (p_user_id)
	on conflict (user_id) do nothing;

	select jsonb_agg(jsonb_build_object(
		'question_id', answers.question_id,
		'question_version', answers.question_version,
		'skill_id', answers.skill_id,
		'is_correct', answers.is_correct,
		'answered_at', answers.answered_at,
		'response_time_ms', answers.response_time_ms
	))
	into v_outcomes
	from public.quiz_attempt_answers answers
	where answers.attempt_id = v_attempt_id;

	perform public.record_learning_answer_outcomes(
		p_user_id, p_topic_area_id, p_release_id, 'quiz', v_attempt_id::text, coalesce(v_outcomes, '[]'::jsonb)
	);

	return query
	select v_attempt_id, v_activity_id, v_score, v_correct_count, v_question_count, v_xp_awarded;
end;
$$;

revoke execute on function public.record_learning_answer_outcomes(uuid, text, text, text, text, jsonb, numeric)
	from anon, authenticated, public;
grant execute on function public.record_learning_answer_outcomes(uuid, text, text, text, text, jsonb, numeric)
	to service_role;

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
begin
	perform public.record_learning_answer_outcomes(
		p_user_id,
		p_topic_area_id,
		p_release_id,
		p_source,
		p_source_id,
		p_outcomes,
		1.0
	);
end;
$$;

revoke execute on function public.record_learning_answer_outcomes(uuid, text, text, text, text, jsonb)
	from anon, authenticated, public;
grant execute on function public.record_learning_answer_outcomes(uuid, text, text, text, text, jsonb)
	to service_role;

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
	v_activity_at timestamptz := now();
	v_activity_id uuid;
	v_attempt_id uuid;
	v_existing_attempt record;
	v_source_key text;
	v_question record;
	v_answer jsonb;
	v_grade record;
	v_correct_count int := 0;
	v_question_count int := 0;
	v_score numeric(5, 2) := 0;
	v_xp_awarded int := 0;
	v_xp_points int := app_private.xp_points('review_attempt');
	v_outcomes jsonb;
begin
	if p_submission_key is null or length(trim(p_submission_key)) = 0 then
		raise exception 'submission_key is required';
	end if;

	if jsonb_typeof(p_answers) <> 'array' then
		raise exception 'answers must be a JSON array';
	end if;

	v_source_key := 'review:' || p_release_id || ':' || p_review_session_id || ':' || p_submission_key;

	select id, score, correct_count, question_count
	into v_existing_attempt
	from public.quiz_attempts
	where user_id = p_user_id and submission_key = p_submission_key;

	if found then
		select id into v_activity_id from public.activity_events
		where user_id = p_user_id and source_key = v_source_key;

		return query
		select v_existing_attempt.id, v_activity_id, v_existing_attempt.score, v_existing_attempt.correct_count, v_existing_attempt.question_count, 0;
		return;
	end if;

	if not exists (
		select 1
		from public.review_sessions
		where id = p_review_session_id
			and user_id = p_user_id
			and topic_area_id = p_topic_area_id
			and release_id = p_release_id
			and status = 'created'
	) then
		raise exception 'review session is not active';
	end if;

	select count(*)
	into v_question_count
	from public.review_session_questions
	where review_session_id = p_review_session_id;

	if jsonb_array_length(p_answers) <> v_question_count then
		raise exception 'answer count does not match review question count';
	end if;

	for v_question in
		select question.*
		from public.review_session_questions review_question
		join public.quiz_question_versions question
			on question.question_id = review_question.question_id
			and question.version = review_question.question_version
		where review_question.review_session_id = p_review_session_id
		order by review_question.ordering
	loop
		select to_jsonb(answer)
		into v_answer
		from jsonb_to_recordset(p_answers) as answer(
			question_id text,
			selected_choice_id text,
			answer_value jsonb,
			response_time_ms int
		)
		where answer.question_id = v_question.question_id;

		if v_answer is null then
			raise exception 'missing answer for question %', v_question.question_id;
		end if;

		if app_private.grade_question_answer(v_question, v_answer) then
			v_correct_count := v_correct_count + 1;
		end if;
	end loop;

	v_score := round((v_correct_count::numeric / greatest(v_question_count, 1)) * 100, 2);

	insert into public.quiz_attempts (
		user_id, release_id, score, correct_count, question_count, attempt_kind,
		review_session_id, submission_key, completed_at
	)
	values (
		p_user_id, p_release_id, v_score, v_correct_count, v_question_count, 'review',
		p_review_session_id, p_submission_key, v_activity_at
	)
	on conflict (user_id, submission_key) where submission_key is not null do nothing
	returning id into v_attempt_id;

	if v_attempt_id is null then
		select id, score, correct_count, question_count
		into v_existing_attempt
		from public.quiz_attempts
		where user_id = p_user_id and submission_key = p_submission_key;

		select id into v_activity_id from public.activity_events
		where user_id = p_user_id and source_key = v_source_key;

		return query
		select v_existing_attempt.id, v_activity_id, v_existing_attempt.score, v_existing_attempt.correct_count, v_existing_attempt.question_count, 0;
		return;
	end if;

	for v_question in
		select question.*
		from public.review_sessions review_session
		join public.review_session_questions review_question
			on review_question.review_session_id = review_session.id
		join public.quiz_question_versions question
			on question.question_id = review_question.question_id
			and question.version = review_question.question_version
		where review_session.id = p_review_session_id
		order by review_question.ordering
	loop
		select to_jsonb(answer)
		into v_answer
		from jsonb_to_recordset(p_answers) as answer(
			question_id text,
			selected_choice_id text,
			answer_value jsonb,
			response_time_ms int
		)
		where answer.question_id = v_question.question_id;

		select *
		into v_grade
		from app_private.grade_question_result(v_question, v_answer);

		insert into public.quiz_attempt_answers (
			attempt_id, user_id, question_id, question_version, skill_id, device,
			selected_choice_id, correct_choice_id, is_correct, answered_at,
			answer_value, correct_answer_value, grading_strategy, response_time_ms
		)
		values (
			v_attempt_id, p_user_id, v_question.question_id, v_question.version, v_question.skill_id, v_question.device,
			v_grade.selected_choice_id, v_grade.correct_choice_id, v_grade.is_correct, v_activity_at,
			v_grade.answer_value, v_grade.correct_answer_value, v_grade.grading_strategy, app_private.answer_response_time_ms(v_answer)
		);
	end loop;

	insert into public.activity_events (
		user_id, topic_area_id, release_id, activity_type, source_type, source_id, source_key, metadata, occurred_at
	)
	values (
		p_user_id, p_topic_area_id, p_release_id, 'review_completed', 'review_session', p_review_session_id::text, v_source_key,
		jsonb_build_object('attempt_id', v_attempt_id, 'score', v_score, 'correct_count', v_correct_count, 'question_count', v_question_count),
		v_activity_at
	)
	on conflict (user_id, source_key) do update set metadata = public.activity_events.metadata
	returning id into v_activity_id;

	insert into public.xp_events (user_id, source_type, source_id, points)
	values (p_user_id, 'review_attempt', v_source_key, v_xp_points)
	on conflict (user_id, source_type, source_id) do nothing;
	get diagnostics v_xp_awarded = row_count;
	v_xp_awarded := v_xp_awarded * v_xp_points;

	perform app_private.touch_streak(p_user_id, v_activity_id, v_activity_at);

	update public.review_sessions
	set status = 'completed', completed_at = v_activity_at
	where id = p_review_session_id;

	insert into public.user_progress (
		user_id, topic_area_id, release_id, latest_attempt_id, latest_score, best_score, total_attempts
	)
	values (p_user_id, p_topic_area_id, p_release_id, v_attempt_id, v_score, v_score, 1)
	on conflict (user_id, topic_area_id, release_id) do update
		set latest_attempt_id = v_attempt_id,
			latest_score = v_score,
			best_score = greatest(coalesce(public.user_progress.best_score, 0), v_score),
			total_attempts = public.user_progress.total_attempts + 1,
			updated_at = now();

	insert into public.daily_goal_settings (user_id)
	values (p_user_id)
	on conflict (user_id) do nothing;

	select jsonb_agg(jsonb_build_object(
		'question_id', answers.question_id,
		'question_version', answers.question_version,
		'skill_id', answers.skill_id,
		'is_correct', answers.is_correct,
		'answered_at', answers.answered_at,
		'response_time_ms', answers.response_time_ms
	))
	into v_outcomes
	from public.quiz_attempt_answers answers
	where answers.attempt_id = v_attempt_id;

	perform public.record_learning_answer_outcomes(
		p_user_id, p_topic_area_id, p_release_id, 'review', v_attempt_id::text, coalesce(v_outcomes, '[]'::jsonb)
	);

	return query
	select v_attempt_id, v_activity_id, v_score, v_correct_count, v_question_count, v_xp_awarded;
end;
$$;
