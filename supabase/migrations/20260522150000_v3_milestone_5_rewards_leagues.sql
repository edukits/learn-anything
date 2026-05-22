create table if not exists public.achievement_definitions (
	key text primary key,
	name text not null,
	description text not null,
	category text not null check (category in ('learning', 'practice', 'review', 'streak', 'xp')),
	condition_type text not null check (condition_type in ('activity_count', 'xp_total', 'streak_current')),
	condition_scope text,
	threshold int not null check (threshold > 0),
	xp_bonus int not null default 0 check (xp_bonus >= 0),
	reward_kind text check (reward_kind in ('badge', 'title')),
	reward_key text,
	reward_label text,
	active boolean not null default true,
	created_at timestamptz not null default now()
);

create table if not exists public.achievement_events (
	id uuid primary key default extensions.gen_random_uuid(),
	user_id uuid not null references auth.users(id) on delete cascade,
	achievement_key text not null references public.achievement_definitions(key) on delete restrict,
	source_type text not null,
	source_id text not null,
	metadata jsonb not null default '{}'::jsonb,
	earned_at timestamptz not null default now(),
	created_at timestamptz not null default now(),
	unique (user_id, achievement_key)
);

create table if not exists public.reward_inventory (
	id uuid primary key default extensions.gen_random_uuid(),
	user_id uuid not null references auth.users(id) on delete cascade,
	achievement_event_id uuid references public.achievement_events(id) on delete set null,
	reward_kind text not null check (reward_kind in ('badge', 'title')),
	reward_key text not null,
	reward_label text not null,
	equipped boolean not null default false,
	earned_at timestamptz not null default now(),
	created_at timestamptz not null default now(),
	unique (user_id, reward_kind, reward_key)
);

create table if not exists public.public_profiles (
	user_id uuid primary key references auth.users(id) on delete cascade,
	display_name text not null default 'Learner',
	avatar_url text,
	title text,
	bio text,
	leaderboard_opt_in boolean not null default false,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	constraint public_profiles_display_name_length check (char_length(display_name) between 1 and 80),
	constraint public_profiles_avatar_url_length check (avatar_url is null or char_length(avatar_url) <= 500),
	constraint public_profiles_title_length check (title is null or char_length(title) <= 80),
	constraint public_profiles_bio_length check (bio is null or char_length(bio) <= 240)
);

create trigger public_profiles_set_updated_at
	before update on public.public_profiles
	for each row execute function app_private.set_updated_at();

create table if not exists public.leaderboard_periods (
	id uuid primary key default extensions.gen_random_uuid(),
	period_kind text not null check (period_kind in ('weekly')),
	topic_area_id text references public.topic_areas(id) on delete restrict,
	start_at timestamptz not null,
	end_at timestamptz not null,
	status text not null default 'active' check (status in ('active', 'closed')),
	created_at timestamptz not null default now(),
	unique (period_kind, topic_area_id, start_at)
);

create table if not exists public.league_memberships (
	id uuid primary key default extensions.gen_random_uuid(),
	user_id uuid not null references auth.users(id) on delete cascade,
	period_id uuid not null references public.leaderboard_periods(id) on delete cascade,
	league_key text not null,
	joined_at timestamptz not null default now(),
	unique (user_id, period_id)
);

create table if not exists public.leaderboard_entries (
	id uuid primary key default extensions.gen_random_uuid(),
	period_id uuid not null references public.leaderboard_periods(id) on delete cascade,
	user_id uuid not null references auth.users(id) on delete cascade,
	topic_area_id text references public.topic_areas(id) on delete restrict,
	xp_points int not null default 0 check (xp_points >= 0),
	activity_count int not null default 0 check (activity_count >= 0),
	rank int,
	recomputed_at timestamptz not null default now(),
	unique (period_id, user_id, topic_area_id)
);

create index if not exists achievement_events_user_earned_idx
	on public.achievement_events (user_id, earned_at desc);
create index if not exists reward_inventory_user_earned_idx
	on public.reward_inventory (user_id, earned_at desc);
create index if not exists public_profiles_leaderboard_idx
	on public.public_profiles (leaderboard_opt_in, display_name);
create index if not exists leaderboard_periods_window_idx
	on public.leaderboard_periods (period_kind, start_at, end_at);
create index if not exists league_memberships_period_league_idx
	on public.league_memberships (period_id, league_key);
