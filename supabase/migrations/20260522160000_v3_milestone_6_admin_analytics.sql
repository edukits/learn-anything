create table if not exists public.content_admin_users (
	user_id uuid primary key references auth.users(id) on delete cascade,
	role text not null default 'reviewer' check (role in ('reviewer', 'publisher', 'owner')),
	created_at timestamptz not null default now()
);

create table if not exists public.content_issue_reports (
	id uuid primary key default extensions.gen_random_uuid(),
	reporter_user_id uuid references auth.users(id) on delete set null,
	topic_area_id text references public.topic_areas(id) on delete restrict,
	release_id text references public.content_releases(id) on delete restrict,
	content_type text not null check (content_type in ('lesson', 'quiz', 'quiz_question', 'diagnostic', 'review')),
	content_id text not null,
	content_version int,
	issue_type text not null check (issue_type in ('accuracy', 'clarity', 'typo', 'accessibility', 'technical', 'other')),
	severity text not null default 'medium' check (severity in ('low', 'medium', 'high')),
	message text not null check (char_length(message) between 3 and 2000),
	status text not null default 'open' check (status in ('open', 'triaged', 'resolved', 'dismissed')),
	resolution_notes text,
	resolved_by uuid references auth.users(id) on delete set null,
	resolved_at timestamptz,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create trigger content_issue_reports_set_updated_at
	before update on public.content_issue_reports
	for each row execute function app_private.set_updated_at();

create table if not exists public.content_release_reviews (
	release_id text primary key references public.content_releases(id) on delete cascade,
	review_status text not null default 'pending' check (review_status in ('pending', 'approved', 'rejected', 'published', 'rolled_back')),
	validation_report jsonb not null default '{}'::jsonb,
	diff_report jsonb not null default '{}'::jsonb,
	reviewer_notes text,
	reviewed_by uuid references auth.users(id) on delete set null,
	reviewed_at timestamptz,
	published_by uuid references auth.users(id) on delete set null,
	published_at timestamptz,
	rolled_back_by uuid references auth.users(id) on delete set null,
	rolled_back_at timestamptz,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create trigger content_release_reviews_set_updated_at
	before update on public.content_release_reviews
	for each row execute function app_private.set_updated_at();

create index if not exists content_issue_reports_release_status_idx
	on public.content_issue_reports (release_id, status, created_at desc);
create index if not exists content_issue_reports_topic_status_idx
	on public.content_issue_reports (topic_area_id, status, created_at desc);
create index if not exists content_release_reviews_status_idx
	on public.content_release_reviews (review_status, updated_at desc);

insert into public.content_release_reviews (release_id, review_status, published_at)
select
	release.id,
	case release.status
		when 'published' then 'published'
		when 'retired' then 'rolled_back'
		else 'pending'
	end,
	release.published_at
from public.content_releases release
on conflict (release_id) do nothing;

alter table public.content_admin_users enable row level security;
alter table public.content_issue_reports enable row level security;
alter table public.content_release_reviews enable row level security;

create or replace function app_private.is_content_admin(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, app_private
as $$
	select exists (
		select 1
		from public.content_admin_users admin_user
		where admin_user.user_id = p_user_id
	);
$$;

create policy "Content admin users can read own row"
	on public.content_admin_users for select to authenticated
	using ((select auth.uid()) = user_id);

create policy "Issue reports are insertable by signed-in learners"
	on public.content_issue_reports for insert to authenticated
	with check ((select auth.uid()) = reporter_user_id);

create policy "Issue reports are readable by reporter"
	on public.content_issue_reports for select to authenticated
	using ((select auth.uid()) = reporter_user_id or app_private.is_content_admin((select auth.uid())));

create policy "Issue reports are updateable by content admins"
	on public.content_issue_reports for update to authenticated
	using (app_private.is_content_admin((select auth.uid())))
	with check (app_private.is_content_admin((select auth.uid())));

create policy "Release reviews are readable by content admins"
	on public.content_release_reviews for select to authenticated
	using (app_private.is_content_admin((select auth.uid())));

create policy "Release reviews are writable by content admins"
	on public.content_release_reviews for all to authenticated
	using (app_private.is_content_admin((select auth.uid())))
	with check (app_private.is_content_admin((select auth.uid())));

create or replace function public.report_content_issue(
	p_user_id uuid,
	p_topic_area_id text,
	p_release_id text,
	p_content_type text,
	p_content_id text,
	p_content_version int,
	p_issue_type text,
	p_message text
)
returns uuid
language plpgsql
security definer
set search_path = public, app_private
as $$
declare
	v_issue_id uuid;
begin
	if trim(coalesce(p_message, '')) = '' then
		raise exception 'issue message is required';
	end if;

	insert into public.content_issue_reports (
		reporter_user_id,
		topic_area_id,
		release_id,
		content_type,
		content_id,
		content_version,
		issue_type,
		message
	)
	values (
		p_user_id,
		p_topic_area_id,
		p_release_id,
		p_content_type,
		p_content_id,
		p_content_version,
		p_issue_type,
		left(trim(p_message), 2000)
	)
	returning id into v_issue_id;

	return v_issue_id;
end;
$$;

create or replace function public.review_content_release(
	p_admin_user_id uuid,
	p_release_id text,
	p_decision text,
	p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public, app_private
as $$
declare
	v_now timestamptz := now();
begin
	if not app_private.is_content_admin(p_admin_user_id) then
		raise exception 'content admin access required';
	end if;

	if p_decision not in ('approved', 'rejected', 'published', 'rolled_back') then
		raise exception 'unsupported release review decision';
	end if;

	insert into public.content_release_reviews (release_id)
	values (p_release_id)
	on conflict (release_id) do nothing;

	if p_decision in ('approved', 'rejected') then
		update public.content_release_reviews
		set review_status = p_decision,
			reviewer_notes = nullif(trim(coalesce(p_notes, '')), ''),
			reviewed_by = p_admin_user_id,
			reviewed_at = v_now
		where release_id = p_release_id;
	elsif p_decision = 'published' then
		update public.content_releases
		set status = 'published',
			published_at = coalesce(published_at, v_now)
		where id = p_release_id;

		update public.content_release_reviews
		set review_status = 'published',
			published_by = p_admin_user_id,
			published_at = v_now
		where release_id = p_release_id;
	else
		update public.content_releases
		set status = 'retired'
		where id = p_release_id;

		update public.content_release_reviews
		set review_status = 'rolled_back',
			rolled_back_by = p_admin_user_id,
			rolled_back_at = v_now
		where release_id = p_release_id;
	end if;
end;
$$;

create or replace function public.get_content_quality_dashboard(p_admin_user_id uuid)
returns table (
	topic_area_id text,
	topic_name text,
	release_id text,
	question_type text,
	question_count int,
	answer_count int,
	correct_rate numeric,
	open_issue_count int
)
language sql
security definer
set search_path = public, app_private
as $$
	with admin_gate as (
		select app_private.is_content_admin(p_admin_user_id) as allowed
	),
	questions as (
		select
			metadata.topic_area_id,
			metadata.name as topic_name,
			item.release_id,
			question.question_type,
			question.question_id,
			question.version
		from admin_gate
		join public.content_release_items item on admin_gate.allowed
		join public.quiz_question_versions question
			on question.question_id = item.content_id
			and question.version = item.content_version
		left join public.topic_discovery_metadata metadata
			on metadata.release_id = item.release_id
		where item.content_type = 'quiz_question'
	),
	answers as (
		select
			question_id,
			question_version,
			count(*)::int as answer_count,
			round(avg(case when is_correct then 1 else 0 end)::numeric, 3) as correct_rate
		from public.quiz_attempt_answers
		group by question_id, question_version
	),
	issues as (
		select
			release_id,
			content_id,
			content_version,
			count(*) filter (where status in ('open', 'triaged'))::int as open_issue_count
		from public.content_issue_reports
		group by release_id, content_id, content_version
	)
	select
		questions.topic_area_id,
		coalesce(questions.topic_name, questions.topic_area_id) as topic_name,
		questions.release_id,
		questions.question_type,
		count(*)::int as question_count,
		coalesce(sum(answers.answer_count), 0)::int as answer_count,
		round(avg(answers.correct_rate), 3) as correct_rate,
		coalesce(sum(issues.open_issue_count), 0)::int as open_issue_count
	from questions
	left join answers
		on answers.question_id = questions.question_id
		and answers.question_version = questions.version
	left join issues
		on issues.release_id = questions.release_id
		and issues.content_id = questions.question_id
		and issues.content_version = questions.version
	group by questions.topic_area_id, questions.topic_name, questions.release_id, questions.question_type
	order by questions.topic_name, questions.question_type;
$$;

revoke execute on function public.report_content_issue(uuid, text, text, text, text, int, text, text)
	from anon, authenticated, public;
grant execute on function public.report_content_issue(uuid, text, text, text, text, int, text, text)
	to service_role;

revoke execute on function public.review_content_release(uuid, text, text, text)
	from anon, authenticated, public;
grant execute on function public.review_content_release(uuid, text, text, text)
	to service_role;

revoke execute on function public.get_content_quality_dashboard(uuid)
	from anon, authenticated, public;
grant execute on function public.get_content_quality_dashboard(uuid)
	to service_role;
