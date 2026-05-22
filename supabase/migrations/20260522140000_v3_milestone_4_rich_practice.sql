alter table public.quiz_question_versions
	drop constraint if exists quiz_question_versions_question_type_check;

alter table public.quiz_question_versions
	add constraint quiz_question_versions_question_type_check
	check (question_type in ('recognition', 'application', 'multiple_select', 'numeric_answer', 'sequencing', 'short_answer'));

alter table public.quiz_question_versions
	add column if not exists correct_choice_ids text[] not null default '{}',
	add column if not exists correct_numeric_value numeric,
	add column if not exists correct_numeric_tolerance numeric not null default 0,
	add column if not exists sequence_items jsonb not null default '[]'::jsonb,
	add column if not exists accepted_answers text[] not null default '{}',
	add column if not exists grading_rubric text;

alter table public.quiz_question_versions
	add constraint quiz_question_versions_sequence_items_array
	check (jsonb_typeof(sequence_items) = 'array');

create or replace function app_private.grade_question_answer(
	p_question public.quiz_question_versions,
	p_answer jsonb
)
returns boolean
language plpgsql
stable
as $$
declare
	v_selected_choice_id text;
	v_value_text text;
	v_numeric_value numeric;
	v_expected text[];
	v_actual text[];
begin
	if p_question.question_type in ('recognition', 'application') then
		v_selected_choice_id := coalesce(p_answer ->> 'selected_choice_id', p_answer ->> 'answer_value');
		return v_selected_choice_id = p_question.correct_choice_id;
	end if;

	if p_question.question_type = 'multiple_select' then
		select coalesce(array_agg(value order by value), '{}')
		into v_actual
		from jsonb_array_elements_text(coalesce(p_answer -> 'answer_value', '[]'::jsonb)) as value;

		select coalesce(array_agg(value order by value), '{}')
		into v_expected
		from unnest(p_question.correct_choice_ids) as value;

		return v_actual = v_expected and array_length(v_expected, 1) > 0;
	end if;

	if p_question.question_type = 'numeric_answer' then
		v_value_text := case
			when jsonb_typeof(p_answer -> 'answer_value') = 'object' then p_answer #>> '{answer_value,value}'
			else p_answer ->> 'answer_value'
		end;
		if v_value_text is null or v_value_text !~ '^-?[0-9]+(\.[0-9]+)?$' then
			return false;
		end if;

		v_numeric_value := v_value_text::numeric;
		return abs(v_numeric_value - coalesce(p_question.correct_numeric_value, 0)) <= p_question.correct_numeric_tolerance;
	end if;

	if p_question.question_type = 'sequencing' then
		select coalesce(array_agg(value order by ordinal), '{}')
		into v_actual
		from jsonb_array_elements_text(coalesce(p_answer -> 'answer_value', '[]'::jsonb)) with ordinality as item(value, ordinal);

		select coalesce(array_agg(item ->> 'id' order by ordinal), '{}')
		into v_expected
		from jsonb_array_elements(coalesce(p_question.sequence_items, '[]'::jsonb)) with ordinality as item(item, ordinal);

		return v_actual = v_expected and array_length(v_expected, 1) > 0;
	end if;

	if p_question.question_type = 'short_answer' then
		v_value_text := lower(regexp_replace(trim(coalesce(p_answer ->> 'answer_value', '')), '\s+', ' ', 'g'));
		return exists (
			select 1
			from unnest(p_question.accepted_answers) as accepted(answer)
			where lower(regexp_replace(trim(accepted.answer), '\s+', ' ', 'g')) = v_value_text
		);
	end if;

	return false;
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
	v_activity_at timestamptz := now();
	v_activity_id uuid;
	v_attempt_id uuid;
	v_existing_attempt record;
	v_source_key text;
	v_question record;
	v_answer jsonb;
	v_selected_text text;
	v_correct_text text;
	v_is_correct boolean;
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
			answer_value jsonb
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
			answer_value jsonb
		)
		where answer.question_id = v_question.question_id;

		v_is_correct := app_private.grade_question_answer(v_question, v_answer);
		v_selected_text := coalesce(v_answer ->> 'selected_choice_id', v_answer ->> 'answer_value', '');
		v_correct_text := case
			when v_question.question_type in ('recognition', 'application') then v_question.correct_choice_id
			when v_question.question_type = 'multiple_select' then array_to_string(v_question.correct_choice_ids, ',')
			when v_question.question_type = 'numeric_answer' then coalesce(v_question.correct_numeric_value::text, '')
			when v_question.question_type = 'sequencing' then v_question.sequence_items::text
			else array_to_string(v_question.accepted_answers, ',')
		end;

		insert into public.quiz_attempt_answers (
			attempt_id, user_id, question_id, question_version, skill_id, device,
			selected_choice_id, correct_choice_id, is_correct, answered_at
		)
		values (
			v_attempt_id, p_user_id, v_question.question_id, v_question.version, v_question.skill_id, v_question.device,
			v_selected_text, v_correct_text, v_is_correct, v_activity_at
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
		'response_time_ms', 0
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
	v_selected_text text;
	v_correct_text text;
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
			answer_value jsonb
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
			answer_value jsonb
		)
		where answer.question_id = v_question.question_id;

		v_is_correct := app_private.grade_question_answer(v_question, v_answer);
		v_selected_text := coalesce(v_answer ->> 'selected_choice_id', v_answer ->> 'answer_value', '');
		v_correct_text := case
			when v_question.question_type in ('recognition', 'application') then v_question.correct_choice_id
			when v_question.question_type = 'multiple_select' then array_to_string(v_question.correct_choice_ids, ',')
			when v_question.question_type = 'numeric_answer' then coalesce(v_question.correct_numeric_value::text, '')
			when v_question.question_type = 'sequencing' then v_question.sequence_items::text
			else array_to_string(v_question.accepted_answers, ',')
		end;

		insert into public.quiz_attempt_answers (
			attempt_id, user_id, question_id, question_version, skill_id, device,
			selected_choice_id, correct_choice_id, is_correct, answered_at
		)
		values (
			v_attempt_id, p_user_id, v_question.question_id, v_question.version, v_question.skill_id, v_question.device,
			v_selected_text, v_correct_text, v_is_correct, v_activity_at
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
		'response_time_ms', 0
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
