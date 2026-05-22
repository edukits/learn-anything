alter table public.leaderboard_periods
	add column if not exists scope_key text generated always as (coalesce(topic_area_id, '__global__')) stored;

with ranked_periods as (
	select
		id,
		first_value(id) over (
			partition by period_kind, scope_key, start_at
			order by created_at, id
		) as keep_id,
		row_number() over (
			partition by period_kind, scope_key, start_at
			order by created_at, id
		) as row_number
	from public.leaderboard_periods
)
update public.league_memberships membership
set period_id = ranked_periods.keep_id
from ranked_periods
where membership.period_id = ranked_periods.id
	and ranked_periods.row_number > 1;

with ranked_periods as (
	select
		id,
		first_value(id) over (
			partition by period_kind, scope_key, start_at
			order by created_at, id
		) as keep_id,
		row_number() over (
			partition by period_kind, scope_key, start_at
			order by created_at, id
		) as row_number
	from public.leaderboard_periods
)
update public.leaderboard_entries entry
set period_id = ranked_periods.keep_id
from ranked_periods
where entry.period_id = ranked_periods.id
	and ranked_periods.row_number > 1;

with ranked_periods as (
	select
		id,
		row_number() over (
			partition by period_kind, scope_key, start_at
			order by created_at, id
		) as row_number
	from public.leaderboard_periods
)
delete from public.leaderboard_periods period
using ranked_periods
where period.id = ranked_periods.id
	and ranked_periods.row_number > 1;

create unique index if not exists leaderboard_periods_weekly_scope_start_idx
	on public.leaderboard_periods (period_kind, scope_key, start_at);

alter table public.public_profiles
	add column if not exists equipped_title_reward_key text;

create unique index if not exists reward_inventory_user_reward_key_idx
	on public.reward_inventory (user_id, reward_key);

alter table public.public_profiles
	drop constraint if exists public_profiles_equipped_title_reward_fk;

alter table public.public_profiles
	add constraint public_profiles_equipped_title_reward_fk
	foreign key (user_id, equipped_title_reward_key)
	references public.reward_inventory(user_id, reward_key)
	on delete restrict;

create or replace function app_private.apply_public_profile_title_reward()
returns trigger
language plpgsql
security definer
set search_path = public, app_private
as $$
declare
	v_reward_label text;
begin
	if NEW.equipped_title_reward_key is null then
		NEW.title := null;
		return NEW;
	end if;

	select reward.reward_label
	into v_reward_label
	from public.reward_inventory reward
	where reward.user_id = NEW.user_id
		and reward.reward_kind = 'title'
		and reward.reward_key = NEW.equipped_title_reward_key;

	if v_reward_label is null then
		raise exception 'equipped title must be an earned title reward';
	end if;

	NEW.title := v_reward_label;
	return NEW;
end;
$$;

drop trigger if exists public_profiles_apply_title_reward on public.public_profiles;
create trigger public_profiles_apply_title_reward
	before insert or update on public.public_profiles
	for each row execute function app_private.apply_public_profile_title_reward();

create or replace function app_private.current_weekly_period(p_topic_area_id text default null)
returns uuid
language plpgsql
security definer
set search_path = public, app_private
as $$
declare
	v_start_at timestamptz;
	v_end_at timestamptz;
	v_period_id uuid;
begin
	perform pg_advisory_xact_lock(hashtext('weekly_period:' || coalesce(p_topic_area_id, '__global__')));

	select bounds.start_at, bounds.end_at
	into v_start_at, v_end_at
	from app_private.weekly_leaderboard_bounds() bounds;

	insert into public.leaderboard_periods (period_kind, topic_area_id, start_at, end_at)
	values ('weekly', p_topic_area_id, v_start_at, v_end_at)
	on conflict (period_kind, scope_key, start_at) do update
		set end_at = excluded.end_at
	returning id into v_period_id;

	return v_period_id;
end;
$$;

create or replace function app_private.ensure_weekly_league_membership_for_scope(
	p_user_id uuid,
	p_topic_area_id text default null
)
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

	v_period_id := app_private.current_weekly_period(p_topic_area_id);
	perform pg_advisory_xact_lock(hashtext('weekly_league:' || v_period_id::text));

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

