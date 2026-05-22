create table public.user_topic_enrollments (
	user_id uuid not null references auth.users(id) on delete cascade,
	topic_area_id text not null references public.topic_areas(id) on delete restrict,
	status text not null default 'active' check (status in ('active', 'paused', 'inactive')),
	started_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	primary key (user_id, topic_area_id)
);

create trigger user_topic_enrollments_set_updated_at
	before update on public.user_topic_enrollments
	for each row execute function app_private.set_updated_at();

create table public.user_topic_enrollment_events (
	id uuid primary key default extensions.gen_random_uuid(),
	user_id uuid not null references auth.users(id) on delete cascade,
	topic_area_id text not null references public.topic_areas(id) on delete restrict,
	event_type text not null check (event_type in ('enrolled', 'paused', 'unpaused', 'inactive')),
	previous_status text check (previous_status in ('active', 'paused', 'inactive')),
	new_status text not null check (new_status in ('active', 'paused', 'inactive')),
	occurred_at timestamptz not null default now()
);

create or replace function app_private.log_topic_enrollment_event()
returns trigger
language plpgsql
security definer
set search_path = public, app_private
as $$
declare
	v_event_type text;
begin
	if tg_op = 'INSERT' then
		v_event_type := case new.status
			when 'active' then 'enrolled'
			else new.status
		end;

		insert into public.user_topic_enrollment_events (
			user_id, topic_area_id, event_type, previous_status, new_status
		)
		values (new.user_id, new.topic_area_id, v_event_type, null, new.status);

		return new;
	end if;

	if old.status is distinct from new.status then
		v_event_type := case
			when new.status = 'active' and old.status = 'paused' then 'unpaused'
			when new.status = 'active' then 'enrolled'
			else new.status
		end;

		insert into public.user_topic_enrollment_events (
			user_id, topic_area_id, event_type, previous_status, new_status
		)
		values (new.user_id, new.topic_area_id, v_event_type, old.status, new.status);
	end if;

	return new;
end;
$$;

create trigger user_topic_enrollments_log_event
	after insert or update on public.user_topic_enrollments
	for each row execute function app_private.log_topic_enrollment_event();

create index user_topic_enrollments_user_status_idx
	on public.user_topic_enrollments (user_id, status, updated_at desc);

create index user_topic_enrollment_events_user_topic_idx
	on public.user_topic_enrollment_events (user_id, topic_area_id, occurred_at desc);

alter table public.user_topic_enrollments enable row level security;
alter table public.user_topic_enrollment_events enable row level security;

create policy "Topic enrollments are readable by owner" on public.user_topic_enrollments
	for select to authenticated
	using ((select auth.uid()) = user_id);

create policy "Topic enrollments are insertable by owner" on public.user_topic_enrollments
	for insert to authenticated
	with check ((select auth.uid()) = user_id);

create policy "Topic enrollments are updateable by owner" on public.user_topic_enrollments
	for update to authenticated
	using ((select auth.uid()) = user_id)
	with check ((select auth.uid()) = user_id);

create policy "Topic enrollment events are readable by owner" on public.user_topic_enrollment_events
	for select to authenticated
	using ((select auth.uid()) = user_id);

create policy "Published subject areas are publicly readable" on public.subject_areas
	for select to anon, authenticated
	using (true);

create policy "Published subject versions are publicly readable" on public.subject_area_versions
	for select to anon, authenticated
	using (true);

create policy "Published topic areas are publicly readable" on public.topic_areas
	for select to anon, authenticated
	using (true);
