alter table public.quiz_question_versions
	add column if not exists math_template text,
	add column if not exists math_match_mode text not null default 'normalized',
	add column if not exists accepted_math_answers jsonb not null default '[]'::jsonb;

alter table public.quiz_question_versions
	drop constraint if exists quiz_question_versions_response_type_check,
	drop constraint if exists quiz_question_versions_math_match_mode_check,
	drop constraint if exists quiz_question_versions_accepted_math_answers_array,
	drop constraint if exists quiz_question_versions_accepted_math_answers_valid;

create or replace function app_private.valid_math_accepted_prompts(p_prompts jsonb)
returns boolean
language sql
immutable
as $$
	select case
		when jsonb_typeof(coalesce(p_prompts, 'null'::jsonb)) <> 'object' then false
		when not exists (
			select 1
			from jsonb_each(p_prompts) as prompt(key, value)
		) then false
		else not exists (
			select 1
			from jsonb_each(p_prompts) as prompt(key, value)
			where length(prompt.key) = 0
				or jsonb_typeof(prompt.value) <> 'string'
				or length(prompt.value #>> '{}') = 0
		)
	end;
$$;

create or replace function app_private.valid_math_accepted_answers(p_answers jsonb)
returns boolean
language sql
immutable
as $$
	select case
		when jsonb_typeof(coalesce(p_answers, 'null'::jsonb)) <> 'array' then false
		else not exists (
			select 1
			from jsonb_array_elements(p_answers) as accepted(value)
			where
				jsonb_typeof(accepted.value) <> 'object'
				or (
					accepted.value ? 'prompts'
					and not app_private.valid_math_accepted_prompts(accepted.value -> 'prompts')
				)
				or not (
					(
						accepted.value ? 'latex'
						and jsonb_typeof(accepted.value -> 'latex') = 'string'
						and length(accepted.value ->> 'latex') > 0
					)
					or (
						accepted.value ? 'prompts'
						and app_private.valid_math_accepted_prompts(accepted.value -> 'prompts')
					)
				)
		)
	end;
$$;

alter table public.quiz_question_versions
	add constraint quiz_question_versions_response_type_check
	check (response_type in ('multiple_choice', 'multiple_select', 'numeric', 'sequencing', 'short_answer', 'math', 'image_choice')),
	add constraint quiz_question_versions_math_match_mode_check
	check (math_match_mode in ('exact', 'normalized')),
	add constraint quiz_question_versions_accepted_math_answers_array
	check (jsonb_typeof(accepted_math_answers) = 'array'),
	add constraint quiz_question_versions_accepted_math_answers_valid
	check (app_private.valid_math_accepted_answers(accepted_math_answers));

create or replace function app_private.normalize_latex_answer(p_value text)
returns text
language sql
immutable
as $$
	select regexp_replace(
		replace(
			replace(
				replace(trim(coalesce(p_value, '')), '\left', ''),
				'\right',
				''
			),
			'\,',
			''
		),
		'\s+',
		'',
		'g'
	);
$$;

create or replace function app_private.math_answer_text_matches(
	p_answer text,
	p_accepted text,
	p_match_mode text
)
returns boolean
language sql
immutable
as $$
	select case
		when p_match_mode = 'exact' then coalesce(p_answer, '') = coalesce(p_accepted, '')
		else app_private.normalize_latex_answer(p_answer) = app_private.normalize_latex_answer(p_accepted)
	end;
$$;

create or replace function app_private.math_prompts_match(
	p_answer_prompts jsonb,
	p_accepted_prompts jsonb,
	p_match_mode text
)
returns boolean
language sql
stable
as $$
	select case
		when p_accepted_prompts is null then true
		when jsonb_typeof(coalesce(p_accepted_prompts, 'null'::jsonb)) <> 'object' then false
		when not exists (
			select 1
			from jsonb_each(p_accepted_prompts) as accepted(key, value)
		) then false
		when jsonb_typeof(coalesce(p_answer_prompts, '{}'::jsonb)) <> 'object' then false
		else not exists (
			select 1
			from jsonb_each_text(p_accepted_prompts) as accepted(key, value)
			where not app_private.math_answer_text_matches(
				coalesce(p_answer_prompts ->> accepted.key, ''),
				accepted.value,
				p_match_mode
			)
		)
	end;
$$;

create or replace function app_private.submitted_answer_value(
	p_question public.quiz_question_versions,
	p_answer jsonb
)
returns jsonb
language sql
stable
as $$
	select case
		when p_question.response_type in ('multiple_choice', 'image_choice')
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
		when p_question.response_type in ('multiple_choice', 'image_choice') then to_jsonb(p_question.correct_choice_id)
		when p_question.response_type = 'multiple_select' then to_jsonb(p_question.correct_choice_ids)
		when p_question.response_type = 'numeric' then jsonb_build_object(
			'value', p_question.correct_numeric_value,
			'tolerance', p_question.correct_numeric_tolerance
		)
		when p_question.response_type = 'sequencing' then p_question.sequence_items
		when p_question.response_type = 'short_answer' then to_jsonb(p_question.accepted_answers)
		when p_question.response_type = 'math' then p_question.accepted_math_answers
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
	v_answer_value jsonb;
	v_accepted jsonb;
	v_match_mode text;
begin
	if p_question.response_type in ('multiple_choice', 'image_choice') then
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

	if p_question.response_type = 'math' then
		v_answer_value := case
			when jsonb_typeof(p_answer -> 'answer_value') = 'object' then p_answer -> 'answer_value'
			else jsonb_build_object('latex', coalesce(p_answer ->> 'answer_value', ''))
		end;

		for v_accepted in
			select value
			from jsonb_array_elements(coalesce(p_question.accepted_math_answers, '[]'::jsonb)) as accepted(value)
		loop
			v_match_mode := coalesce(v_accepted ->> 'matchMode', p_question.math_match_mode, 'normalized');
			if
				(not (v_accepted ? 'latex') or app_private.math_answer_text_matches(v_answer_value ->> 'latex', v_accepted ->> 'latex', v_match_mode))
				and app_private.math_prompts_match(v_answer_value -> 'prompts', v_accepted -> 'prompts', v_match_mode)
			then
				return true;
			end if;
		end loop;

		return false;
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
				when p_question.response_type in ('multiple_choice', 'image_choice') then p_question.correct_choice_id
				else app_private.answer_jsonb_text(app_private.correct_answer_value(p_question))
			end,
			''
		),
		app_private.submitted_answer_value(p_question, p_answer),
		app_private.correct_answer_value(p_question),
		p_question.response_type,
		app_private.grade_question_answer(p_question, p_answer);
$$;
