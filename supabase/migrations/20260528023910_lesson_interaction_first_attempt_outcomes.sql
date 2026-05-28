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

	if v_should_record_outcomes then
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
	end if;

	return query select v_attempt_id;
end;
$$;

revoke execute on function public.submit_lesson_interaction_answer(uuid, text, text, text, int, text, jsonb, text)
	from anon, authenticated, public;
grant execute on function public.submit_lesson_interaction_answer(uuid, text, text, text, int, text, jsonb, text)
	to service_role;
