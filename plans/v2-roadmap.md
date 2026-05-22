# V2 Roadmap

V2 moves Learn Anything from one validated MVP loop into a small, repeatable learning platform. It builds directly on the v1 Literary Devices path rather than replacing it.

Theme: **discover, return, and improve**.

## Objective

V2 is complete when a learner can discover Literary Devices publicly, sign in, move through a multi-step path, return on another day with streak/XP state intact, review weak devices, and see progress that reflects more than one quiz attempt and more than one content release.

The implementation must provide these platform capabilities:

- public discovery does not expose protected practice content or answer keys
- route data, mutations, auth, and secrets follow SvelteKit server boundaries
- learner activity is append-friendly and can survive content release changes
- progress and recommendations are derived from durable events and published content
- content can be imported, validated, published, and rolled back in staging before production

## Implementation Principles

### Public Data Boundary

Public discovery uses an explicit metadata contract. Anonymous users may read topic metadata, release metadata, and preview-safe excerpts only.

Protected practice content includes full lesson bodies, quiz questions, answer keys, explanations, progress, attempt history, XP, streaks, daily goals, and review sessions. These records must not be readable through the public Supabase key.

### Progress Model

Learner progress is item-level and release-aware. Lesson completions, quiz attempts, review attempts, XP events, streak events, and activity events are the durable record. Summary rows such as `user_progress` or `streaks` are projections and may be recomputed.

### Mutation Integrity

Learner mutations must be atomic and idempotent. Completing a lesson, submitting a quiz, or completing a review session writes the source activity, derived activity event, XP event, streak event/projection, and progress projection in one transaction.

### Review Analytics

Review sessions feed the same skill accuracy and progress calculations as regular quizzes. Attempts use `attempt_kind = 'quiz' | 'review'` unless implementation work proves that separate review attempt tables are materially simpler. Separate review attempt tables must expose the same analytics shape.

### SvelteKit Boundaries

Routes compose page data, redirects, and form actions. Feature modules own domain queries, mutations, types, and components. Server-only code is enforced with `.server.ts` files or `$lib/server/**`.

## Product Scope

### 1. Public Discovery

Routes:

- `/`
- `/topics`
- `/topics/literary-devices`
- `/topics/literary-devices/preview`

Public pages include:

- available topic and learner level
- lesson count, quiz count, and estimated time
- short safe preview excerpt for the intro lesson
- devices covered by the topic
- signed-out calls to action that route to sign-in
- signed-in calls to action that route to `/app/literary-devices`

Protected data includes:

- full practice lessons unless explicitly marked preview-safe
- active quiz questions and answer keys
- persisted progress
- attempt history
- XP, streaks, daily goals, and review sessions

Implementation requirements:

- add a public discovery query that returns only safe metadata
- store preview-safe fields explicitly, including `public_summary`, `preview_markdown`, `level_label`, `estimated_minutes`, and `covered_skill_ids`
- update RLS so `anon` can read discovery metadata and published release metadata, but not protected practice bodies, answer keys, or user activity
- validate with an anon client test that protected practice rows are not readable

### 2. Literary Devices Expansion

Minimum path:

- intro lesson
- recognition quiz
- application lesson
- application quiz
- synthesis/application lesson
- mixed review quiz

Content requirements:

- at least 3 lessons
- at least 3 quizzes
- at least 45 reusable questions
- each initial literary device represented in more than one question
- recognition and application question types
- question metadata sufficient for skill review and weak-area summaries
- release notes that summarize added, revised, and retired content

Path requirements:

- path map supports `locked`, `active`, `available`, `completed`, and `review` states
- path state is computed from latest published path items plus learner activity
- historical attempts preserve exact content ids, versions, and release ids
- retired or unpublished questions remain visible in history but cannot be selected for new practice or review

### 3. XP, Streaks, And Daily Goals

Rules:

- award XP from completed lessons, completed quizzes, and completed review sessions
- store XP as append-only `xp_events`
- compute totals from events or a refreshable projection, not mutable counters alone
- count a streak day when the learner completes at least one meaningful activity
- support one daily goal setting for v2, such as 10 XP per day
- preserve XP and streak history when content releases change

Schema requirements:

- keep existing `xp_events`
- treat existing `streaks` as a projection, not the event ledger
- add `streak_events` for durable day-level streak facts
- add `daily_goal_settings`
- add `activity_events` as the common learner activity ledger

Mutation requirements:

- use database RPCs or equivalent server-side transaction functions for `complete_lesson`, `submit_quiz`, and `complete_review_session`
- each mutation writes the source activity, activity event, XP event, streak event/projection, and progress projection atomically
- make event writes idempotent with source keys, for example one lesson completion XP event per user/release/lesson version

Deferred:

- reward shops
- leagues
- friend comparisons
- complex XP economies

### 4. Adaptive Review

Route:

- `/app/literary-devices/review`

Initial review sources:

- questions answered incorrectly
- skills/devices with low accuracy
- questions not seen recently

Requirements:

- build review sessions server-side
- select only questions from the latest published release
- exclude unpublished and retired question versions
- store why each question was selected, such as `missed_question`, `low_skill_accuracy`, or `not_seen_recently`
- show a learner-facing reason such as "Practice symbolism" or "Review missed questions"
- store review answers in the same analytics path as quiz answers

Schema requirements:

- add `review_sessions`
- add `review_session_questions`
- generalize `quiz_attempts` to support `attempt_kind = 'quiz' | 'review'` with a nullable `review_session_id`, unless separate review attempt tables are explicitly chosen and mapped to the same analytics shape
- keep `quiz_attempt_answers` reusable if `attempt_kind` is generalized

