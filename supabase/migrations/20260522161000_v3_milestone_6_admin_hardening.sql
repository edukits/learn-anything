alter table public.content_release_reviews
	add column if not exists validation_passed boolean not null default true,
	add column if not exists staging_imported_at timestamptz,
	add column if not exists smoke_tested_at timestamptz;

create index if not exists content_release_items_release_lookup_idx
	on public.content_release_items (release_id, content_type, content_id, content_version);

update public.content_release_reviews review
set
	validation_passed = coalesce((release.manifest #>> '{validation,passed}')::boolean, true),
	staging_imported_at = coalesce(
		(review.validation_report #>> '{staging_imported_at}')::timestamptz,
		(release.manifest #>> '{staging,imported_at}')::timestamptz
	),
	smoke_tested_at = coalesce(
		(review.validation_report #>> '{smoke_tested_at}')::timestamptz,
		(release.manifest #>> '{staging,smoke_tested_at}')::timestamptz
	)
from public.content_releases release
where release.id = review.release_id;

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

	if p_issue_type not in ('accuracy', 'clarity', 'typo', 'accessibility', 'technical', 'other') then
		raise exception 'unsupported issue type';
	end if;

	if not exists (
		select 1
		from public.content_releases release
		where release.id = p_release_id
			and release.scope_type = 'topic_area'
			and release.scope_id = p_topic_area_id
	) then
		raise exception 'reported release does not belong to topic';
	end if;

	if p_content_type = 'quiz' then
		if not exists (
			select 1
			from public.content_release_items item
			where item.release_id = p_release_id
				and item.content_type = 'quiz'
				and item.content_id = p_content_id
				and item.content_version = p_content_version
		) then
			raise exception 'reported quiz is not part of release';
		end if;
	elsif p_content_type = 'lesson' then
		if not exists (
			select 1
			from public.content_release_items item
			where item.release_id = p_release_id
				and item.content_type = 'lesson'
				and item.content_id = p_content_id
				and item.content_version = p_content_version
		) then
			raise exception 'reported lesson is not part of release';
		end if;
	elsif p_content_type = 'quiz_question' then
		if not exists (
			select 1
			from public.content_release_items item
			where item.release_id = p_release_id
				and item.content_type = 'quiz_question'
				and item.content_id = p_content_id
				and item.content_version = p_content_version
		) then
			raise exception 'reported question is not part of release';
		end if;
	else
		raise exception 'unsupported issue content type';
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
	v_admin_role text;
	v_review record;
	v_release record;
	v_previous_release_id text;
begin
	select role
	into v_admin_role
	from public.content_admin_users
	where user_id = p_admin_user_id;

	if v_admin_role is null then
		raise exception 'content admin access required';
	end if;

	if p_decision not in ('approved', 'rejected', 'published', 'rolled_back') then
		raise exception 'unsupported release review decision';
	end if;

	insert into public.content_release_reviews (release_id)
	values (p_release_id)
	on conflict (release_id) do nothing;

	select *
	into v_review
	from public.content_release_reviews
	where release_id = p_release_id
	for update;

	select *
	into v_release
	from public.content_releases
	where id = p_release_id
	for update;

	if not found then
		raise exception 'content release not found';
	end if;

	if p_decision in ('approved', 'rejected') then
		update public.content_release_reviews
		set review_status = p_decision,
			reviewer_notes = nullif(trim(coalesce(p_notes, '')), ''),
			reviewed_by = p_admin_user_id,
			reviewed_at = v_now
		where release_id = p_release_id;
		return;
	end if;

	if v_admin_role not in ('publisher', 'owner') then
		raise exception 'publisher role is required for publish and rollback';
	end if;

	if p_decision = 'published' then
		if v_review.review_status <> 'approved' then
			raise exception 'release must be approved before publishing';
		end if;
		if not coalesce(v_review.validation_passed, false) then
			raise exception 'release validation must pass before publishing';
		end if;
		if v_review.staging_imported_at is null or v_review.smoke_tested_at is null then
			raise exception 'staging import and smoke test are required before publishing';
		end if;

		update public.content_releases
		set status = 'published',
			published_at = coalesce(published_at, v_now)
		where id = p_release_id;

		update public.content_releases candidate
		set status = 'retired'
		from public.content_releases published
		where published.id = p_release_id
			and candidate.id <> p_release_id
			and candidate.status = 'published'
			and candidate.scope_type = published.scope_type
			and candidate.scope_id = published.scope_id;

		update public.content_release_reviews
		set review_status = 'published',
			published_by = p_admin_user_id,
			published_at = v_now
		where release_id = p_release_id;
	else
		if v_review.review_status <> 'published' then
			raise exception 'release must be published before rollback';
		end if;

		v_previous_release_id = v_release.manifest #>> '{rollback,previous_release_id}';
		if v_previous_release_id is null or v_previous_release_id = '' then
			raise exception 'rollback requires previous_release_id metadata';
		end if;
		if not exists (
			select 1
			from public.content_releases previous
			where previous.id = v_previous_release_id
				and previous.scope_type = v_release.scope_type
				and previous.scope_id = v_release.scope_id
		) then
			raise exception 'rollback previous release is missing or out of scope';
		end if;

		update public.content_releases
		set status = 'retired'
		where id = p_release_id;

		update public.content_releases
		set status = 'published',
			published_at = coalesce(published_at, v_now)
		where id = v_previous_release_id;

		update public.content_release_reviews
		set review_status = 'published',
			published_by = coalesce(published_by, p_admin_user_id),
			published_at = coalesce(published_at, v_now)
		where release_id = v_previous_release_id;

		update public.content_release_reviews
		set review_status = 'rolled_back',
			rolled_back_by = p_admin_user_id,
			rolled_back_at = v_now
		where release_id = p_release_id;
	end if;
end;
$$;

create or replace function public.update_content_issue_status(
	p_admin_user_id uuid,
	p_issue_id uuid,
	p_status text,
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

	if p_status not in ('open', 'triaged', 'resolved', 'dismissed') then
		raise exception 'unsupported issue status';
	end if;

	update public.content_issue_reports
	set status = p_status,
		resolution_notes = nullif(trim(coalesce(p_notes, '')), ''),
		resolved_by = case when p_status in ('resolved', 'dismissed') then p_admin_user_id else null end,
		resolved_at = case when p_status in ('resolved', 'dismissed') then v_now else null end
	where id = p_issue_id;

	if not found then
		raise exception 'content issue report not found';
	end if;
end;
$$;

drop function if exists public.get_content_quality_dashboard(uuid);

create or replace function public.get_content_quality_dashboard(p_admin_user_id uuid)
returns table (
	subject_area_id text,
	subject_name text,
	topic_area_id text,
	topic_name text,
	release_id text,
	release_title text,
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
			subject_version.subject_area_id,
			subject_version.name as subject_name,
			metadata.topic_area_id,
			metadata.name as topic_name,
			release.id as release_id,
			release.title as release_title,
			question.question_type,
			question.question_id,
			question.version
		from admin_gate
		join public.content_releases release on admin_gate.allowed
		join public.content_release_items item
			on item.release_id = release.id
		join public.quiz_question_versions question
			on question.question_id = item.content_id
			and question.version = item.content_version
		left join public.topic_discovery_metadata metadata
			on metadata.release_id = item.release_id
		left join public.topic_areas topic
			on topic.id = metadata.topic_area_id
		left join lateral (
			select version.*
			from public.subject_area_versions version
			where version.subject_area_id = topic.subject_area_id
			order by version.version desc
			limit 1
		) subject_version on true
		where item.content_type = 'quiz_question'
	),
	answers as (
		select
			attempt.release_id,
			answer.question_id,
			answer.question_version,
			count(*)::int as answer_count,
			count(*) filter (where answer.is_correct)::int as correct_count
		from public.quiz_attempt_answers answer
		join public.quiz_attempts attempt
			on attempt.id = answer.attempt_id
		group by attempt.release_id, answer.question_id, answer.question_version
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
		questions.subject_area_id,
		coalesce(questions.subject_name, questions.subject_area_id) as subject_name,
		questions.topic_area_id,
		coalesce(questions.topic_name, questions.topic_area_id) as topic_name,
		questions.release_id,
		questions.release_title,
		questions.question_type,
		count(*)::int as question_count,
		coalesce(sum(answers.answer_count), 0)::int as answer_count,
		case
			when coalesce(sum(answers.answer_count), 0) = 0 then null
			else round(sum(answers.correct_count)::numeric / sum(answers.answer_count), 3)
		end as correct_rate,
		coalesce(sum(issues.open_issue_count), 0)::int as open_issue_count
	from questions
	left join answers
		on answers.release_id = questions.release_id
		and answers.question_id = questions.question_id
		and answers.question_version = questions.version
	left join issues
		on issues.release_id = questions.release_id
		and issues.content_id = questions.question_id
		and issues.content_version = questions.version
	group by
		questions.subject_area_id,
		questions.subject_name,
		questions.topic_area_id,
		questions.topic_name,
		questions.release_id,
		questions.release_title,
		questions.question_type
	order by questions.subject_name, questions.topic_name, questions.release_title, questions.question_type;
$$;

revoke execute on function public.report_content_issue(uuid, text, text, text, text, int, text, text)
	from anon, authenticated, public;
grant execute on function public.report_content_issue(uuid, text, text, text, text, int, text, text)
	to service_role;

revoke execute on function public.review_content_release(uuid, text, text, text)
	from anon, authenticated, public;
grant execute on function public.review_content_release(uuid, text, text, text)
	to service_role;

revoke execute on function public.update_content_issue_status(uuid, uuid, text, text)
	from anon, authenticated, public;
grant execute on function public.update_content_issue_status(uuid, uuid, text, text)
	to service_role;

revoke execute on function public.get_content_quality_dashboard(uuid)
	from anon, authenticated, public;
grant execute on function public.get_content_quality_dashboard(uuid)
	to service_role;
