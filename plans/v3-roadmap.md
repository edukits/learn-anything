# V3 Roadmap

V3 moves Learn Anything from a polished single-topic learning app into the first version of the broad platform described in the product vision: many subjects, personalized practice, durable motivation, and a repeatable content pipeline.

Theme: **expand, personalize, and compete**.

## Objective

V3 is complete when a learner can discover multiple subject areas, choose a topic, take a short diagnostic or start from the beginning, follow a personalized daily plan, review skills through spaced repetition, earn rewards, and compare progress with a small peer group or leaderboard.

The implementation must provide these platform capabilities:

- multiple subject and topic areas can be published without hard-coded route or feature assumptions
- learning paths can support different content shapes, including skill drills, lessons, quizzes, diagnostics, and cumulative reviews
- recommendations are driven by learner history, mastery estimates, due review items, daily goal state, and path position
- content operations can generate, validate, diff, review, stage, publish, and roll back new topics repeatably
- engagement systems remain append-friendly, auditable, and resistant to duplicate awards
- social and leaderboard data exposes only intended public profile fields

## Product Scope

### 1. Multi-Subject Catalog

V3 should prove that Learn Anything is not only an English Literary Devices app.

Minimum catalog:

- English: Literary Devices, expanded from v2
- one math topic, such as Algebra Foundations or Trigonometry Basics
- one exam-style topic, such as California Driving Test

Public discovery routes:

- `/subjects`
- `/subjects/[subject]`
- `/topics/[topic]`
- `/topics/[topic]/preview`

Protected app routes:

- `/app/topics/[topic]`
- `/app/topics/[topic]/lesson/[lessonId]`
- `/app/topics/[topic]/quiz/[quizId]`
- `/app/topics/[topic]/quiz/results`
- `/app/topics/[topic]/review`
- `/app/topics/[topic]/diagnostic`
- `/app/progress`
- `/app/progress/history`
- `/app/daily-plan`
- `/app/leaderboard`
- `/app/achievements`

Route structure:

```txt
routes/
  +layout.svelte
  +page.server.ts                         # public landing
  subjects/+page.svelte                   # public catalog
  subjects/[subject]/+page.svelte         # public subject detail
  topics/[slug]/+page.svelte              # public topic detail
  topics/[slug]/preview/+page.svelte
  app/
    +layout.server.ts                     # requireUser + engagement summary
    +layout.svelte                        # app shell with topic switcher
    +page.server.ts                       # redirect to active topic or catalog
    topics/[topic]/
      +layout.server.ts                   # load topic enrollment + content
      +page.svelte                        # path map / hub
      lesson/[lessonId]/+page.svelte
      quiz/[quizId]/+page.svelte
      quiz/results/+page.svelte
      review/+page.svelte
      diagnostic/+page.svelte
    progress/+page.svelte
    progress/history/+page.svelte
    daily-plan/+page.svelte
    leaderboard/+page.svelte
    achievements/+page.svelte
```

The `+layout.server.ts` at `app/topics/[topic]/` loads topic enrollment and verifies the topic exists. Child routes should not re-validate the topic. During migration, redirect `/app/literary-devices/*` to `/app/topics/literary-devices/*` and remove the old routes only after verification.

Requirements:

- topic pages are data-driven from published content metadata
- subject/topic slugs, nav labels, level labels, estimated time, and preview content come from content tables
- the app shell supports switching active topics without losing current progress
- each topic has a clear next action: start, continue, diagnostic, review, or daily plan
- public pages expose only preview-safe metadata and excerpts

### 2. Personalized Learning Plan

V2 recommends the next action for one topic. V3 should generalize this into a daily learning plan across active topics.

The daily plan should include:

- one primary next path item
- due spaced-repetition reviews
- weak-skill practice
- daily goal progress
- optional stretch activity when the daily goal is met

Requirements:

- recommendations are computed server-side
- recommendations include an explainable reason, such as `continue_path`, `due_review`, `weak_skill`, `new_topic`, or `daily_goal_stretch`
- learners can dismiss or skip a recommendation without corrupting mastery state
- recommendation decisions are logged for later analytics
- the plan works when a learner has one active topic or several active topics

