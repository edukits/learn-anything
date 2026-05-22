drop function if exists public.get_weekly_leaderboard(uuid, text, int);

create or replace function public.get_weekly_leaderboard(
	p_viewer_user_id uuid,
	p_topic_area_id text default null,
	p_limit int default 25
)
returns table (
	rank int,
	entry_key text,
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
			md5(period.id::text || ':' || profile.user_id::text) as entry_key,
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
		ranked.entry_key,
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

revoke execute on function public.get_weekly_leaderboard(uuid, text, int) from anon, authenticated, public;
grant execute on function public.get_weekly_leaderboard(uuid, text, int) to service_role;
