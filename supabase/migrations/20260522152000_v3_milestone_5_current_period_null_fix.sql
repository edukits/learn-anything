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

	select id
	into v_period_id
	from public.leaderboard_periods
	where period_kind = 'weekly'
		and topic_area_id is not distinct from p_topic_area_id
		and start_at = v_start_at
	limit 1;

	if v_period_id is not null then
		update public.leaderboard_periods
		set end_at = v_end_at
		where id = v_period_id;

		return v_period_id;
	end if;

	insert into public.leaderboard_periods (period_kind, topic_area_id, start_at, end_at)
	values ('weekly', p_topic_area_id, v_start_at, v_end_at)
	returning id into v_period_id;

	return v_period_id;
end;
$$;