create or replace function public.ensure_weekly_league_membership(p_user_id uuid)
returns table (period_id uuid, league_key text)
language sql
security definer
set search_path = public, app_private
as $$
	select * from app_private.ensure_weekly_league_membership_for_scope(p_user_id, null);
$$;

create or replace function public.ensure_weekly_topic_league_membership(
	p_user_id uuid,
	p_topic_area_id text
)
returns table (period_id uuid, league_key text)
language sql
security definer
set search_path = public, app_private
as $$
	select * from app_private.ensure_weekly_league_membership_for_scope(p_user_id, p_topic_area_id);
$$;

drop function if exists public.get_weekly_leaderboard(uuid, text, int);

create or replace function public.get_weekly_leaderboard(
	p_viewer_user_id uuid,
	p_topic_area_id text default null,
	p_limit int default 25
)
returns table (
	rank int,
	display_name text,
	avatar_url text,
	title text,
	bio text,
	xp_points int,
	activity_count int,
	league_key text,
	is_viewer boolean
)
language sql
security definer
set search_path = public, app_private
as $$
	with viewer_profile as (
		select user_id
		from public.public_profiles
		where user_id = p_viewer_user_id
			and leaderboard_opt_in
	),
	period as (
		select id, start_at, end_at
		from public.leaderboard_periods
		where id = app_private.current_weekly_period(p_topic_area_id)
	),
	viewer_league as (
		select membership.league_key
		from public.league_memberships membership
		join period on period.id = membership.period_id
		join viewer_profile on viewer_profile.user_id = membership.user_id
	),
	scores as (
		select
			xp.user_id,
			sum(xp.points)::int as xp_points,
			count(*)::int as activity_count
		from public.xp_events xp
		join public.activity_events activity
			on activity.user_id = xp.user_id
			and activity.source_key = xp.source_id
		cross join period
		where xp.created_at >= period.start_at
			and xp.created_at < period.end_at
			and (p_topic_area_id is null or activity.topic_area_id = p_topic_area_id)
		group by xp.user_id
	),
	eligible as (
		select
			profile.user_id,
			profile.display_name,
			profile.avatar_url,
			profile.title,
			profile.bio,
			coalesce(scores.xp_points, 0) as xp_points,
			coalesce(scores.activity_count, 0) as activity_count,
			membership.league_key
		from viewer_profile
		join period on true
		join public.league_memberships viewer_membership
			on viewer_membership.user_id = viewer_profile.user_id
			and viewer_membership.period_id = period.id
		join public.league_memberships membership
			on membership.period_id = period.id
			and membership.league_key = viewer_membership.league_key
		join public.public_profiles profile
			on profile.user_id = membership.user_id
			and profile.leaderboard_opt_in
		left join scores on scores.user_id = profile.user_id
	),
	ranked as (
		select
			dense_rank() over (order by eligible.xp_points desc, eligible.activity_count desc, eligible.display_name asc)::int as rank,
			eligible.*
		from eligible
	)
	select
		ranked.rank,
		ranked.display_name,
		ranked.avatar_url,
		ranked.title,
		ranked.bio,
		ranked.xp_points,
		ranked.activity_count,
		ranked.league_key,
		ranked.user_id = p_viewer_user_id as is_viewer
	from ranked
	order by ranked.rank, ranked.display_name
	limit greatest(1, least(coalesce(p_limit, 25), 100));
$$;

drop policy if exists "Public profiles expose opted-in rows and own row" on public.public_profiles;
create policy "Public profiles are readable by owner"
	on public.public_profiles for select to authenticated
	using ((select auth.uid()) = user_id);

revoke execute on function public.ensure_weekly_league_membership(uuid) from anon, authenticated, public;
grant execute on function public.ensure_weekly_league_membership(uuid) to service_role;

revoke execute on function public.ensure_weekly_topic_league_membership(uuid, text) from anon, authenticated, public;
grant execute on function public.ensure_weekly_topic_league_membership(uuid, text) to service_role;

revoke execute on function public.get_weekly_leaderboard(uuid, text, int) from anon, authenticated, public;
grant execute on function public.get_weekly_leaderboard(uuid, text, int) to service_role;