Priority stack:

The daily plan is computed as a server-side pure function that returns an ordered list of recommendation items, each with a `reason`, `topicId`, `targetUrl`, and `priority`. The priority order is:

1. Due SR reviews (overdue items first, then items due today)
2. Continue active path (next unlocked path item in each enrolled topic)
3. Weak skill drill (skills below mastery threshold with available questions)
4. New topic suggestion (only if enrolled topics are mostly complete)
5. Stretch activity (only after daily goal is met)

The recommendation function must be testable independently of routes. Cover these cases with unit tests: new learner, returning learner, due review, weak skill, completed daily goal, skipped recommendation, and multi-topic with mixed states.

Schema candidates:

- `user_topic_enrollments`
- `user_skill_mastery`
- `practice_queue_items`
- `recommendation_events`
- `recommendation_dismissals`

### 3. Diagnostics And Placement

Each v3 topic should support either a diagnostic or a deliberate "start from the beginning" path.

Diagnostic behavior:

- short adaptive or fixed assessment before a learner starts a topic
- estimates initial skill mastery
- unlocks or marks some early path items as optional when mastery is strong
- recommends a starting point without hiding the full path

Requirements:

- diagnostic attempts use the same attempt and answer analytics shape as quizzes and review sessions
- diagnostic questions are tagged separately from normal practice questions
- placement outcomes are stored as events and projected into topic progress
- learners can retake diagnostics only under controlled rules, such as after a cooldown or content release change

### 4. Spaced Repetition And Mastery

V2 review uses missed questions and weak skills. V3 should add a durable spaced-repetition system that can serve any topic.

Requirements:

- schedule reviews at the skill/question level
- update scheduling after quiz, review, diagnostic, and drill answers
- support at least `new`, `learning`, `review`, and `mastered` states
- select only latest published, review-eligible content for new review sessions
- preserve historical scheduling records when content is retired
- expose mastery summaries by topic, skill, and subject

Schema candidates:

- `spaced_repetition_items`
- `spaced_repetition_reviews`
- `user_skill_mastery_events`
- `user_skill_mastery`

Algorithm contract:

Use a simplified SM-2 variant as the initial scheduling algorithm. Store both the current projection and every review event so scheduling is auditable and recomputable.

Projection shape:

- `user_id`, `question_id`, `question_version`, `topic_id`, `skill_id`
- `state`: `new`, `learning`, `review`, `mastered`
- `ease_factor`: float, initialized at 2.5
- `interval`: integer days
- `due_at`: timestamp
- `review_count`, `lapse_count`
- `last_reviewed_at`: nullable timestamp

Review event shape:

- `item_id`, `user_id`
- `grade`: `again`, `hard`, `good`, `easy`
- `reviewed_at`: timestamp
- `response_time_ms`: integer
- `previous_state`, `new_state`
- `previous_interval`, `new_interval`
- `previous_ease`, `new_ease`
- `source`: `quiz`, `review`, `diagnostic`, `drill`

Implementation notes:

- use the simplified SM-2 variant described above; do not require machine learning to ship v3 personalization
- keep algorithm inputs and outputs in event rows so scheduling can be recomputed or audited
- the algorithm is a pure function from current item state + grade to new item state; keep it testable in isolation
- define the SR contract before beginning Milestone 3

### 5. Richer Practice Types

V3 should use the existing UI component breadth to move beyond multiple choice where the subject calls for it.

Question types to support in production:

- multiple choice
- multiple select
- numeric answer
- sequencing
- short answer with deterministic or reviewed grading only

Requirements:

- each question type has a schema, importer validation, renderer, server-side grading path, and Storybook case
- grading is deterministic for launch-critical flows
- short answer may launch with exact-match, normalized-match, or manual-review style grading; do not rely on unreviewed AI grading for XP-critical correctness
- analytics normalize outcomes across question types
- accessibility and keyboard behavior are verified for each interaction type

### 6. Rewards, Achievements, And Leagues

V2 adds XP and streaks. V3 should introduce the first durable motivation layer.

Rewards:

