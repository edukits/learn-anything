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

		if position('#variable_conflict use_column' in v_function_sql) = 0 then
			v_function_sql := replace(
				v_function_sql,
				'AS $function$' || chr(10),
				'AS $function$' || chr(10) || '#variable_conflict use_column' || chr(10)
			);
		end if;

		execute v_function_sql;
	end loop;
end $$;
