do $$
declare
	v_function_sql text;
	v_signature regprocedure;
begin
	foreach v_signature in array array[
		'public.submit_quiz_with_outcomes(uuid,text,text,text,integer,jsonb,text)'::regprocedure,
		'public.complete_review_session_with_outcomes(uuid,text,text,uuid,jsonb,text)'::regprocedure
	]
	loop
		select pg_get_functiondef(v_signature)
		into v_function_sql;

		v_function_sql := replace(
			v_function_sql,
			'v_question record;',
			'v_question public.quiz_question_versions%rowtype;'
		);

		if position('v_question public.quiz_question_versions%rowtype;' in v_function_sql) = 0 then
			raise exception 'Could not patch question row type for %', v_signature;
		end if;

		execute v_function_sql;
	end loop;
end $$;