- achievements for meaningful milestones
- cosmetic profile badges or titles
- lightweight inventory for earned rewards

Leagues and leaderboards:

- weekly XP leaderboard for opted-in learners
- topic-specific leaderboard for comparable activity
- small league cohorts rather than one global board
- clear reset cadence and anti-duplication rules

Requirements:

- rewards are awarded from append-only events
- repeated submissions cannot farm duplicate rewards
- leaderboard entries derive from XP events within a time window
- learners can opt out of public leaderboards
- public leaderboard identity uses display name/avatar fields approved for sharing, not private account data

Schema candidates:

- `achievement_definitions`
- `achievement_events`
- `reward_inventory`
- `leaderboard_periods`
- `leaderboard_entries`
- `league_memberships`
- `public_profiles`

### 7. Content Factory

V3 should turn content generation from a pilot into an internal production workflow for adding topics.

Workflow:

1. Add reviewed source documents.
2. Generate draft lessons, questions, quizzes, diagnostics, and media references.
3. Validate schemas, references, answer keys, difficulty, coverage, and public preview safety.
4. Produce content diffs against the latest published release.
5. Run automated quality checks and human review sampling.
6. Import into staging.
7. Run topic smoke tests and sample learner flows.
8. Publish to production through explicit release approval.

Requirements:

- support scoped regeneration for one subject, topic, skill, lesson, quiz, or question set
- produce reviewer-facing diffs for added, changed, retired, and replaced content
- track source coverage so every published item can be traced to grounding material
- support media assets by `asset_id`, including diagrams for math or exam-style topics
- reject production publishing when validation, staging import, or required review checks fail

Content diff tooling:

Add a `diff-run.mjs` tool alongside the existing `validate-run.mjs` and `import-run.mjs`. It should take two manifest paths (current published and candidate), produce a structured diff report (added IDs, changed IDs with field-level deltas, retired IDs, replaced IDs with old-to-new mapping), and output both machine-readable JSON and human-readable markdown. The validation pipeline should include the diff summary in the validation report. This tool is a required deliverable for Milestone 2.

Admin/review surface:

- internal content release dashboard
- candidate release summary
- validation report viewer
- content sample review queue
- approve, reject, publish, and rollback controls

### 8. Analytics And Quality Signals

V3 needs enough analytics to improve both content and product loops.

Metrics:

- activation by topic
- diagnostic completion
- lesson completion
- quiz completion and score distribution
- review due/completed ratio
- retention by streak and daily plan use
- question difficulty and discrimination signals
- skill mastery movement
- content issue reports
- leaderboard participation and opt-out rate

Requirements:

- emit product events from server-side mutations where possible
- distinguish content ids, versions, release ids, and topic scope
- make dashboards useful for content QA, not just growth metrics
- avoid logging answer keys or unnecessary private data into analytics sinks

## Platform Architecture

V3 should retire feature code that assumes Literary Devices is the only topic. The current `features/literary-devices/` module contains content loading, progress, engagement, review, mutations, route data, and components for a single topic. V3 must split this into generic capability modules and a thin topic-renderer escape hatch.

### Feature Module Structure

Use a two-layer strategy: generic feature modules own data contracts, server modules, and default UI. Topic renderers own only genuinely topic-specific rendering, such as math notation or diagram display. A topic that needs no custom rendering ships with zero files in `topic-renderers/`.