### 5. Progress And History

Protected routes:

- `/app`
- `/app/progress`
- `/app/progress/history`

Progress shows:

- current path position
- completed lessons and quizzes
- latest score and best score per quiz
- XP earned today and all time
- current streak
- device-level accuracy
- recommended next action
- recent activity history

Rules:

- current progress is based on the latest published release
- history preserves the exact content ids, versions, and release ids from past activity
- recommendations are computed server-side from path state, review availability, daily goal progress, and recent activity
- clients do not directly write derived progress, XP, streaks, or review results

## SvelteKit Architecture

Use SvelteKit, TypeScript, Svelte 5 runes, server loads, form actions, and server-only modules.

Target structure:

```txt
apps/web/src/lib/
  features/
    literary-devices/
      components/
      types.ts
      index.ts
      server/
        content.server.ts
        progress.server.ts
        review.server.ts
        engagement.server.ts
        mutations.server.ts
  shared/
    components/
    utils/
  server/
    auth/
    db/
```

Rules:

- `routes/` owns route composition, redirects, page data, and form actions
- feature modules own domain queries, mutations, feature components, and client-safe types
- server-only feature code uses `.server.ts` or `$lib/server/**`
- never mix client-safe exports and server-only exports in the same barrel
- page data is fetched in `+page.server.ts` or `+layout.server.ts`, not `onMount`
- normal learner mutations use form actions; JSON endpoints are reserved for non-form APIs
- protected loads and actions call a shared `requireUser` helper instead of relying only on parent layout redirects
- components render UI and emit intent through callback props; they do not perform persistence or auth checks
- component state stays local with `$state`; derived view state uses `$derived`; `$effect` is only for real side effects
- app-shell daily progress can use layout data/context, but not module-scope user state

## Content Operations

V2 moves content operations from local-only confidence to a repeatable release workflow.

Required environments:

- local Supabase
- hosted staging Supabase
- hosted production Supabase

Release workflow:

1. Author or generate content artifacts locally.
2. Validate JSONL artifacts and manifest.
3. Import into staging with service-role credentials.
4. Run staging smoke tests and manual QA.
5. Commit or attach validation report, release notes, and QA checklist.
6. Import into production only after staging approval.
7. Verify production public discovery and protected app flows.

Importer requirements:

- support explicit target environment selection
- refuse production imports unless validation has passed
- produce a stable validation report
- validate multi-lesson and multi-quiz learning paths
- validate release item coverage for all path items and quiz questions
- validate question coverage per skill/device
- validate preview fields contain no answer keys or full protected content

Rollback requirements:

- document the database operation that removes a bad release from current serving, such as retiring the bad release or publishing a rollback release
- prove in staging that latest published content reverts while historical attempts still render
- keep old attempts, XP events, streak events, and activity history readable after rollback

## Milestones

### Milestone 0: Architecture Contracts

- split server content logic into feature server modules
- define `requireUser`
- define public discovery data contract and RLS policy changes
- define activity, XP, streak, daily goal, review, and progress projection contracts
- choose the review attempt modeling strategy

Exit criteria:

- anon client cannot read protected practice content or answer keys
- protected routes/actions enforce auth at their own server boundary
- planned mutations have clear transactional boundaries

### Milestone 1: Platform Readiness

- create hosted staging and production Supabase projects
- document environment variable setup
- verify migrations, RLS, auth callback URLs, and content import in staging
- add release QA and rollback docs
- update import scripts for staging/production release flow

Exit criteria:

- staging can be rebuilt from migrations plus imported content
- rollback procedure is tested at least once in staging

### Milestone 2: Public Discovery

- add public topic listing and Literary Devices landing pages
- add preview-safe metadata and excerpt content
- connect signed-out and signed-in calls to action
- test anon/public access boundaries

Exit criteria:

- signed-out users can inspect topic metadata and preview content
- signed-out users cannot fetch practice questions, answer keys, or protected learner state

### Milestone 3: Expanded Literary Devices Path

- add new lessons, quizzes, questions, and path items
- update import validation for multi-quiz paths and coverage rules
- update path map and progress calculations
- update UI for locked, active, available, completed, and review states

Exit criteria:

- signed-in users can complete the full multi-step path
- historical attempts preserve content ids, versions, and release ids

### Milestone 4: Engagement Loop

- add daily goal settings
- add streak events and streak projection updates
- make XP awards idempotent and event-based
- add app-shell daily progress strip
- update protected progress views

Exit criteria:

- XP, streak, and daily goal state survive refresh, logout, and content release changes
- repeated submissions do not duplicate awards

### Milestone 5: Review Mode

- add review session selection
- add review route and UI
- store review attempts and answers
- feed review outcomes into weak-skill progress

Exit criteria:

- review sessions are generated from real attempt history
- review never selects unpublished or retired questions
- progress recommends review when weak-skill criteria are met

## Verification

Run before merging v2 work:

```sh
corepack pnpm check
corepack pnpm lint
corepack pnpm build-storybook
```

Additional required verification:

- content validation report for the v2 Literary Devices release
- staging import and smoke test
- anon RLS test for public discovery boundaries
- authenticated protected-route smoke test
- transaction/idempotency test for lesson completion, quiz submission, XP awards, and streak updates
- review-selection test for missed, weak-skill, recent, retired, and unpublished question cases

## Deferred Beyond V2

- global leaderboards
- reward inventory, shop, or cosmetics
- anonymous persisted learning state
- broad many-subject catalog
- full automated AI generation at scale
- social features
- mobile app packaging
