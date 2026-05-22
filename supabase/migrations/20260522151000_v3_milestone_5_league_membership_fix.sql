create or replace function public.ensure_weekly_league_membership(p_user_id uuid)
returns table (period_id uuid, league_key text)
language plpgsql
security definer
set search_path = public, app_private
as $$
declare
	v_period_id uuid;
	v_league_key text;
	v_league_count int;
begin
	if not exists (
		select 1 from public.public_profiles
		where user_id = p_user_id and leaderboard_opt_in
	) then
		raise exception 'leaderboard opt-in is required';
	end if;

	v_period_id := app_private.current_weekly_period(null);

	select membership.league_key
	into v_league_key
	from public.league_memberships membership
	where membership.user_id = p_user_id
		and membership.period_id = v_period_id;

	if v_league_key is not null then
		return query select v_period_id, v_league_key;
		return;
	end if;

	select membership.league_key
	into v_league_key
	from public.league_memberships membership
	where membership.period_id = v_period_id
	group by membership.league_key
	having count(*) < 20
	order by membership.league_key
	limit 1;

	if v_league_key is null then
		select count(distinct membership.league_key)
		into v_league_count
		from public.league_memberships membership
		where membership.period_id = v_period_id;

		v_league_key := 'league-' || lpad((coalesce(v_league_count, 0) + 1)::text, 2, '0');
	end if;

	insert into public.league_memberships (user_id, period_id, league_key)
	values (p_user_id, v_period_id, v_league_key)
	on conflict on constraint league_memberships_user_id_period_id_key do update
		set league_key = public.league_memberships.league_key
	returning public.league_memberships.league_key into v_league_key;

	return query select v_period_id, v_league_key;
end;
$$;

revoke execute on function public.ensure_weekly_league_membership(uuid) from anon, authenticated, public;
grant execute on function public.ensure_weekly_league_membership(uuid) to service_role;
