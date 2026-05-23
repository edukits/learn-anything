alter table public.lesson_versions
	add column lifecycle_status text not null default 'active' check (lifecycle_status in ('active', 'retired'));

alter table public.quiz_versions
	add column lifecycle_status text not null default 'active' check (lifecycle_status in ('active', 'retired'));

alter table public.quiz_question_versions
	add column lifecycle_status text not null default 'active' check (lifecycle_status in ('active', 'retired'));

create table public.topic_discovery_metadata (
	topic_area_id text not null references public.topic_areas(id) on delete restrict,
	release_id text not null references public.content_releases(id) on delete restrict,
	slug text not null,
	name text not null,
	public_summary text not null,
	preview_markdown text not null,
	app_path text not null,
	level_label text not null,
	estimated_minutes int not null check (estimated_minutes > 0),
	lesson_count int not null check (lesson_count >= 0),
	quiz_count int not null check (quiz_count >= 0),
	covered_skill_ids text[] not null default '{}',
	covered_devices text[] not null default '{}',
	updated_at timestamptz not null default now(),
	primary key (release_id),
	unique (topic_area_id, release_id)
);

create trigger topic_discovery_metadata_set_updated_at
	before update on public.topic_discovery_metadata
	for each row execute function app_private.set_updated_at();

create table public.activity_events (
	id uuid primary key default extensions.gen_random_uuid(),
	user_id uuid not null references auth.users(id) on delete cascade,
	topic_area_id text not null references public.topic_areas(id) on delete restrict,
	release_id text not null references public.content_releases(id) on delete restrict,
	activity_type text not null check (activity_type in ('lesson_completed', 'quiz_completed', 'review_completed')),
	source_type text not null,
	source_id text not null,
	source_version int,
	source_key text not null,
	metadata jsonb not null default '{}'::jsonb,
	occurred_at timestamptz not null default now(),
	created_at timestamptz not null default now(),
	unique (user_id, source_key)
);

create table public.streak_events (
	id uuid primary key default extensions.gen_random_uuid(),
	user_id uuid not null references auth.users(id) on delete cascade,
	activity_date date not null,
	source_activity_event_id uuid not null references public.activity_events(id) on delete cascade,
	created_at timestamptz not null default now(),
	unique (user_id, activity_date)
);