```txt
apps/web/src/lib/
  features/
    catalog/                # topic discovery, enrollment, topic switching
      components/
      types.ts
      index.ts
      server/
        catalog.server.ts   # listSubjects, listTopics, getTopicBySlug
        enrollment.server.ts # enrollInTopic, getEnrollments, getActiveTopic
    learning/               # path, lessons, practice, diagnostics (generic)
      components/
      types.ts
      index.ts
      server/
        content.server.ts   # getPublishedContent, getLessonVersion, getQuizVersion
        path.server.ts      # getPathState, computePathPosition
        diagnostic.server.ts
        mutations.server.ts # completeLesson, submitQuiz (generic, takes topicId)
    review/                 # spaced repetition, review sessions (generic)
      components/
      types.ts
      index.ts
      server/
        scheduling.server.ts # SR item queries, due items
        sessions.server.ts   # createReviewSession, completeReviewSession
    recommendations/        # daily plan, recommendation engine
      types.ts
      index.ts
      server/
        daily-plan.server.ts
        recommendation-events.server.ts
    engagement/             # XP, streaks, goals, achievements (generic)
      components/
      types.ts
      index.ts
      server/
        xp.server.ts
        streaks.server.ts
        achievements.server.ts
    social/                 # profiles, leaderboards, leagues
      components/
      types.ts
      index.ts
      server/
        leaderboard.server.ts
        profiles.server.ts
    content-admin/          # admin review/publish UI
      components/
      server/
    topic-renderers/        # topic-specific rendering overrides ONLY
      literary-devices/
      algebra/
  shared/
    components/
    utils/
    types/
  server/
    auth/
    db/
    content/                # cross-feature content release queries
    analytics/
```

### Server Module Contracts

Every server module function that touches topic-scoped data takes `topicId` (or `topicSlug`) as a parameter. No module-level topic constant. The canonical server implementation lives in `$lib/server/**` or feature `server/` folders with `.server.ts` filenames. Feature modules in `lib/features/` may re-export subsets for route convenience.

### State Management Rules

- Active topic is derived from the `[topic]` route parameter, not stored in client state. The layout load at `app/topics/[topic]/+layout.server.ts` resolves it.
- Topic enrollment list comes from the app layout load. Pass it to the shell via page data, not a global store.
- Daily progress and engagement come from the app layout load. Use Svelte context for subtree sharing when needed.
- Never put user-specific or request-specific state in module scope on the server. Use `event.locals`, cookies, persisted sessions, the database, or route data instead.
- Components render UI and emit intent through callback props. They do not perform persistence, auth checks, or direct data fetching.
- Component state stays local with `$state`. Derived view state uses `$derived`. Use `$effect` only for real side effects.

### Content Renderer Strategy

Generic topic pages use a renderer registry to handle topic-specific content variations without hard-coding. The registry returns a topic-specific component when one exists, otherwise the route uses a default renderer. Topic renderers receive typed data as props and must not contain data loading, auth, or mutations.

### Rules

- topic-specific code is allowed only for genuinely custom rendering or domain helpers in `topic-renderers/`
- generic learning path, practice, review, diagnostics, XP, streaks, rewards, and recommendations live in reusable feature modules
- all learner mutations remain server-side and transactional
- client components receive typed data and emit intent; they do not fetch protected data directly
- content publication state is the only source of truth for what can appear in current practice
- derived projections must be recomputable from durable events

## Milestones

### Milestone 0: V2 Stabilization Gate

- confirm v2 public discovery, XP, streaks, review, staging, production, and rollback flows are stable
- audit hard-coded Literary Devices assumptions: enumerate every instance of `LITERARY_DEVICES_TOPIC_ID`, hard-coded `literary-devices` string references, and topic-specific server module calls
- list server modules that need generic `topicId` parameters and define the migration for each
- define generic topic enrollment, mastery, recommendation, and spaced-repetition contracts (types and server function signatures)
- define the schema migration plan for new v3 tables: enrollment, mastery, SR, achievements, leaderboards
- decide the first two non-Literary-Devices topics with source material and clear learner outcomes

Exit criteria:

- v2 smoke tests pass in production
- hard-coded topic audit is complete with a concrete remediation list
- each v3 schema change has an event/projection strategy
- server module contracts are defined with `topicId` parameters
- the v3 topic list has source material and clear learner outcomes

### Milestone 1a: Generic Route And Module Structure

- create the `app/topics/[topic]/` dynamic route tree
- create generic feature module skeletons: `catalog/`, `learning/`, `review/`, `recommendations/`, `engagement/`
- add `user_topic_enrollments` table and enrollment server module
- add topic switcher to the app shell layout
- add public catalog routes (`/subjects`, `/subjects/[subject]`)
- add redirects from `/app/literary-devices/*` to `/app/topics/literary-devices/*`

Exit criteria:

- the dynamic route structure exists and resolves topic enrollment
- the enrollment table and server module are functional
- old Literary Devices URLs redirect to new generic URLs

