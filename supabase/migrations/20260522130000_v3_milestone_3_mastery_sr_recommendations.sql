create table public.diagnostic_attempts (
	id uuid primary key default extensions.gen_random_uuid(),
	user_id uuid not null references auth.users(id) on delete cascade,
	topic_area_id text not null references public.topic_areas(id) on delete restrict,
	release_id text not null references public.content_releases(id) on delete restrict,
	status text not null default 'completed' check (status in ('started', 'completed', 'abandoned')),
	started_at timestamptz not null default now(),
	completed_at timestamptz
);

create table public.diagnostic_placement_outcomes (
	id uuid primary key default extensions.gen_random_uuid(),
	diagnostic_attempt_id uuid not null references public.diagnostic_attempts(id) on delete cascade,
	skill_id text not null references public.skills(id) on delete restrict,
	outcome text not null check (outcome in ('placed_out', 'needs_practice', 'unknown')),
	confidence numeric not null default 0 check (confidence >= 0 and confidence <= 1),
	created_at timestamptz not null default now()
);

create table public.skill_mastery_events (
	id uuid primary key default extensions.gen_random_uuid(),
	user_id uuid not null references auth.users(id) on delete cascade,
	topic_area_id text not null references public.topic_areas(id) on delete restrict,
	skill_id text not null references public.skills(id) on delete restrict,
	source_type text not null check (source_type in ('diagnostic', 'quiz', 'drill', 'review')),
	source_id text not null,
	delta numeric not null,
	evidence jsonb not null default '{}'::jsonb,
	occurred_at timestamptz not null default now()
);

create table public.skill_mastery_projections (
	user_id uuid not null references auth.users(id) on delete cascade,
	topic_area_id text not null references public.topic_areas(id) on delete restrict,
	skill_id text not null references public.skills(id) on delete restrict,
	mastery_score numeric not null default 0 check (mastery_score >= 0 and mastery_score <= 1),
	evidence_count int not null default 0 check (evidence_count >= 0),
	updated_at timestamptz not null default now(),
	primary key (user_id, topic_area_id, skill_id)
);

create table public.spaced_repetition_items (
	user_id uuid not null references auth.users(id) on delete cascade,
	topic_area_id text not null references public.topic_areas(id) on delete restrict,
	release_id text not null references public.content_releases(id) on delete restrict,
	question_id text not null references public.quiz_questions(id) on delete restrict,
	question_version int not null,
	skill_id text not null references public.skills(id) on delete restrict,
	repetitions int not null default 0 check (repetitions >= 0),
	ease_factor numeric not null default 2.5 check (ease_factor >= 1.3),
	interval_days int not null default 0 check (interval_days >= 0),
	due_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	primary key (user_id, question_id, question_version)
);

create trigger spaced_repetition_items_set_updated_at
	before update on public.spaced_repetition_items
	for each row execute function app_private.set_updated_at();

create table public.spaced_repetition_reviews (
	id uuid primary key default extensions.gen_random_uuid(),
	user_id uuid not null references auth.users(id) on delete cascade,
	topic_area_id text not null references public.topic_areas(id) on delete restrict,
	question_id text not null,
	question_version int not null,
	grade int not null check (grade between 0 and 5),
	previous_state jsonb not null default '{}'::jsonb,
	next_state jsonb not null default '{}'::jsonb,
	reviewed_at timestamptz not null default now()
);

create table public.recommendation_events (
	id uuid primary key default extensions.gen_random_uuid(),
	user_id uuid not null references auth.users(id) on delete cascade,
	topic_area_id text references public.topic_areas(id) on delete restrict,
	recommendation_id text not null,
	reason text not null check (reason in ('generated', 'shown', 'started', 'skipped', 'dismissed')),
	payload jsonb not null default '{}'::jsonb,
	occurred_at timestamptz not null default now()
);

create index diagnostic_attempts_user_topic_idx on public.diagnostic_attempts (user_id, topic_area_id, started_at desc);
create index diagnostic_outcomes_attempt_idx on public.diagnostic_placement_outcomes (diagnostic_attempt_id);
create index skill_mastery_events_user_topic_idx on public.skill_mastery_events (user_id, topic_area_id, occurred_at desc);
create index spaced_repetition_items_due_idx on public.spaced_repetition_items (user_id, due_at, topic_area_id);
create index spaced_repetition_reviews_user_topic_idx on public.spaced_repetition_reviews (user_id, topic_area_id, reviewed_at desc);
create index recommendation_events_user_reason_idx on public.recommendation_events (user_id, reason, occurred_at desc);

alter table public.diagnostic_attempts enable row level security;
alter table public.diagnostic_placement_outcomes enable row level security;
alter table public.skill_mastery_events enable row level security;
alter table public.skill_mastery_projections enable row level security;
alter table public.spaced_repetition_items enable row level security;
alter table public.spaced_repetition_reviews enable row level security;
alter table public.recommendation_events enable row level security;

create policy "Diagnostic attempts are readable by owner" on public.diagnostic_attempts
	for select to authenticated using ((select auth.uid()) = user_id);
create policy "Diagnostic outcomes are readable through owned attempts" on public.diagnostic_placement_outcomes
	for select to authenticated using (
		exists (
			select 1 from public.diagnostic_attempts attempt
			where attempt.id = diagnostic_attempt_id and attempt.user_id = (select auth.uid())
		)
	);
create policy "Skill mastery events are readable by owner" on public.skill_mastery_events
	for select to authenticated using ((select auth.uid()) = user_id);
create policy "Skill mastery projections are readable by owner" on public.skill_mastery_projections
	for select to authenticated using ((select auth.uid()) = user_id);
create policy "SR items are readable by owner" on public.spaced_repetition_items
	for select to authenticated using ((select auth.uid()) = user_id);
create policy "SR reviews are readable by owner" on public.spaced_repetition_reviews
	for select to authenticated using ((select auth.uid()) = user_id);
create policy "Recommendation events are readable by owner" on public.recommendation_events
	for select to authenticated using ((select auth.uid()) = user_id);