create table public.daily_goal_settings (
	user_id uuid primary key references auth.users(id) on delete cascade,
	daily_xp_goal int not null default 50 check (daily_xp_goal > 0),
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create trigger daily_goal_settings_set_updated_at
	before update on public.daily_goal_settings
	for each row execute function app_private.set_updated_at();

create table public.review_sessions (
	id uuid primary key default extensions.gen_random_uuid(),
	user_id uuid not null references auth.users(id) on delete cascade,
	topic_area_id text not null references public.topic_areas(id) on delete restrict,
	release_id text not null references public.content_releases(id) on delete restrict,
	status text not null default 'created' check (status in ('created', 'completed')),
	created_at timestamptz not null default now(),
	completed_at timestamptz
);

create table public.review_session_questions (
	review_session_id uuid not null references public.review_sessions(id) on delete cascade,
	question_id text not null,
	question_version int not null,
	reason_code text not null check (reason_code in ('missed_question', 'low_skill_accuracy', 'not_seen_recently')),
	reason_label text not null,
	ordering int not null check (ordering > 0),
	primary key (review_session_id, question_id, question_version),
	unique (review_session_id, ordering),
	foreign key (question_id, question_version) references public.quiz_question_versions(question_id, version) on delete restrict
);

alter table public.quiz_attempts
	alter column quiz_id drop not null,
	alter column quiz_version drop not null,
	add column attempt_kind text not null default 'quiz' check (attempt_kind in ('quiz', 'review')),
	add column review_session_id uuid references public.review_sessions(id) on delete set null,
	add column submission_key text;

alter table public.quiz_attempts
	add constraint quiz_attempts_review_session_kind check (
		(attempt_kind = 'review' and review_session_id is not null)
		or (attempt_kind = 'quiz' and review_session_id is null and quiz_id is not null and quiz_version is not null)
	);

create unique index quiz_attempts_user_submission_key_idx
	on public.quiz_attempts (user_id, submission_key)
	where submission_key is not null;

create unique index xp_events_user_source_idx
	on public.xp_events (user_id, source_type, source_id);

create index activity_events_user_release_idx on public.activity_events (user_id, release_id, occurred_at desc);
create index activity_events_user_topic_idx on public.activity_events (user_id, topic_area_id, occurred_at desc);
create index streak_events_user_date_idx on public.streak_events (user_id, activity_date desc);
create index review_sessions_user_release_idx on public.review_sessions (user_id, release_id, created_at desc);
create unique index review_sessions_one_created_per_user_release_idx
	on public.review_sessions (user_id, release_id)
	where status = 'created';
create index review_session_questions_question_idx on public.review_session_questions (question_id, question_version);

alter table public.topic_discovery_metadata enable row level security;
alter table public.activity_events enable row level security;
alter table public.streak_events enable row level security;
alter table public.daily_goal_settings enable row level security;
alter table public.review_sessions enable row level security;
alter table public.review_session_questions enable row level security;

drop policy if exists "Published content is readable" on public.content_runs;
drop policy if exists "Published subject areas are readable" on public.subject_areas;
drop policy if exists "Published subject area versions are readable" on public.subject_area_versions;
drop policy if exists "Published topic areas are readable" on public.topic_areas;
drop policy if exists "Published topic area versions are readable" on public.topic_area_versions;
drop policy if exists "Published skills are readable" on public.skills;
drop policy if exists "Published skill versions are readable" on public.skill_versions;
drop policy if exists "Published lessons are readable" on public.lessons;
drop policy if exists "Published lesson versions are readable" on public.lesson_versions;
drop policy if exists "Published quizzes are readable" on public.quizzes;
drop policy if exists "Published quiz versions are readable" on public.quiz_versions;
drop policy if exists "Published questions are readable" on public.quiz_questions;
drop policy if exists "Published question versions are readable" on public.quiz_question_versions;
drop policy if exists "Published quiz relationships are readable" on public.quiz_question_to_quiz;
drop policy if exists "Published learning paths are readable" on public.learning_paths;
drop policy if exists "Published learning path versions are readable" on public.learning_path_versions;
drop policy if exists "Published learning path items are readable" on public.learning_path_items;
drop policy if exists "Published media assets are readable" on public.media_assets;
drop policy if exists "Published media asset versions are readable" on public.media_asset_versions;
drop policy if exists "Published release bundles are readable" on public.content_release_bundles;
drop policy if exists "Published release items are readable" on public.content_release_items;

create policy "Discovery metadata is publicly readable" on public.topic_discovery_metadata
	for select to anon, authenticated
	using (exists (
		select 1 from public.content_releases release
		where release.id = topic_discovery_metadata.release_id
			and release.status = 'published'
	));

create policy "Content runs are readable by signed-in learners" on public.content_runs for select to authenticated using (true);
create policy "Subject areas are readable by signed-in learners" on public.subject_areas for select to authenticated using (true);
create policy "Subject area versions are readable by signed-in learners" on public.subject_area_versions for select to authenticated using (true);
create policy "Topic areas are readable by signed-in learners" on public.topic_areas for select to authenticated using (true);
create policy "Topic area versions are readable by signed-in learners" on public.topic_area_versions for select to authenticated using (true);
create policy "Skills are readable by signed-in learners" on public.skills for select to authenticated using (true);
create policy "Skill versions are readable by signed-in learners" on public.skill_versions for select to authenticated using (true);
create policy "Lessons are readable by signed-in learners" on public.lessons for select to authenticated using (true);
create policy "Lesson versions are readable by signed-in learners" on public.lesson_versions for select to authenticated using (true);
create policy "Quizzes are readable by signed-in learners" on public.quizzes for select to authenticated using (true);
create policy "Quiz versions are readable by signed-in learners" on public.quiz_versions for select to authenticated using (true);
create policy "Questions are readable by signed-in learners" on public.quiz_questions for select to authenticated using (true);
create policy "Question versions are readable by signed-in learners" on public.quiz_question_versions for select to authenticated using (true);
create policy "Quiz relationships are readable by signed-in learners" on public.quiz_question_to_quiz for select to authenticated using (true);
create policy "Learning paths are readable by signed-in learners" on public.learning_paths for select to authenticated using (true);
create policy "Learning path versions are readable by signed-in learners" on public.learning_path_versions for select to authenticated using (true);
create policy "Learning path items are readable by signed-in learners" on public.learning_path_items for select to authenticated using (true);
create policy "Media assets are readable by signed-in learners" on public.media_assets for select to authenticated using (true);
create policy "Media asset versions are readable by signed-in learners" on public.media_asset_versions for select to authenticated using (true);
create policy "Release bundles are readable by signed-in learners" on public.content_release_bundles
	for select to authenticated
	using (exists (select 1 from public.content_releases where id = release_id and status = 'published'));
create policy "Release items are readable by signed-in learners" on public.content_release_items
	for select to authenticated
	using (exists (select 1 from public.content_releases where id = release_id and status = 'published'));

create policy "Activity events are readable by owner" on public.activity_events
	for select to authenticated
	using ((select auth.uid()) = user_id);

create policy "Streak events are readable by owner" on public.streak_events
	for select to authenticated
	using ((select auth.uid()) = user_id);

create policy "Daily goal settings are readable by owner" on public.daily_goal_settings
	for select to authenticated
	using ((select auth.uid()) = user_id);

create policy "Daily goal settings are insertable by owner" on public.daily_goal_settings
	for insert to authenticated
	with check ((select auth.uid()) = user_id);

create policy "Daily goal settings are updateable by owner" on public.daily_goal_settings
	for update to authenticated
	using ((select auth.uid()) = user_id)
	with check ((select auth.uid()) = user_id);

create policy "Review sessions are readable by owner" on public.review_sessions
	for select to authenticated
	using ((select auth.uid()) = user_id);

create policy "Review questions are readable by session owner" on public.review_session_questions
	for select to authenticated
	using (exists (
		select 1 from public.review_sessions
		where id = review_session_id and user_id = (select auth.uid())
	));

create or replace function app_private.xp_points(p_source_type text)
returns int
language sql
immutable
set search_path = public, app_private
as $$
	select case p_source_type
		when 'lesson_completion' then 10
		when 'quiz_attempt' then 20
		when 'review_attempt' then 20
		else 0
	end
$$;

create or replace function app_private.touch_streak(p_user_id uuid, p_activity_event_id uuid, p_activity_at timestamptz)
returns void
language plpgsql
security definer
set search_path = public, app_private
as $$
declare
	v_activity_date date := (p_activity_at at time zone 'America/Los_Angeles')::date;
	v_previous_date date;
	v_previous_count int;
	v_next_count int;
begin
	insert into public.streak_events (user_id, activity_date, source_activity_event_id)
	values (p_user_id, v_activity_date, p_activity_event_id)
	on conflict (user_id, activity_date) do nothing;

	select last_activity_date, current_count
	into v_previous_date, v_previous_count
	from public.streaks
	where user_id = p_user_id;

	if v_previous_date = v_activity_date then
		return;
	end if;

	v_next_count := case
		when v_previous_date = v_activity_date - 1 then coalesce(v_previous_count, 0) + 1
		else 1
	end;

	insert into public.streaks (user_id, current_count, longest_count, last_activity_date)
	values (p_user_id, v_next_count, v_next_count, v_activity_date)
	on conflict (user_id) do update
		set current_count = v_next_count,
			longest_count = greatest(public.streaks.longest_count, v_next_count),
			last_activity_date = v_activity_date,
			updated_at = now();
end;
$$;

create or replace function public.complete_lesson(
	p_user_id uuid,
	p_topic_area_id text,
	p_release_id text,
	p_lesson_id text,
	p_lesson_version int
)
returns table(activity_event_id uuid, xp_awarded int)
language plpgsql
security definer
set search_path = public, app_private
as $$
declare
	v_source_key text := 'lesson:' || p_release_id || ':' || p_lesson_id || '@' || p_lesson_version;
	v_activity_id uuid;
	v_activity_at timestamptz := now();
	v_xp_awarded int := 0;
	v_xp_points int := app_private.xp_points('lesson_completion');
begin
	select id
	into v_activity_id
	from public.activity_events
	where user_id = p_user_id and source_key = v_source_key;

	if found then
		return query
		select v_activity_id, 0;
		return;
	end if;

	insert into public.lesson_completions (user_id, lesson_id, lesson_version, release_id, completed_at)
	values (p_user_id, p_lesson_id, p_lesson_version, p_release_id, v_activity_at)
	on conflict (user_id, lesson_id, lesson_version, release_id) do nothing;

	insert into public.activity_events (
		user_id, topic_area_id, release_id, activity_type, source_type, source_id, source_version, source_key, occurred_at
	)
	values (
		p_user_id, p_topic_area_id, p_release_id, 'lesson_completed', 'lesson', p_lesson_id, p_lesson_version, v_source_key, v_activity_at
	)
	on conflict (user_id, source_key) do update
		set metadata = public.activity_events.metadata
	returning id into v_activity_id;

	insert into public.xp_events (user_id, source_type, source_id, points)
	values (p_user_id, 'lesson_completion', v_source_key, v_xp_points)
	on conflict (user_id, source_type, source_id) do nothing;
	get diagnostics v_xp_awarded = row_count;
	v_xp_awarded := v_xp_awarded * v_xp_points;

	perform app_private.touch_streak(p_user_id, v_activity_id, v_activity_at);

	insert into public.user_progress (user_id, topic_area_id, release_id, intro_lesson_completed)
	values (p_user_id, p_topic_area_id, p_release_id, true)
	on conflict (user_id, topic_area_id, release_id) do update
		set intro_lesson_completed = true,
			updated_at = now();

	insert into public.daily_goal_settings (user_id)
	values (p_user_id)
	on conflict (user_id) do nothing;

	return query
	select v_activity_id, v_xp_awarded;
end;
$$;

revoke execute on function public.complete_lesson(uuid, text, text, text, int) from anon, authenticated, public;
grant execute on function public.complete_lesson(uuid, text, text, text, int) to service_role;

create or replace function public.submit_quiz(
	p_user_id uuid,
	p_topic_area_id text,
	p_release_id text,
	p_quiz_id text,
	p_quiz_version int,
	p_answers jsonb,
	p_submission_key text
)
returns table(attempt_id uuid, activity_event_id uuid, score numeric, correct_count int, question_count int, xp_awarded int)
language plpgsql
security definer
set search_path = public, app_private
as $$
declare
	v_attempt_id uuid;
	v_existing_attempt record;
	v_activity_id uuid;
	v_activity_at timestamptz := now();
	v_source_key text;
	v_question record;
	v_selected_choice_id text;
	v_correct_count int := 0;
	v_question_count int := 0;
	v_score numeric(5, 2) := 0;
	v_xp_awarded int := 0;
	v_xp_points int := app_private.xp_points('quiz_attempt');
begin
	if p_submission_key is null or length(trim(p_submission_key)) = 0 then
		raise exception 'submission_key is required';
	end if;

	if jsonb_typeof(p_answers) <> 'array' then
		raise exception 'answers must be a JSON array';
	end if;

	v_source_key := 'quiz:' || p_release_id || ':' || p_quiz_id || '@' || p_quiz_version || ':' || p_submission_key;

	select id, score, correct_count, question_count
	into v_existing_attempt
	from public.quiz_attempts
	where user_id = p_user_id and submission_key = p_submission_key;

	if found then
		select id
		into v_activity_id
		from public.activity_events
		where user_id = p_user_id and source_key = v_source_key;

		return query
		select
			v_existing_attempt.id,
			v_activity_id,
			v_existing_attempt.score,
			v_existing_attempt.correct_count,
			v_existing_attempt.question_count,
			0;
		return;
	end if;

	if not exists (
		select 1
		from public.content_release_items
		where release_id = p_release_id
			and content_type = 'quiz'
			and content_id = p_quiz_id
			and content_version = p_quiz_version
	) then
		raise exception 'quiz is not part of release';
	end if;

	select count(*)
	into v_question_count
	from public.quiz_question_to_quiz link
	join public.quiz_question_versions question
		on question.question_id = link.question_id
		and question.version = link.question_version
	where link.quiz_id = p_quiz_id
		and link.quiz_version = p_quiz_version
		and question.lifecycle_status = 'active';

	if jsonb_array_length(p_answers) <> v_question_count then
		raise exception 'answer count does not match quiz question count';
	end if;

	for v_question in
		select
			question.question_id,
			question.version,
			question.skill_id,
			question.device,
			question.choices,
			question.correct_choice_id
		from public.quiz_question_to_quiz link
		join public.quiz_question_versions question
			on question.question_id = link.question_id
			and question.version = link.question_version
		where link.quiz_id = p_quiz_id
			and link.quiz_version = p_quiz_version
			and question.lifecycle_status = 'active'
		order by link.ordering
	loop
		select answer.selected_choice_id
		into v_selected_choice_id
		from jsonb_to_recordset(p_answers) as answer(question_id text, selected_choice_id text)
		where answer.question_id = v_question.question_id;

		if v_selected_choice_id is null then
			raise exception 'missing answer for question %', v_question.question_id;
		end if;

		if not exists (
			select 1
			from jsonb_array_elements(v_question.choices) as choice
			where choice ->> 'id' = v_selected_choice_id
		) then
			raise exception 'invalid answer for question %', v_question.question_id;
		end if;

		if v_selected_choice_id = v_question.correct_choice_id then
			v_correct_count := v_correct_count + 1;
		end if;
	end loop;

	v_score := round((v_correct_count::numeric / greatest(v_question_count, 1)) * 100, 2);

	insert into public.quiz_attempts (
		user_id,
		quiz_id,
		quiz_version,
		release_id,
		score,
		correct_count,
		question_count,
		attempt_kind,
		submission_key,
		completed_at
	)
	values (
		p_user_id,
		p_quiz_id,
		p_quiz_version,
		p_release_id,
		v_score,
		v_correct_count,
		v_question_count,
		'quiz',
		p_submission_key,
		v_activity_at
	)
	on conflict (user_id, submission_key) where submission_key is not null do nothing
	returning id into v_attempt_id;

	if v_attempt_id is null then
		select id, score, correct_count, question_count
		into v_existing_attempt
		from public.quiz_attempts
		where user_id = p_user_id and submission_key = p_submission_key;

		select id
		into v_activity_id
		from public.activity_events
		where user_id = p_user_id and source_key = v_source_key;

		return query
		select
			v_existing_attempt.id,
			v_activity_id,
			v_existing_attempt.score,
			v_existing_attempt.correct_count,
			v_existing_attempt.question_count,
			0;
		return;
	end if;

	for v_question in
		select
			question.question_id,
			question.version,
			question.skill_id,
			question.device,
			question.correct_choice_id
		from public.quiz_question_to_quiz link
		join public.quiz_question_versions question
			on question.question_id = link.question_id
			and question.version = link.question_version
		where link.quiz_id = p_quiz_id
			and link.quiz_version = p_quiz_version
			and question.lifecycle_status = 'active'
		order by link.ordering
	loop
		select answer.selected_choice_id
		into v_selected_choice_id
		from jsonb_to_recordset(p_answers) as answer(question_id text, selected_choice_id text)
		where answer.question_id = v_question.question_id;

		insert into public.quiz_attempt_answers (
			attempt_id,
			user_id,
			question_id,
			question_version,
			skill_id,
			device,
			selected_choice_id,
			correct_choice_id,
			is_correct,
			answered_at
		)
		values (
			v_attempt_id,
			p_user_id,
			v_question.question_id,
			v_question.version,
			v_question.skill_id,
			v_question.device,
			v_selected_choice_id,
			v_question.correct_choice_id,
			v_selected_choice_id = v_question.correct_choice_id,
			v_activity_at
		);
	end loop;

	insert into public.activity_events (
		user_id, topic_area_id, release_id, activity_type, source_type, source_id, source_version, source_key, metadata, occurred_at
	)
	values (
		p_user_id,
		p_topic_area_id,
		p_release_id,
		'quiz_completed',
		'quiz',
		p_quiz_id,
		p_quiz_version,
		v_source_key,
		jsonb_build_object('attempt_id', v_attempt_id, 'score', v_score, 'correct_count', v_correct_count, 'question_count', v_question_count),
		v_activity_at
	)
	on conflict (user_id, source_key) do update
		set metadata = public.activity_events.metadata
	returning id into v_activity_id;

	insert into public.xp_events (user_id, source_type, source_id, points)
	values (p_user_id, 'quiz_attempt', v_source_key, v_xp_points)
	on conflict (user_id, source_type, source_id) do nothing;
	get diagnostics v_xp_awarded = row_count;
	v_xp_awarded := v_xp_awarded * v_xp_points;

	perform app_private.touch_streak(p_user_id, v_activity_id, v_activity_at);

	insert into public.user_progress (
		user_id,
		topic_area_id,
		release_id,
		intro_lesson_completed,
		quiz_completed,
		latest_attempt_id,
		latest_score,
		best_score,
		total_attempts
	)
	values (
		p_user_id,
		p_topic_area_id,
		p_release_id,
		true,
		true,
		v_attempt_id,
		v_score,
		v_score,
		1
	)
	on conflict (user_id, topic_area_id, release_id) do update
		set intro_lesson_completed = true,
			quiz_completed = true,
			latest_attempt_id = v_attempt_id,
			latest_score = v_score,
			best_score = greatest(coalesce(public.user_progress.best_score, 0), v_score),
			total_attempts = public.user_progress.total_attempts + 1,
			updated_at = now();

	insert into public.daily_goal_settings (user_id)
	values (p_user_id)
	on conflict (user_id) do nothing;

	return query
	select v_attempt_id, v_activity_id, v_score, v_correct_count, v_question_count, v_xp_awarded;
end;
$$;

revoke execute on function public.submit_quiz(uuid, text, text, text, int, jsonb, text) from anon, authenticated, public;
grant execute on function public.submit_quiz(uuid, text, text, text, int, jsonb, text) to service_role;

create or replace function public.create_review_session(
	p_user_id uuid,
	p_topic_area_id text,
	p_release_id text,
	p_questions jsonb
)
returns table(review_session_id uuid)
language plpgsql
security definer
set search_path = public, app_private
as $$
declare
	v_session_id uuid;
	v_question_count int := 0;
	v_inserted_count int := 0;
begin
	if jsonb_typeof(p_questions) <> 'array' then
		raise exception 'questions must be a JSON array';
	end if;

	select count(*)
	into v_question_count
	from jsonb_to_recordset(p_questions) as question(
		question_id text,
		question_version int,
		reason_code text,
		reason_label text,
		ordering int
	);

	if v_question_count = 0 then
		raise exception 'review session requires at least one question';
	end if;

	insert into public.review_sessions (user_id, topic_area_id, release_id, status)
	values (p_user_id, p_topic_area_id, p_release_id, 'created')
	on conflict (user_id, release_id) where status = 'created' do update
		set status = public.review_sessions.status
	returning id into v_session_id;

	if not exists (
		select 1
		from public.review_session_questions
		where review_session_id = v_session_id
	) then
		insert into public.review_session_questions (
			review_session_id,
			question_id,
			question_version,
			reason_code,
			reason_label,
			ordering
		)
		select
			v_session_id,
			input.question_id,
			input.question_version,
			input.reason_code,
			input.reason_label,
			input.ordering
		from jsonb_to_recordset(p_questions) as input(
			question_id text,
			question_version int,
			reason_code text,
			reason_label text,
			ordering int
		)
		join public.quiz_question_versions question
			on question.question_id = input.question_id
			and question.version = input.question_version
		join public.content_release_items release_item
			on release_item.release_id = p_release_id
			and release_item.content_type = 'quiz_question'
			and release_item.content_id = input.question_id
			and release_item.content_version = input.question_version
		where question.lifecycle_status = 'active';

		get diagnostics v_inserted_count = row_count;
		if v_inserted_count <> v_question_count then
			raise exception 'review session questions must be active release questions';
		end if;
	end if;

	return query
	select v_session_id;
end;
$$;

revoke execute on function public.create_review_session(uuid, text, text, jsonb) from anon, authenticated, public;
grant execute on function public.create_review_session(uuid, text, text, jsonb) to service_role;

create or replace function public.complete_review_session(
	p_user_id uuid,
	p_topic_area_id text,
	p_release_id text,
	p_review_session_id uuid,
	p_answers jsonb,
	p_submission_key text
)
returns table(attempt_id uuid, activity_event_id uuid, score numeric, correct_count int, question_count int, xp_awarded int)
language plpgsql
security definer
set search_path = public, app_private
as $$
declare
	v_attempt_id uuid;
	v_existing_attempt record;
	v_activity_id uuid;
	v_activity_at timestamptz := now();
	v_source_key text;
	v_question record;
	v_selected_choice_id text;
	v_correct_count int := 0;
	v_question_count int := 0;
	v_score numeric(5, 2) := 0;
	v_xp_awarded int := 0;
	v_xp_points int := app_private.xp_points('review_attempt');
begin
	if p_submission_key is null or length(trim(p_submission_key)) = 0 then
		raise exception 'submission_key is required';
	end if;

	if jsonb_typeof(p_answers) <> 'array' then
		raise exception 'answers must be a JSON array';
	end if;

	v_source_key := 'review:' || p_release_id || ':' || p_review_session_id || ':' || p_submission_key;

	select id, score, correct_count, question_count
	into v_existing_attempt
	from public.quiz_attempts
	where user_id = p_user_id and submission_key = p_submission_key;

	if found then
		select id
		into v_activity_id
		from public.activity_events
		where user_id = p_user_id and source_key = v_source_key;

		return query
		select
			v_existing_attempt.id,
			v_activity_id,
			v_existing_attempt.score,
			v_existing_attempt.correct_count,
			v_existing_attempt.question_count,
			0;
		return;
	end if;

	if not exists (
		select 1
		from public.review_sessions
		where id = p_review_session_id
			and user_id = p_user_id
			and topic_area_id = p_topic_area_id
			and release_id = p_release_id
			and status = 'created'
	) then
		raise exception 'review session is not available';
	end if;

	select count(*)
	into v_question_count
	from public.review_session_questions
	where review_session_id = p_review_session_id;

	if v_question_count = 0 then
		raise exception 'review session has no questions';
	end if;

	if jsonb_array_length(p_answers) <> v_question_count then
		raise exception 'answer count does not match review question count';
	end if;

	for v_question in
		select
			question.question_id,
			question.version,
			question.skill_id,
			question.device,
			question.choices,
			question.correct_choice_id
		from public.review_session_questions review_question
		join public.quiz_question_versions question
			on question.question_id = review_question.question_id
			and question.version = review_question.question_version
		where review_question.review_session_id = p_review_session_id
		order by review_question.ordering
	loop
		select answer.selected_choice_id
		into v_selected_choice_id
		from jsonb_to_recordset(p_answers) as answer(question_id text, selected_choice_id text)
		where answer.question_id = v_question.question_id;

		if v_selected_choice_id is null then
			raise exception 'missing answer for question %', v_question.question_id;
		end if;

		if not exists (
			select 1
			from jsonb_array_elements(v_question.choices) as choice
			where choice ->> 'id' = v_selected_choice_id
		) then
			raise exception 'invalid answer for question %', v_question.question_id;
		end if;

		if v_selected_choice_id = v_question.correct_choice_id then
			v_correct_count := v_correct_count + 1;
		end if;
	end loop;

	v_score := round((v_correct_count::numeric / greatest(v_question_count, 1)) * 100, 2);

	insert into public.quiz_attempts (
		user_id,
		quiz_id,
		quiz_version,
		release_id,
		score,
		correct_count,
		question_count,
		attempt_kind,
		review_session_id,
		submission_key,
		completed_at
	)
	values (
		p_user_id,
		null,
		null,
		p_release_id,
		v_score,
		v_correct_count,
		v_question_count,
		'review',
		p_review_session_id,
		p_submission_key,
		v_activity_at
	)
	on conflict (user_id, submission_key) where submission_key is not null do nothing
	returning id into v_attempt_id;

	if v_attempt_id is null then
		select id, score, correct_count, question_count
		into v_existing_attempt
		from public.quiz_attempts
		where user_id = p_user_id and submission_key = p_submission_key;

		select id
		into v_activity_id
		from public.activity_events
		where user_id = p_user_id and source_key = v_source_key;

		return query
		select
			v_existing_attempt.id,
			v_activity_id,
			v_existing_attempt.score,
			v_existing_attempt.correct_count,
			v_existing_attempt.question_count,
			0;
		return;
	end if;

	for v_question in
		select
			question.question_id,
			question.version,
			question.skill_id,
			question.device,
			question.correct_choice_id
		from public.review_session_questions review_question
		join public.quiz_question_versions question
			on question.question_id = review_question.question_id
			and question.version = review_question.question_version
		where review_question.review_session_id = p_review_session_id
		order by review_question.ordering
	loop
		select answer.selected_choice_id
		into v_selected_choice_id
		from jsonb_to_recordset(p_answers) as answer(question_id text, selected_choice_id text)
		where answer.question_id = v_question.question_id;

		insert into public.quiz_attempt_answers (
			attempt_id,
			user_id,
			question_id,
			question_version,
			skill_id,
			device,
			selected_choice_id,
			correct_choice_id,
			is_correct,
			answered_at
		)
		values (
			v_attempt_id,
			p_user_id,
			v_question.question_id,
			v_question.version,
			v_question.skill_id,
			v_question.device,
			v_selected_choice_id,
			v_question.correct_choice_id,
			v_selected_choice_id = v_question.correct_choice_id,
			v_activity_at
		);
	end loop;

	insert into public.activity_events (
		user_id, topic_area_id, release_id, activity_type, source_type, source_id, source_key, metadata, occurred_at
	)
	values (
		p_user_id,
		p_topic_area_id,
		p_release_id,
		'review_completed',
		'review_session',
		p_review_session_id::text,
		v_source_key,
		jsonb_build_object('attempt_id', v_attempt_id, 'score', v_score, 'correct_count', v_correct_count, 'question_count', v_question_count),
		v_activity_at
	)
	on conflict (user_id, source_key) do update
		set metadata = public.activity_events.metadata
	returning id into v_activity_id;

	insert into public.xp_events (user_id, source_type, source_id, points)
	values (p_user_id, 'review_attempt', v_source_key, v_xp_points)
	on conflict (user_id, source_type, source_id) do nothing;
	get diagnostics v_xp_awarded = row_count;
	v_xp_awarded := v_xp_awarded * v_xp_points;

	perform app_private.touch_streak(p_user_id, v_activity_id, v_activity_at);

	update public.review_sessions
	set status = 'completed',
		completed_at = v_activity_at
	where id = p_review_session_id;

	insert into public.user_progress (
		user_id,
		topic_area_id,
		release_id,
		latest_attempt_id,
		latest_score,
		best_score,
		total_attempts
	)
	values (
		p_user_id,
		p_topic_area_id,
		p_release_id,
		v_attempt_id,
		v_score,
		v_score,
		1
	)
	on conflict (user_id, topic_area_id, release_id) do update
		set latest_attempt_id = v_attempt_id,
			latest_score = v_score,
			best_score = greatest(coalesce(public.user_progress.best_score, 0), v_score),
			total_attempts = public.user_progress.total_attempts + 1,
			updated_at = now();

	insert into public.daily_goal_settings (user_id)
	values (p_user_id)
	on conflict (user_id) do nothing;

	return query
	select v_attempt_id, v_activity_id, v_score, v_correct_count, v_question_count, v_xp_awarded;
end;
$$;

revoke execute on function public.complete_review_session(uuid, text, text, uuid, jsonb, text) from anon, authenticated, public;
grant execute on function public.complete_review_session(uuid, text, text, uuid, jsonb, text) to service_role;

revoke execute on function app_private.xp_points(text) from anon, authenticated, public;
grant execute on function app_private.xp_points(text) to service_role;

revoke execute on function app_private.touch_streak(uuid, uuid, timestamptz) from anon, authenticated, public;
grant execute on function app_private.touch_streak(uuid, uuid, timestamptz) to service_role;