### Milestone 1b: Literary Devices Migration

- migrate all Literary Devices server logic from `features/literary-devices/server/` into generic feature modules with `topicId` parameters
- move any genuinely topic-specific rendering into `features/topic-renderers/literary-devices/`
- remove the old `features/literary-devices/` module and the hard-coded `/app/literary-devices/` route tree
- verify all learner flows: path map, lessons, quizzes, review, progress, engagement

Exit criteria:

- Literary Devices works through the generic topic routes with no hard-coded topic references in generic modules
- adding a new published topic requires no new route files
- all existing v2 learner flows pass through the generic surface

### Milestone 2: Content Factory And First New Topic

Depends on: Milestone 1b.

- add `diff-run.mjs` content diff tooling
- add generation/review workflow for one new topic
- add validation for new question types and media assets
- import the candidate topic into staging
- review and publish the first non-English topic

Exit criteria:

- the new topic can be discovered publicly and completed in the app
- release diff, validation report, and rollback procedure exist for the topic
- diff tooling produces structured reports for added, changed, retired, and replaced content

### Milestone 3: Diagnostics, Mastery, And Spaced Review

Depends on: Milestone 1b. Independent of Milestone 2; can be parallelized.

- add diagnostic attempts and placement outcomes
- add skill mastery events and projections
- implement the SM-2 variant scheduling algorithm as a pure, testable function
- add `spaced_repetition_items` and `spaced_repetition_reviews` tables
- implement the recommendation priority function with unit tests for each case
- upgrade recommendations into a daily plan route

Exit criteria:

- the SR algorithm contract is implemented and tested in isolation
- a new learner receives a topic-specific starting recommendation
- review sessions can be generated from due scheduling, not only missed answers
- mastery summaries update from diagnostics, quizzes, drills, and reviews
- the recommendation priority function has unit tests for: new learner, returning learner, due review, weak skill, completed daily goal, skipped recommendation, and multi-topic states

### Milestone 4: Rich Practice And Second New Topic

Depends on: Milestone 2 (content factory needed for new question type content).

- ship multiple select, numeric answer, sequencing, and controlled short-answer grading
- publish a second new topic that requires at least one non-multiple-choice interaction
- expand Storybook and verification coverage for all production question types

Exit criteria:

- practice analytics are normalized across all shipped question types
- the second new topic proves the platform supports a different learning shape

### Milestone 5: Rewards And Leagues

Depends on: Milestone 1b.

- add achievements and reward inventory
- define public profile fields: `display_name`, `avatar_url`, `title`, `bio`. These are the only fields exposed on leaderboards.
- add opt-in flow for public leaderboard participation
- add weekly league cohorts and topic leaderboards
- add anti-duplication and opt-out rules

Exit criteria:

- learners can earn durable achievements from real activity
- opted-in learners can compare weekly XP without exposing private data
- leaderboard results are derived from event history and can be recomputed
- public profile fields are explicitly defined and enforced by RLS

### Milestone 6: Analytics And Admin Hardening

- add content quality dashboards
- add issue-reporting from lessons and questions
- add admin review queues for generated candidate content
- add release approval and rollback controls
- document operational playbooks for content and engagement incidents

Exit criteria:

- content reviewers can approve or reject candidate releases without direct database access
- product and content quality metrics are visible by subject, topic, release, and question type

## Verification

Run before merging v3 platform work:

```sh
corepack pnpm check
corepack pnpm lint
corepack pnpm build-storybook
```

Additional required verification:

- anon RLS tests for catalog and preview boundaries
- authenticated RLS tests for progress, recommendations, rewards, public profiles, and leaderboard opt-out
- transaction/idempotency tests for diagnostics, practice submissions, review scheduling, XP, achievements, and leaderboard scoring
- content validation reports for each v3 topic release
- content diff reports for each candidate release against the current published release
- staging import, smoke test, release publish, and rollback test for each new topic
- SR algorithm unit tests for all grade outcomes and state transitions
- recommendation priority function unit tests for each case listed in the daily plan contract
- enrollment lifecycle tests: enroll, pause, un-enroll, re-enroll with progress preservation
- topic switching tests: verify active topic state is always route-derived, not cached
- error state tests: topic not found, enrollment required, content not published, mutation failure
- accessibility tests for every production question type
- Storybook coverage for question states, grading states, reward states, leaderboard states, empty states, error states, and loading states