create index if not exists leaderboard_entries_period_rank_idx
	on public.leaderboard_entries (period_id, topic_area_id, rank);

alter table public.achievement_definitions enable row level security;
alter table public.achievement_events enable row level security;
alter table public.reward_inventory enable row level security;
alter table public.public_profiles enable row level security;
alter table public.leaderboard_periods enable row level security;
alter table public.league_memberships enable row level security;
alter table public.leaderboard_entries enable row level security;

create policy "Achievement definitions are readable by signed-in learners"
	on public.achievement_definitions for select to authenticated using (active);

create policy "Achievement events are readable by owner"
	on public.achievement_events for select to authenticated using ((select auth.uid()) = user_id);

create policy "Reward inventory is readable by owner"
	on public.reward_inventory for select to authenticated using ((select auth.uid()) = user_id);

create policy "Public profiles expose opted-in rows and own row"
	on public.public_profiles for select to authenticated
	using (leaderboard_opt_in or (select auth.uid()) = user_id);

create policy "Public profiles are insertable by owner"
	on public.public_profiles for insert to authenticated
	with check ((select auth.uid()) = user_id);

create policy "Public profiles are updateable by owner"
	on public.public_profiles for update to authenticated
	using ((select auth.uid()) = user_id)
	with check ((select auth.uid()) = user_id);

create policy "Leaderboard periods are readable by signed-in learners"
	on public.leaderboard_periods for select to authenticated using (true);

create policy "League memberships are readable by owner"
	on public.league_memberships for select to authenticated using ((select auth.uid()) = user_id);

create policy "Leaderboard entries are readable for opted-in public profiles"
	on public.leaderboard_entries for select to authenticated
	using (exists (
		select 1 from public.public_profiles profile
		where profile.user_id = leaderboard_entries.user_id
			and profile.leaderboard_opt_in
	));

insert into public.achievement_definitions (
	key, name, description, category, condition_type, condition_scope, threshold, reward_kind, reward_key, reward_label
)
values
	('first_lesson', 'First lesson', 'Complete your first lesson.', 'learning', 'activity_count', 'lesson_completed', 1, 'badge', 'badge_first_lesson', 'First Lesson'),
	('first_quiz', 'First quiz', 'Submit your first quiz.', 'practice', 'activity_count', 'quiz_completed', 1, 'badge', 'badge_first_quiz', 'First Quiz'),
	('first_review', 'First review', 'Complete your first adaptive review.', 'review', 'activity_count', 'review_completed', 1, 'badge', 'badge_first_review', 'First Review'),
	('three_day_streak', 'Three-day streak', 'Reach a three-day learning streak.', 'streak', 'streak_current', null, 3, 'title', 'title_consistent_learner', 'Consistent Learner'),
	('hundred_xp', '100 XP', 'Earn 100 total XP.', 'xp', 'xp_total', null, 100, 'title', 'title_xp_builder', 'XP Builder')
on conflict (key) do update
	set name = excluded.name,
		description = excluded.description,
		category = excluded.category,
		condition_type = excluded.condition_type,
		condition_scope = excluded.condition_scope,
		threshold = excluded.threshold,
		reward_kind = excluded.reward_kind,
		reward_key = excluded.reward_key,
		reward_label = excluded.reward_label,
		active = true;

create or replace function app_private.weekly_leaderboard_bounds(p_now timestamptz default now())
returns table (start_at timestamptz, end_at timestamptz)
language sql
stable
as $$
	select
		(date_trunc('week', p_now at time zone 'America/Los_Angeles') at time zone 'America/Los_Angeles')::timestamptz,
		((date_trunc('week', p_now at time zone 'America/Los_Angeles') + interval '7 days') at time zone 'America/Los_Angeles')::timestamptz;
$$;

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
	select bounds.start_at, bounds.end_at
	into v_start_at, v_end_at
	from app_private.weekly_leaderboard_bounds() bounds;

	insert into public.leaderboard_periods (period_kind, topic_area_id, start_at, end_at)
	values ('weekly', p_topic_area_id, v_start_at, v_end_at)
	on conflict (period_kind, topic_area_id, start_at) do update
		set end_at = excluded.end_at
	returning id into v_period_id;

	return v_period_id;
end;
$$;

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
	on conflict (user_id, period_id) do update
		set league_key = public.league_memberships.league_key
	returning public.league_memberships.league_key into v_league_key;

	return query select v_period_id, v_league_key;
