create extension if not exists pgcrypto with schema extensions;

create schema if not exists app_private;
revoke all on schema app_private from anon, authenticated;

create or replace function app_private.set_updated_at()
returns trigger
language plpgsql
as $$
begin
	new.updated_at = now();
	return new;
end;
$$;

create table public.profiles (
	user_id uuid primary key references auth.users(id) on delete cascade,
	email text,
	display_name text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create or replace function app_private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
	insert into public.profiles (user_id, email, display_name)
	values (
		new.id,
		new.email,
		coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
	)
	on conflict (user_id) do update
		set email = excluded.email,
			updated_at = now();

	return new;
end;
$$;

create trigger on_auth_user_created
	after insert on auth.users
	for each row execute function app_private.handle_new_user();

create trigger profiles_set_updated_at
	before update on public.profiles
	for each row execute function app_private.set_updated_at();

create table public.content_runs (
	id text primary key,
	title text not null,
	subject_area_id text,
	topic_area_id text,
	authoring_mode text not null check (authoring_mode in ('hand-authored', 'generated')),
	source_refs jsonb not null default '[]'::jsonb,
	manifest jsonb not null default '{}'::jsonb,
	schema_version int not null,
	created_at timestamptz not null default now()
);

create table public.subject_areas (
	id text primary key,
	slug text not null unique,
	created_at timestamptz not null default now()
);

create table public.subject_area_versions (
	subject_area_id text not null references public.subject_areas(id) on delete restrict,
	version int not null check (version > 0),
	name text not null,
	summary text not null,
	content_run_id text not null references public.content_runs(id) on delete restrict,
	source_refs jsonb not null default '[]'::jsonb,
	schema_version int not null,
	created_at timestamptz not null default now(),
	primary key (subject_area_id, version)
);

create table public.topic_areas (
	id text primary key,
	subject_area_id text not null references public.subject_areas(id) on delete restrict,
	slug text not null unique,
	created_at timestamptz not null default now()
);

create table public.topic_area_versions (
	topic_area_id text not null references public.topic_areas(id) on delete restrict,
	version int not null check (version > 0),
	subject_area_id text not null references public.subject_areas(id) on delete restrict,
	name text not null,
	summary text not null,
	content_run_id text not null references public.content_runs(id) on delete restrict,
	source_refs jsonb not null default '[]'::jsonb,
	schema_version int not null,
	created_at timestamptz not null default now(),
	primary key (topic_area_id, version)
);

create table public.skills (
	id text primary key,
	topic_area_id text not null references public.topic_areas(id) on delete restrict,
	slug text not null unique,
	created_at timestamptz not null default now()
);

create table public.skill_versions (
	skill_id text not null references public.skills(id) on delete restrict,
	version int not null check (version > 0),
	topic_area_id text not null references public.topic_areas(id) on delete restrict,
	name text not null,
	device text not null,
	summary text not null,
	content_run_id text not null references public.content_runs(id) on delete restrict,
	source_refs jsonb not null default '[]'::jsonb,
	schema_version int not null,
	created_at timestamptz not null default now(),
	primary key (skill_id, version)
);

create table public.lessons (
	id text primary key,
	topic_area_id text not null references public.topic_areas(id) on delete restrict,
	slug text not null unique,
	created_at timestamptz not null default now()
);

create table public.lesson_versions (
	lesson_id text not null references public.lessons(id) on delete restrict,
	version int not null check (version > 0),
	topic_area_id text not null references public.topic_areas(id) on delete restrict,
	title text not null,
	summary text not null,
	body_markdown text not null,
	skill_ids text[] not null default '{}',
	estimated_minutes int not null check (estimated_minutes > 0),
	sort_order int not null,
	content_run_id text not null references public.content_runs(id) on delete restrict,
	source_refs jsonb not null default '[]'::jsonb,
	schema_version int not null,
	created_at timestamptz not null default now(),
	primary key (lesson_id, version)
);

create table public.quizzes (
	id text primary key,
	topic_area_id text not null references public.topic_areas(id) on delete restrict,
	slug text not null unique,
	created_at timestamptz not null default now()
);

create table public.quiz_versions (
	quiz_id text not null references public.quizzes(id) on delete restrict,
	version int not null check (version > 0),
	topic_area_id text not null references public.topic_areas(id) on delete restrict,
	title text not null,
	description text not null,
	kind text not null check (kind in ('practice', 'assessment')),
	question_count int not null check (question_count > 0),
	content_run_id text not null references public.content_runs(id) on delete restrict,
	source_refs jsonb not null default '[]'::jsonb,
	schema_version int not null,
	created_at timestamptz not null default now(),
	primary key (quiz_id, version)
);

create table public.quiz_questions (
	id text primary key,
	topic_area_id text not null references public.topic_areas(id) on delete restrict,
	created_at timestamptz not null default now()
);

create table public.quiz_question_versions (
	question_id text not null references public.quiz_questions(id) on delete restrict,
	version int not null check (version > 0),
	topic_area_id text not null references public.topic_areas(id) on delete restrict,
	skill_id text not null references public.skills(id) on delete restrict,
	device text not null,
	question_type text not null check (question_type in ('recognition', 'application')),
	difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
	prompt text not null,
	choices jsonb not null,
	correct_choice_id text not null,
	explanation text not null,
	content_run_id text not null references public.content_runs(id) on delete restrict,
	source_refs jsonb not null default '[]'::jsonb,
	schema_version int not null,
	created_at timestamptz not null default now(),
	primary key (question_id, version),
	constraint quiz_question_versions_choices_array check (jsonb_typeof(choices) = 'array')
);

create table public.quiz_question_to_quiz (
	quiz_id text not null,
	quiz_version int not null,
	question_id text not null,
	question_version int not null,
	ordering int not null check (ordering > 0),
	weight numeric(6, 2) not null default 1 check (weight > 0),
	primary key (quiz_id, quiz_version, question_id, question_version),
	unique (quiz_id, quiz_version, ordering),
	foreign key (quiz_id, quiz_version) references public.quiz_versions(quiz_id, version) on delete restrict,
	foreign key (question_id, question_version) references public.quiz_question_versions(question_id, version) on delete restrict
);

create table public.learning_paths (
	id text primary key,
	topic_area_id text not null references public.topic_areas(id) on delete restrict,
	slug text not null unique,
	created_at timestamptz not null default now()
);

create table public.learning_path_versions (
	learning_path_id text not null references public.learning_paths(id) on delete restrict,
	version int not null check (version > 0),
	topic_area_id text not null references public.topic_areas(id) on delete restrict,
	title text not null,
	summary text not null,
	content_run_id text not null references public.content_runs(id) on delete restrict,
	source_refs jsonb not null default '[]'::jsonb,
	schema_version int not null,
	created_at timestamptz not null default now(),
	primary key (learning_path_id, version)
);

create table public.learning_path_items (
	learning_path_id text not null,
	learning_path_version int not null,
	item_type text not null check (item_type in ('lesson', 'quiz')),
	item_id text not null,
	item_version int not null,
	ordering int not null check (ordering > 0),
	required boolean not null default true,
	primary key (learning_path_id, learning_path_version, item_type, item_id, item_version),
	unique (learning_path_id, learning_path_version, ordering),
	foreign key (learning_path_id, learning_path_version) references public.learning_path_versions(learning_path_id, version) on delete restrict
);

create table public.media_assets (
	id text primary key,
	created_at timestamptz not null default now()
);

create table public.media_asset_versions (
	media_asset_id text not null references public.media_assets(id) on delete restrict,
	version int not null check (version > 0),
	asset_type text not null,
	storage_bucket text not null,
	storage_path text not null,
	mime_type text not null,
	alt_text text,
	content_run_id text references public.content_runs(id) on delete restrict,
	source_refs jsonb not null default '[]'::jsonb,
	schema_version int not null,
	created_at timestamptz not null default now(),
	primary key (media_asset_id, version),
	unique (storage_bucket, storage_path)
);

create table public.content_releases (
	id text primary key,
	slug text not null unique,
	title text not null,
	scope_type text not null check (scope_type in ('subject_area', 'topic_area', 'learning_path', 'content_bundle')),
	scope_id text not null,
	status text not null check (status in ('draft', 'published', 'retired')),
	content_run_id text not null references public.content_runs(id) on delete restrict,
	manifest jsonb not null default '{}'::jsonb,
	published_at timestamptz,
	created_at timestamptz not null default now(),
	constraint published_releases_have_date check (status <> 'published' or published_at is not null)
);

create table public.content_release_bundles (
	id uuid primary key default extensions.gen_random_uuid(),
	release_id text not null references public.content_releases(id) on delete cascade,
	scope_type text not null,
	scope_id text not null,
	bundle_key text not null,
	created_at timestamptz not null default now(),
	unique (release_id, bundle_key)
);

create table public.content_release_items (
	release_id text not null references public.content_releases(id) on delete cascade,
	content_type text not null check (
		content_type in (
			'subject_area',
			'topic_area',
			'skill',
			'lesson',
			'quiz',
			'quiz_question',
			'learning_path',
			'media_asset'
		)
	),
	content_id text not null,
	content_version int not null check (content_version > 0),
	primary key (release_id, content_type, content_id, content_version)
);

create table public.lesson_completions (
	user_id uuid not null references auth.users(id) on delete cascade,
	lesson_id text not null,
	lesson_version int not null,
	release_id text not null references public.content_releases(id) on delete restrict,
	completed_at timestamptz not null default now(),
	primary key (user_id, lesson_id, lesson_version, release_id),
	foreign key (lesson_id, lesson_version) references public.lesson_versions(lesson_id, version) on delete restrict
);

create table public.quiz_attempts (
	id uuid primary key default extensions.gen_random_uuid(),
	user_id uuid not null references auth.users(id) on delete cascade,
	quiz_id text not null,
	quiz_version int not null,
	release_id text not null references public.content_releases(id) on delete restrict,
	score numeric(5, 2) not null check (score >= 0 and score <= 100),
	correct_count int not null check (correct_count >= 0),
	question_count int not null check (question_count > 0),
	completed_at timestamptz not null default now(),
	created_at timestamptz not null default now(),
	foreign key (quiz_id, quiz_version) references public.quiz_versions(quiz_id, version) on delete restrict
);

create table public.quiz_attempt_answers (
	id uuid primary key default extensions.gen_random_uuid(),
	attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
	user_id uuid not null references auth.users(id) on delete cascade,
	question_id text not null,
	question_version int not null,
	skill_id text not null references public.skills(id) on delete restrict,
	device text not null,
	selected_choice_id text not null,
	correct_choice_id text not null,
	is_correct boolean not null,
	answered_at timestamptz not null default now(),
	foreign key (question_id, question_version) references public.quiz_question_versions(question_id, version) on delete restrict
);

create table public.user_progress (
	user_id uuid not null references auth.users(id) on delete cascade,
	topic_area_id text not null references public.topic_areas(id) on delete restrict,
	release_id text not null references public.content_releases(id) on delete restrict,
	intro_lesson_completed boolean not null default false,
	quiz_completed boolean not null default false,
	latest_attempt_id uuid references public.quiz_attempts(id) on delete set null,
	latest_score numeric(5, 2),
	best_score numeric(5, 2),
	total_attempts int not null default 0 check (total_attempts >= 0),
	updated_at timestamptz not null default now(),
	primary key (user_id, topic_area_id, release_id)
);

create trigger user_progress_set_updated_at
	before update on public.user_progress
	for each row execute function app_private.set_updated_at();

create table public.streaks (
	user_id uuid primary key references auth.users(id) on delete cascade,
	current_count int not null default 0,
	longest_count int not null default 0,
	last_activity_date date,
	updated_at timestamptz not null default now()
);

create table public.xp_events (
	id uuid primary key default extensions.gen_random_uuid(),
	user_id uuid not null references auth.users(id) on delete cascade,
	source_type text not null,
	source_id text not null,
	points int not null check (points >= 0),
	created_at timestamptz not null default now()
);

create table public.spaced_repetition_state (
	user_id uuid not null references auth.users(id) on delete cascade,
	skill_id text not null references public.skills(id) on delete restrict,
	release_id text not null references public.content_releases(id) on delete restrict,
	review_state jsonb not null default '{}'::jsonb,
	due_at timestamptz,
	updated_at timestamptz not null default now(),
	primary key (user_id, skill_id, release_id)
);

create index quiz_attempts_user_quiz_created_idx on public.quiz_attempts (user_id, quiz_id, created_at desc);
create index quiz_attempt_answers_user_device_idx on public.quiz_attempt_answers (user_id, device);
create index content_releases_scope_published_idx on public.content_releases (scope_type, scope_id, published_at desc) where status = 'published';
create index content_release_items_lookup_idx on public.content_release_items (content_type, content_id, content_version);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
	('curriculum-artifacts', 'curriculum-artifacts', false, 52428800, null),
	('curriculum-media', 'curriculum-media', false, 52428800, array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'audio/mpeg', 'video/mp4'])