## Database Migration Strategy

All v3 schema changes must be additive-only migrations. Do not drop or rename columns in use. When a table shape changes, add a new migration that introduces new columns or tables alongside existing ones. If a column is no longer needed, mark it deprecated in a comment but do not remove it until the next major version.

Sequence new migrations after the existing v2 migrations. Each milestone should produce its own migration file so changes can be reviewed and rolled back per milestone.

For tables with user data, new columns must have defaults or be nullable. Backfill scripts should be separate from schema migrations and idempotent.

## Topic Enrollment Lifecycle

- Enrollment creates a `user_topic_enrollments` row with status `active`.
- A learner may pause enrollment (status `paused`), which hides the topic from the daily plan and app shell but preserves all progress.
- A learner may un-enroll (status `inactive`). Progress data is preserved in the database. The topic no longer appears in the daily plan, shell, or leaderboards. The learner can re-enroll at any time, which restores status to `active` and picks up existing progress.
- Enrollment status changes are logged as events for analytics.
- Re-enrollment does not reset progress, XP, streaks, or mastery state.

## Error And Loading States

Define standard error contracts for the platform:

- **Topic not found:** 404 page. The `app/topics/[topic]/+layout.server.ts` returns a SvelteKit error if the topic slug does not resolve.
- **Enrollment required:** redirect to the topic detail page with a prompt to enroll. Do not show a blank page.
- **Content not published:** if a topic exists but has no published release, show a "coming soon" state with the topic metadata.
- **SR computation failure:** log the error and fall back to the non-SR recommendation path. Never block the daily plan on a scheduling error.
- **Mutation failure:** form actions return typed error data. Components display contextual error messages. Do not swallow server errors silently.
- **Loading states:** use SvelteKit's built-in loading for route transitions. Topic switching within the app shell should show a skeleton or spinner scoped to the content area, not the full page.

## Performance Budget

- Load only the active topic's data in the `app/topics/[topic]/+layout.server.ts`. Do not preload all enrolled topics' content or progress.
- The app layout load provides the enrollment list and engagement summary (lightweight). Per-topic content and progress are loaded only in the topic layout.
- Use `invalidate` with specific keys after mutations. Avoid `invalidateAll` except for auth state changes.
- Keep route data shapes flat and serializable. Avoid deeply nested objects in page data.
- Use `$state.raw` for large read-only data from server loads (content bodies, question lists) to avoid proxy overhead.
- Audit and lazy-load heavy dependencies: `mathlive`, `katex`, `canvas-confetti`, `@shopify/draggable`. These should not be in the critical path for topics that do not use them.

## Testing Strategy

Use Vitest for unit and integration tests. Use Playwright for E2E. Place tests next to the code they test.

```txt
lib/features/catalog/server/catalog.server.test.ts
lib/features/learning/server/mutations.server.test.ts
lib/features/review/server/scheduling.server.test.ts
lib/features/recommendations/server/daily-plan.server.test.ts
routes/app/topics/[topic]/+page.server.test.ts
tests/e2e/
  enrollment.spec.ts
  quiz-flow.spec.ts
  review-flow.spec.ts
  leaderboard.spec.ts
```

Priority:

- Unit test pure functions first: SR algorithm, recommendation priority, content diff, quiz grading
- Integration test server modules that touch Supabase: enrollment, mutations, SR scheduling
- E2E test critical learner flows: enroll, lesson, quiz, review, progress, topic switch
- Component tests only where UI state logic is complex enough to justify them

## Deferred Beyond V3

- native mobile app packaging
- parent/teacher classroom management
- marketplace or third-party creator publishing
- unrestricted user-generated courses
- real-money rewards or purchases
- fully autonomous AI publication without human review
- collaborative multiplayer lessons
- high-stakes certification or proctored exams
- live tutoring or chat-based instruction as a core dependency
