-- Local development seed only.
--
-- Supabase applies this after migrations during local `supabase db reset`.
-- It is intentionally kept out of `supabase/migrations` so the default local
-- content admin is not part of cloud database migration history. Do not run
-- this file manually against staging or production.
--
-- Sign in locally with admin@example.com via the magic-link flow. The email
-- will appear in the local Inbucket UI.

do $$
declare
	v_admin_email text := 'admin@example.com';
	v_admin_user_id uuid := '00000000-0000-4000-8000-000000000001';
	v_existing_user_id uuid;
	v_identity_data jsonb;
begin
	select id
	into v_existing_user_id
	from auth.users
	where lower(email) = v_admin_email
	limit 1;

	if v_existing_user_id is not null then
		v_admin_user_id := v_existing_user_id;
	end if;

	v_identity_data := jsonb_build_object(
		'sub',
		v_admin_user_id::text,
		'email',
		v_admin_email,
		'email_verified',
		true,
		'phone_verified',
		false
	);

	insert into auth.users (
		instance_id,
		id,
		aud,
		role,
		email,
		email_confirmed_at,
		confirmation_token,
		recovery_token,
		email_change_token_new,
		email_change,
		email_change_token_current,
		reauthentication_token,
		raw_app_meta_data,
		raw_user_meta_data,
		created_at,
		updated_at
	)
	values (
		'00000000-0000-0000-0000-000000000000',
		v_admin_user_id,
		'authenticated',
		'authenticated',
		v_admin_email,
		now(),
		'',
		'',
		'',
		'',
		'',
		'',
		'{"provider":"email","providers":["email"]}'::jsonb,
		'{"display_name":"Local Admin"}'::jsonb,
		now(),
		now()
	)
	on conflict (id) do update
	set
		aud = excluded.aud,
		role = excluded.role,
		email = excluded.email,
		email_confirmed_at = coalesce(auth.users.email_confirmed_at, excluded.email_confirmed_at),
		confirmation_token = coalesce(auth.users.confirmation_token, ''),
		recovery_token = coalesce(auth.users.recovery_token, ''),
		email_change_token_new = coalesce(auth.users.email_change_token_new, ''),
		email_change = coalesce(auth.users.email_change, ''),
		email_change_token_current = coalesce(auth.users.email_change_token_current, ''),
		reauthentication_token = coalesce(auth.users.reauthentication_token, ''),
		raw_app_meta_data = excluded.raw_app_meta_data,
		raw_user_meta_data = coalesce(auth.users.raw_user_meta_data, '{}'::jsonb) || excluded.raw_user_meta_data,
		updated_at = now();

	delete from auth.identities
	where user_id = v_admin_user_id
		and provider = 'email';

	if exists (
		select 1
		from information_schema.columns
		where table_schema = 'auth'
			and table_name = 'identities'
			and column_name = 'provider_id'
	) then
		insert into auth.identities (
			provider_id,
			user_id,
			identity_data,
			provider,
			last_sign_in_at,
			created_at,
			updated_at
		)
		values (
			v_admin_user_id::text,
			v_admin_user_id,
			v_identity_data,
			'email',
			now(),
			now(),
			now()
		);
	else
		insert into auth.identities (
			id,
			user_id,
			identity_data,
			provider,
			last_sign_in_at,
			created_at,
			updated_at
		)
		values (
			v_admin_user_id::text,
			v_admin_user_id,
			v_identity_data,
			'email',
			now(),
			now(),
			now()
		);
	end if;

	insert into public.profiles (user_id, email, display_name)
	values (v_admin_user_id, v_admin_email, 'Local Admin')
	on conflict (user_id) do update
	set
		email = excluded.email,
		display_name = coalesce(public.profiles.display_name, excluded.display_name),
		updated_at = now();

	insert into public.content_admin_users (user_id, role)
	values (v_admin_user_id, 'owner')
	on conflict (user_id) do update
	set role = excluded.role;
end $$;
