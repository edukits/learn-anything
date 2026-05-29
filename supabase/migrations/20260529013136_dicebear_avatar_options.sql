alter table public.public_profiles
	add column if not exists avatar_options jsonb;

update public.public_profiles
set avatar_options = jsonb_build_object(
	'version', 1,
	'style', 'notionists',
	'seed', coalesce(
		left(
			nullif(
				regexp_replace(
					coalesce(nullif(display_name, ''), 'Learner') || ' ' || left(user_id::text, 8),
					'[^[:alnum:]_ .:@+-]+',
					' ',
					'g'
				),
				''
			),
			120
		),
		'Learner'
	),
	'backgroundColor', 'f1f5f9',
	'hair', 'variant01',
	'eyes', 'variant01',
	'brows', 'variant01',
	'lips', 'variant01',
	'beard', 'none',
	'glasses', 'none',
	'bodyIcon', 'none',
	'gesture', 'none'
)
where avatar_options is null;

alter table public.public_profiles
	alter column avatar_options set not null;

alter table public.public_profiles
	drop constraint if exists public_profiles_avatar_url_length;

alter table public.public_profiles
	drop column if exists avatar_url;

alter table public.public_profiles
	drop constraint if exists public_profiles_avatar_options_contract;

alter table public.public_profiles
	add constraint public_profiles_avatar_options_contract check (
		jsonb_typeof(avatar_options) = 'object'
		and avatar_options ->> 'version' = '1'
		and avatar_options ->> 'style' = 'notionists'
		and char_length(coalesce(avatar_options ->> 'seed', '')) between 1 and 120
		and avatar_options ->> 'seed' ~ '^[[:alnum:]_ .:@+-]+$'
		and avatar_options ->> 'backgroundColor' in (
			'b6e3f4',
			'c0aede',
			'd1d4f9',
			'ffd5dc',
			'ffdfbf',
			'c8e6c9',
			'f8d7a1',
			'f1f5f9'
		)
		and avatar_options ->> 'hair' in (
			'hat',
			'variant01',
			'variant02',
			'variant03',
			'variant04',
			'variant05',
			'variant06',
			'variant07',
			'variant08',
			'variant09',
			'variant10',
			'variant11',
			'variant12'
		)
		and avatar_options ->> 'eyes' in (
			'variant01',
			'variant02',
			'variant03',
			'variant04',
			'variant05'
		)
		and avatar_options ->> 'brows' in (
			'variant01',
			'variant03',
			'variant05',
			'variant08',
			'variant10',
			'variant13'
		)
		and avatar_options ->> 'lips' in (
			'variant01',
			'variant04',
			'variant08',
			'variant12',
			'variant18',
			'variant24',
			'variant30'
		)
		and avatar_options ->> 'beard' in (
			'none',
			'variant01',
			'variant04',
			'variant07',
			'variant10'
		)
		and avatar_options ->> 'glasses' in (
			'none',
			'variant01',
			'variant04',
			'variant07',
			'variant11'
		)
		and avatar_options ->> 'bodyIcon' in ('none', 'electric', 'galaxy', 'saturn')
		and avatar_options ->> 'gesture' in (
			'none',
			'hand',
			'handPhone',
			'ok',
			'point',
			'waveLongArm'
		)
	);

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
	avatar_options jsonb,
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
			profile.avatar_options,
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
		ranked.avatar_options,
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
