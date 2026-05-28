do $$
declare
	v_constraint_name text;
begin
	select constraint_name
	into v_constraint_name
	from information_schema.table_constraints tc
	where tc.table_schema = 'public'
		and tc.table_name = 'lesson_interaction_attempts'
		and tc.constraint_type = 'UNIQUE'
		and constraint_name <> 'lesson_interaction_attempts_user_id_submission_key_key'
		and exists (
			select 1
			from information_schema.key_column_usage
			where table_schema = 'public'
				and table_name = 'lesson_interaction_attempts'
				and constraint_name = tc.constraint_name
				and column_name = 'interaction_slug'
		);

	if v_constraint_name is not null then
		execute format(
			'alter table public.lesson_interaction_attempts drop constraint %I',
			v_constraint_name
		);
	end if;
end;
$$;
