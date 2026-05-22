alter table public.diagnostic_attempts
	add column if not exists submission_key text;

create unique index if not exists diagnostic_attempts_user_submission_key_idx
	on public.diagnostic_attempts (user_id, submission_key)
	where submission_key is not null;

create table if not exists public.diagnostic_attempt_answers (
	diagnostic_attempt_id uuid not null references public.diagnostic_attempts(id) on delete cascade,
	user_id uuid not null references auth.users(id) on delete cascade,
	question_id text not null,
	question_version int not null,
	skill_id text not null references public.skills(id) on delete restrict,
	device text not null,
	selected_choice_id text not null,
	correct_choice_id text not null,
	is_correct boolean not null,
	answered_at timestamptz not null default now(),
	primary key (diagnostic_attempt_id, question_id, question_version),
	foreign key (question_id, question_version) references public.quiz_question_versions(question_id, version) on delete restrict
);

create index if not exists diagnostic_attempt_answers_user_idx
	on public.diagnostic_attempt_answers (user_id, answered_at desc);

alter table public.diagnostic_attempt_answers enable row level security;

create policy "Diagnostic answers are readable by owner" on public.diagnostic_attempt_answers
	for select to authenticated using ((select auth.uid()) = user_id);

alter table public.skill_mastery_events
	add column if not exists source_key text,
	add column if not exists question_id text,
	add column if not exists question_version int,
	add column if not exists previous_mastery_score numeric,
	add column if not exists new_mastery_score numeric;

create unique index if not exists skill_mastery_events_user_source_key_idx
	on public.skill_mastery_events (user_id, source_key)
	where source_key is not null;

alter table public.spaced_repetition_items
	add column if not exists id uuid not null default extensions.gen_random_uuid(),
	add column if not exists state text not null default 'new' check (state in ('new', 'learning', 'review', 'mastered')),
	add column if not exists review_count int not null default 0 check (review_count >= 0),
	add column if not exists lapse_count int not null default 0 check (lapse_count >= 0),
	add column if not exists last_reviewed_at timestamptz;

create unique index if not exists spaced_repetition_items_id_idx
	on public.spaced_repetition_items (id);

alter table public.spaced_repetition_reviews
	add column if not exists item_id uuid references public.spaced_repetition_items(id) on delete set null,
	add column if not exists source_key text,
	add column if not exists grade_label text check (grade_label in ('again', 'hard', 'good', 'easy')),
	add column if not exists response_time_ms int not null default 0 check (response_time_ms >= 0),
	add column if not exists previous_learning_state text,
	add column if not exists new_learning_state text,
	add column if not exists previous_interval_days int,
	add column if not exists new_interval_days int,
	add column if not exists previous_ease_factor numeric,
	add column if not exists new_ease_factor numeric,
	add column if not exists source text check (source in ('quiz', 'review', 'diagnostic', 'drill'));

create unique index if not exists spaced_repetition_reviews_user_source_key_idx
	on public.spaced_repetition_reviews (user_id, source_key)
	where source_key is not null;

alter table public.spaced_repetition_reviews
	add constraint spaced_repetition_reviews_question_version_fk
	foreign key (question_id, question_version)
	references public.quiz_question_versions(question_id, version)
	on delete restrict;

alter table public.review_session_questions
	drop constraint if exists review_session_questions_reason_code_check;

alter table public.review_session_questions
	add constraint review_session_questions_reason_code_check
	check (reason_code in ('missed_question', 'low_skill_accuracy', 'not_seen_recently', 'due_spaced_repetition'));
