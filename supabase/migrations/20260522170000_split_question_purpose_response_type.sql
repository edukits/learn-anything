alter table public.quiz_question_versions
	drop constraint if exists quiz_question_versions_question_type_check;

alter table public.quiz_question_versions
	add column if not exists question_purpose text,
	add column if not exists response_type text;

update public.quiz_question_versions
set
	question_purpose = case
		when question_type in ('recognition', 'application') then question_type
		else 'application'
	end,
	response_type = case
		when question_type in ('recognition', 'application') then 'multiple_choice'
		when question_type = 'numeric_answer' then 'numeric'
		else question_type
	end
where question_purpose is null or response_type is null;

alter table public.quiz_question_versions
	alter column question_purpose set not null,
	alter column question_purpose set default 'application',
	alter column response_type set not null,
	alter column response_type set default 'multiple_choice';

alter table public.quiz_question_versions
	drop column if exists question_type;

alter table public.quiz_question_versions
	add constraint quiz_question_versions_question_purpose_check
	check (question_purpose in ('recognition', 'application')),
	add constraint quiz_question_versions_response_type_check
	check (response_type in ('multiple_choice', 'multiple_select', 'numeric', 'sequencing', 'short_answer'));

create or replace function app_private.submitted_answer_value(
	p_question public.quiz_question_versions,
	p_answer jsonb
)
returns jsonb
language sql
stable
as $$
	select case
		when p_question.response_type = 'multiple_choice'
			then to_jsonb(coalesce(nullif(p_answer ->> 'selected_choice_id', ''), p_answer ->> 'answer_value', ''))
		else coalesce(p_answer -> 'answer_value', 'null'::jsonb)
	end;
$$;

create or replace function app_private.correct_answer_value(
	p_question public.quiz_question_versions
)
returns jsonb
language sql
stable
as $$
	select case
		when p_question.response_type = 'multiple_choice' then to_jsonb(p_question.correct_choice_id)
		when p_question.response_type = 'multiple_select' then to_jsonb(p_question.correct_choice_ids)
		when p_question.response_type = 'numeric' then jsonb_build_object(
			'value', p_question.correct_numeric_value,
			'tolerance', p_question.correct_numeric_tolerance
		)
		when p_question.response_type = 'sequencing' then p_question.sequence_items
		when p_question.response_type = 'short_answer' then to_jsonb(p_question.accepted_answers)
		else 'null'::jsonb
	end;
$$;

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
	if p_question.response_type = 'multiple_choice' then
		v_selected_choice_id := coalesce(nullif(p_answer ->> 'selected_choice_id', ''), p_answer ->> 'answer_value');
		return v_selected_choice_id = p_question.correct_choice_id;
	end if;

	if p_question.response_type = 'multiple_select' then
		select coalesce(array_agg(value order by value), '{}')
		into v_actual
		from jsonb_array_elements_text(coalesce(p_answer -> 'answer_value', '[]'::jsonb)) as value;

		select coalesce(array_agg(value order by value), '{}')
		into v_expected
		from unnest(p_question.correct_choice_ids) as value;

		return v_actual = v_expected and array_length(v_expected, 1) > 0;
	end if;

	if p_question.response_type = 'numeric' then
		v_value_text := case
			when jsonb_typeof(p_answer -> 'answer_value') = 'object' then p_answer #>> '{answer_value,value}'
			else p_answer ->> 'answer_value'
		end;
		if v_value_text is null or v_value_text !~ '^-?([0-9]+|[0-9]*\.[0-9]+)$' then
			return false;
		end if;

		v_numeric_value := v_value_text::numeric;
		return abs(v_numeric_value - coalesce(p_question.correct_numeric_value, 0)) <= p_question.correct_numeric_tolerance;
	end if;

	if p_question.response_type = 'sequencing' then
		select coalesce(array_agg(value order by ordinal), '{}')
		into v_actual
		from jsonb_array_elements_text(coalesce(p_answer -> 'answer_value', '[]'::jsonb)) with ordinality as item(value, ordinal);

		select coalesce(array_agg(item ->> 'id' order by ordinal), '{}')
		into v_expected
		from jsonb_array_elements(coalesce(p_question.sequence_items, '[]'::jsonb)) with ordinality as item(item, ordinal);

		return v_actual = v_expected and array_length(v_expected, 1) > 0;
	end if;

	if p_question.response_type = 'short_answer' then
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