on conflict (id) do update
	set public = excluded.public,
		file_size_limit = excluded.file_size_limit,
		allowed_mime_types = excluded.allowed_mime_types;

alter table public.profiles enable row level security;
alter table public.content_runs enable row level security;
alter table public.subject_areas enable row level security;
alter table public.subject_area_versions enable row level security;
alter table public.topic_areas enable row level security;
alter table public.topic_area_versions enable row level security;
alter table public.skills enable row level security;
alter table public.skill_versions enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_versions enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_versions enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_question_versions enable row level security;
alter table public.quiz_question_to_quiz enable row level security;
alter table public.learning_paths enable row level security;
alter table public.learning_path_versions enable row level security;
alter table public.learning_path_items enable row level security;
alter table public.media_assets enable row level security;
alter table public.media_asset_versions enable row level security;
alter table public.content_releases enable row level security;
alter table public.content_release_bundles enable row level security;
alter table public.content_release_items enable row level security;
alter table public.lesson_completions enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.quiz_attempt_answers enable row level security;
alter table public.user_progress enable row level security;
alter table public.streaks enable row level security;
alter table public.xp_events enable row level security;
alter table public.spaced_repetition_state enable row level security;

create policy "Profiles are readable by owner" on public.profiles
	for select to authenticated
	using ((select auth.uid()) = user_id);

