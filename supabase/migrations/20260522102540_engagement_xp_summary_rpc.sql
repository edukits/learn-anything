create or replace function public.get_engagement_xp_summary(
	p_user_id uuid,
	p_today_start timestamptz,
	p_today_end timestamptz
)
returns table (
	xp_total int,
	xp_today int
)
language sql
stable
security invoker
set search_path = public
as $$
	select
		coalesce(sum(points), 0)::int as xp_total,
		coalesce(sum(points) filter (where created_at >= p_today_start and created_at <= p_today_end), 0)::int as xp_today
	from public.xp_events
	where user_id = p_user_id;
$$;

revoke all on function public.get_engagement_xp_summary(uuid, timestamptz, timestamptz) from public;
grant execute on function public.get_engagement_xp_summary(uuid, timestamptz, timestamptz) to authenticated, service_role;