end;
$$;

create or replace function app_private.evaluate_achievements(
	p_user_id uuid,
	p_source_type text,
	p_source_id text
)
returns void
language plpgsql
security definer
set search_path = public, app_private
as $$
declare
	v_definition record;
	v_metric int;
	v_event_id uuid;
begin
	for v_definition in
		select *
		from public.achievement_definitions
		where active
	loop
		v_metric := 0;

		if v_definition.condition_type = 'activity_count' then
			select count(*)
			into v_metric
			from public.activity_events
			where user_id = p_user_id
				and activity_type = v_definition.condition_scope;
		elsif v_definition.condition_type = 'xp_total' then
			select coalesce(sum(points), 0)::int
			into v_metric
			from public.xp_events
			where user_id = p_user_id;
		elsif v_definition.condition_type = 'streak_current' then
			select coalesce(current_count, 0)
			into v_metric
			from public.streaks
			where user_id = p_user_id;
		end if;

		if v_metric >= v_definition.threshold then
			insert into public.achievement_events (
				user_id, achievement_key, source_type, source_id, metadata
			)
			values (
				p_user_id,
				v_definition.key,
				p_source_type,
				p_source_id,
				jsonb_build_object('metric', v_metric, 'threshold', v_definition.threshold)
			)
			on conflict (user_id, achievement_key) do nothing
			returning id into v_event_id;

			if v_event_id is not null and v_definition.reward_kind is not null then
				insert into public.reward_inventory (
					user_id, achievement_event_id, reward_kind, reward_key, reward_label
				)
				values (
					p_user_id,
					v_event_id,
					v_definition.reward_kind,
					v_definition.reward_key,
					v_definition.reward_label
				)
				on conflict (user_id, reward_kind, reward_key) do nothing;
			end if;
		end if;
	end loop;
end;
$$;

create or replace function app_private.evaluate_achievements_from_xp()
returns trigger
language plpgsql
security definer
set search_path = public, app_private
as $$
begin
	perform app_private.evaluate_achievements(NEW.user_id, NEW.source_type, NEW.source_id);
	return NEW;
end;
$$;

drop trigger if exists xp_events_evaluate_achievements on public.xp_events;
create trigger xp_events_evaluate_achievements
	after insert on public.xp_events
	for each row execute function app_private.evaluate_achievements_from_xp();

create or replace function app_private.evaluate_achievements_from_streak()
returns trigger
language plpgsql
security definer
set search_path = public, app_private
as $$
begin
	perform app_private.evaluate_achievements(NEW.user_id, 'streak', NEW.user_id::text);
	return NEW;
end;
$$;

drop trigger if exists streaks_evaluate_achievements on public.streaks;
create trigger streaks_evaluate_achievements
	after insert or update on public.streaks
	for each row execute function app_private.evaluate_achievements_from_streak();

create or replace function public.get_weekly_leaderboard(
	p_viewer_user_id uuid,
	p_topic_area_id text default null,
	p_limit int default 25
)
returns table (
	rank int,
	user_id uuid,
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
	with period as (
		select id, start_at, end_at
		from public.leaderboard_periods
		where id = app_private.current_weekly_period(p_topic_area_id)
	),
	viewer_league as (
		select membership.league_key
		from public.league_memberships membership
		join period on period.id = membership.period_id
		where membership.user_id = p_viewer_user_id
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
		from public.public_profiles profile
		left join scores on scores.user_id = profile.user_id
		left join period on true
		left join public.league_memberships membership
			on membership.user_id = profile.user_id
			and membership.period_id = period.id
		where profile.leaderboard_opt_in
			and (
				p_topic_area_id is not null
				or exists (
					select 1 from viewer_league
					where viewer_league.league_key = membership.league_key
				)
			)
	),
	ranked as (
		select
			dense_rank() over (order by eligible.xp_points desc, eligible.activity_count desc, eligible.display_name asc)::int as rank,
			eligible.*
		from eligible
	)
	select
		ranked.rank,
		ranked.user_id,
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

revoke execute on function public.ensure_weekly_league_membership(uuid) from anon, authenticated, public;
grant execute on function public.ensure_weekly_league_membership(uuid) to service_role;

revoke execute on function public.get_weekly_leaderboard(uuid, text, int) from anon, authenticated, public;
grant execute on function public.get_weekly_leaderboard(uuid, text, int) to service_role;