create policy "Profiles are updateable by owner" on public.profiles
	for update to authenticated
	using ((select auth.uid()) = user_id)
	with check ((select auth.uid()) = user_id);

create policy "Published content is readable" on public.content_runs for select to anon, authenticated using (true);
create policy "Published subject areas are readable" on public.subject_areas for select to anon, authenticated using (true);
create policy "Published subject area versions are readable" on public.subject_area_versions for select to anon, authenticated using (true);
create policy "Published topic areas are readable" on public.topic_areas for select to anon, authenticated using (true);
create policy "Published topic area versions are readable" on public.topic_area_versions for select to anon, authenticated using (true);
create policy "Published skills are readable" on public.skills for select to anon, authenticated using (true);
create policy "Published skill versions are readable" on public.skill_versions for select to anon, authenticated using (true);
create policy "Published lessons are readable" on public.lessons for select to anon, authenticated using (true);
create policy "Published lesson versions are readable" on public.lesson_versions for select to anon, authenticated using (true);
create policy "Published quizzes are readable" on public.quizzes for select to anon, authenticated using (true);
create policy "Published quiz versions are readable" on public.quiz_versions for select to anon, authenticated using (true);
create policy "Published questions are readable" on public.quiz_questions for select to anon, authenticated using (true);
create policy "Published question versions are readable" on public.quiz_question_versions for select to anon, authenticated using (true);
create policy "Published quiz relationships are readable" on public.quiz_question_to_quiz for select to anon, authenticated using (true);
create policy "Published learning paths are readable" on public.learning_paths for select to anon, authenticated using (true);
create policy "Published learning path versions are readable" on public.learning_path_versions for select to anon, authenticated using (true);
create policy "Published learning path items are readable" on public.learning_path_items for select to anon, authenticated using (true);
create policy "Published media assets are readable" on public.media_assets for select to anon, authenticated using (true);
create policy "Published media asset versions are readable" on public.media_asset_versions for select to anon, authenticated using (true);
create policy "Published releases are readable" on public.content_releases for select to anon, authenticated using (status = 'published');
create policy "Published release bundles are readable" on public.content_release_bundles for select to anon, authenticated
	using (exists (select 1 from public.content_releases where id = release_id and status = 'published'));
create policy "Published release items are readable" on public.content_release_items for select to anon, authenticated
	using (exists (select 1 from public.content_releases where id = release_id and status = 'published'));

create policy "Lesson completions are readable by owner" on public.lesson_completions
	for select to authenticated
	using ((select auth.uid()) = user_id);

create policy "Quiz attempts are readable by owner" on public.quiz_attempts
	for select to authenticated
	using ((select auth.uid()) = user_id);

create policy "Quiz attempt answers are readable by owner" on public.quiz_attempt_answers
	for select to authenticated
	using ((select auth.uid()) = user_id);

create policy "Progress is readable by owner" on public.user_progress
	for select to authenticated
	using ((select auth.uid()) = user_id);

create policy "Streaks are readable by owner" on public.streaks
	for select to authenticated
	using ((select auth.uid()) = user_id);

create policy "XP events are readable by owner" on public.xp_events
	for select to authenticated
	using ((select auth.uid()) = user_id);

create policy "Spaced repetition state is readable by owner" on public.spaced_repetition_state
	for select to authenticated
	using ((select auth.uid()) = user_id);

create policy "Curriculum media can be read by signed-in users" on storage.objects
	for select to authenticated
	using (bucket_id = 'curriculum-media');
