alter table public.achievement_events
	add column if not exists celebration_seen_at timestamptz;

update public.achievement_events
set celebration_seen_at = earned_at
where celebration_seen_at is null;

create index if not exists achievement_events_pending_celebration_idx
	on public.achievement_events (user_id, earned_at)
	where celebration_seen_at is null;

create or replace function public.get_achievement_metric(
	p_user_id uuid,
	p_condition_type text,
	p_condition_scope text default null
)
returns int
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
	v_metric int;
begin
	if p_condition_type = 'activity_count' then
		if p_condition_scope is null then
			raise exception 'activity_count achievements require a condition scope';
		end if;

		select count(*)::int
		into v_metric
		from public.activity_events
		where user_id = p_user_id
			and activity_type = p_condition_scope;
	elsif p_condition_type = 'xp_total' then
		select coalesce(sum(points), 0)::int
		into v_metric
		from public.xp_events
		where user_id = p_user_id;
	elsif p_condition_type = 'streak_current' then
		select coalesce(current_count, 0)
		into v_metric
		from public.streaks
		where user_id = p_user_id;
	else
		raise exception 'unsupported achievement condition type: %', p_condition_type;
	end if;

	return coalesce(v_metric, 0);
end;
$$;

revoke all on function public.get_achievement_metric(uuid, text, text) from public;
grant execute on function public.get_achievement_metric(uuid, text, text) to authenticated, service_role;

create or replace function public.get_achievement_progress(p_user_id uuid)
returns table (
	key text,
	name text,
	description text,
	category text,
	condition_type text,
	condition_scope text,
	threshold int,
	current_metric int,
	progress_percent int,
	reward_kind text,
	reward_key text,
	reward_label text,
	earned_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
	select
		definition.key,
		definition.name,
		definition.description,
		definition.category,
		definition.condition_type,
		definition.condition_scope,
		definition.threshold,
		metric.current_metric,
		least(100, round((metric.current_metric::numeric / definition.threshold::numeric) * 100))::int as progress_percent,
		definition.reward_kind,
		definition.reward_key,
		definition.reward_label,
		event.earned_at
	from public.achievement_definitions definition
	cross join lateral (
		select public.get_achievement_metric(
			p_user_id,
			definition.condition_type,
			definition.condition_scope
		) as current_metric
	) metric
	left join public.achievement_events event
		on event.user_id = p_user_id
		and event.achievement_key = definition.key
	where definition.active
	order by
		event.earned_at desc nulls last,
		metric.current_metric desc,
		definition.threshold,
		definition.name;
$$;

revoke all on function public.get_achievement_progress(uuid) from public;
grant execute on function public.get_achievement_progress(uuid) to authenticated, service_role;

insert into public.achievement_definitions (
	key, name, description, category, condition_type, condition_scope, threshold, reward_kind, reward_key, reward_label
)
values
	('five_lessons', 'Lesson rhythm', 'Complete 5 lessons.', 'learning', 'activity_count', 'lesson_completed', 5, 'badge', 'badge_lesson_rhythm', 'Lesson Rhythm'),
	('five_quizzes', 'Practice rhythm', 'Submit 5 quizzes.', 'practice', 'activity_count', 'quiz_completed', 5, 'badge', 'badge_practice_rhythm', 'Practice Rhythm'),
	('five_reviews', 'Review rhythm', 'Complete 5 adaptive reviews.', 'review', 'activity_count', 'review_completed', 5, 'badge', 'badge_review_rhythm', 'Review Rhythm'),
	('seven_day_streak', 'Seven-day streak', 'Reach a seven-day learning streak.', 'streak', 'streak_current', null, 7, 'title', 'title_weeklong_learner', 'Weeklong Learner'),
	('five_hundred_xp', '500 XP', 'Earn 500 total XP.', 'xp', 'xp_total', null, 500, 'title', 'title_xp_champion', 'XP Champion')
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
		v_metric := public.get_achievement_metric(
			p_user_id,
			v_definition.condition_type,
			v_definition.condition_scope
		);

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

do $$
declare
	v_user_id uuid;
begin
	for v_user_id in
		select user_id from public.activity_events
		union
		select user_id from public.xp_events
		union
		select user_id from public.streaks
	loop
		perform app_private.evaluate_achievements(
			v_user_id,
			'achievement_backfill',
			v_user_id::text
		);
	end loop;
end;
$$;

update public.achievement_events
set celebration_seen_at = earned_at
where source_type = 'achievement_backfill'
	and celebration_seen_at is null;