create or replace function app_private.grade_question_result(
	p_question public.quiz_question_versions,
	p_answer jsonb
)
returns table (
	selected_choice_id text,
	correct_choice_id text,
	answer_value jsonb,
	correct_answer_value jsonb,
	grading_strategy text,
	is_correct boolean
)
language sql
stable
as $$
	select
		coalesce(
			nullif(p_answer ->> 'selected_choice_id', ''),
			app_private.answer_jsonb_text(app_private.submitted_answer_value(p_question, p_answer)),
			''
		),
		coalesce(
			case
				when p_question.response_type = 'multiple_choice' then p_question.correct_choice_id
				else app_private.answer_jsonb_text(app_private.correct_answer_value(p_question))
			end,
			''
		),
		app_private.submitted_answer_value(p_question, p_answer),
		app_private.correct_answer_value(p_question),
		p_question.response_type,
		app_private.grade_question_answer(p_question, p_answer);
$$;

drop function if exists public.get_content_quality_dashboard(uuid);

create or replace function public.get_content_quality_dashboard(p_admin_user_id uuid)
returns table (
	subject_area_id text,
	subject_name text,
	topic_area_id text,
	topic_name text,
	release_id text,
	release_title text,
	question_purpose text,
	response_type text,
	question_count int,
	answer_count int,
	correct_rate numeric,
	open_issue_count int
)
language sql
security definer
set search_path = public, app_private
as $$
	with admin_gate as (
		select app_private.is_content_admin(p_admin_user_id) as allowed
	),
	questions as (
		select
			subject_version.subject_area_id,
			subject_version.name as subject_name,
			metadata.topic_area_id,
			metadata.name as topic_name,
			release.id as release_id,
			release.title as release_title,
			question.question_purpose,
			question.response_type,
			question.question_id,
			question.version
		from admin_gate
		join public.content_releases release on admin_gate.allowed
		join public.content_release_items item
			on item.release_id = release.id
		join public.quiz_question_versions question
			on question.question_id = item.content_id
			and question.version = item.content_version
		left join public.topic_discovery_metadata metadata
			on metadata.release_id = item.release_id
		left join public.topic_areas topic
			on topic.id = metadata.topic_area_id
		left join lateral (
			select version.*
			from public.subject_area_versions version
			where version.subject_area_id = topic.subject_area_id
			order by version.version desc
			limit 1
		) subject_version on true
		where item.content_type = 'quiz_question'
	),
	answers as (
		select
			attempt.release_id,
			answer.question_id,
			answer.question_version,
			count(*)::int as answer_count,
			count(*) filter (where answer.is_correct)::int as correct_count
		from public.quiz_attempt_answers answer
		join public.quiz_attempts attempt
			on attempt.id = answer.attempt_id
		group by attempt.release_id, answer.question_id, answer.question_version
	),
	issues as (
		select
			release_id,
			content_id,
			content_version,
			count(*) filter (where status in ('open', 'triaged'))::int as open_issue_count
		from public.content_issue_reports
		group by release_id, content_id, content_version
	)
	select
		questions.subject_area_id,
		coalesce(questions.subject_name, questions.subject_area_id) as subject_name,
		questions.topic_area_id,
		coalesce(questions.topic_name, questions.topic_area_id) as topic_name,
		questions.release_id,
		questions.release_title,
		questions.question_purpose,
		questions.response_type,
		count(*)::int as question_count,
		coalesce(sum(answers.answer_count), 0)::int as answer_count,
		case
			when coalesce(sum(answers.answer_count), 0) = 0 then null
			else round(sum(answers.correct_count)::numeric / sum(answers.answer_count), 3)
		end as correct_rate,
		coalesce(sum(issues.open_issue_count), 0)::int as open_issue_count
	from questions
	left join answers
		on answers.release_id = questions.release_id
		and answers.question_id = questions.question_id
		and answers.question_version = questions.version
	left join issues
		on issues.release_id = questions.release_id
		and issues.content_id = questions.question_id
		and issues.content_version = questions.version
	group by
		questions.subject_area_id,
		questions.subject_name,
		questions.topic_area_id,
		questions.topic_name,
		questions.release_id,
		questions.release_title,
		questions.question_purpose,
		questions.response_type
	order by
		questions.subject_name,
		questions.topic_name,
		questions.release_title,
		questions.question_purpose,
		questions.response_type;
$$;

revoke execute on function public.get_content_quality_dashboard(uuid)
	from anon, authenticated, public;
grant execute on function public.get_content_quality_dashboard(uuid)
	to service_role;
