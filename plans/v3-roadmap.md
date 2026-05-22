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

- `/app/subjects`
- `/app/topics/[topic]`
- `/app/topics/[topic]/diagnostic`
- `/app/topics/[topic]/practice`
- `/app/topics/[topic]/review`

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

Implementation notes:

- use a simple, inspectable scheduling algorithm first
- keep algorithm inputs and outputs in event rows so scheduling can be recomputed or audited
- do not require machine learning to ship v3 personalization

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

V3 should retire feature code that assumes Literary Devices is the only topic.

Target direction:

```txt
apps/web/src/lib/
  features/
    catalog/
    learning-path/
    practice/
    recommendations/
    engagement/
    social/
    content-admin/
  server/
    auth/
    content/
    progress/
    recommendations/
    engagement/
    analytics/
```

Rules:

- topic-specific code is allowed only for genuinely custom rendering or domain helpers
- generic learning path, practice, review, diagnostics, XP, streaks, rewards, and recommendations live in reusable feature modules
- all learner mutations remain server-side and transactional
- client components receive typed data and emit intent; they do not fetch protected data directly
- content publication state is the only source of truth for what can appear in current practice
- derived projections must be recomputable from durable events

## Milestones

### Milestone 0: V2 Stabilization Gate

- confirm v2 public discovery, XP, streaks, review, staging, production, and rollback flows are stable
- audit hard-coded Literary Devices assumptions
- define generic topic enrollment, mastery, recommendation, and spaced-repetition contracts
- decide the first two non-Literary-Devices topics

Exit criteria:

- v2 smoke tests pass in production
- each v3 schema change has an event/projection strategy
- the v3 topic list has source material and clear learner outcomes

### Milestone 1: Generic Topic Platform

- add data-driven subject and topic catalog routes
- introduce topic enrollment and active-topic state
- generalize path map, progress, history, review, and app shell routing
- migrate Literary Devices onto the generic topic surface

Exit criteria:

- Literary Devices still works through generic topic routes
- adding a new published topic does not require a new hard-coded route tree

### Milestone 2: Content Factory And First New Topic

- add generation/review workflow for one new topic
- add validation for new question types and media assets
- import the candidate topic into staging
- review and publish the first non-English topic

Exit criteria:

- the new topic can be discovered publicly and completed in the app
- release diff, validation report, and rollback procedure exist for the topic

### Milestone 3: Diagnostics, Mastery, And Spaced Review

- add diagnostic attempts and placement outcomes
- add skill mastery events and projections
- add spaced-repetition scheduling
- upgrade recommendations into a daily plan

Exit criteria:

- a new learner receives a topic-specific starting recommendation
- review sessions can be generated from due scheduling, not only missed answers
- mastery summaries update from diagnostics, quizzes, drills, and reviews

### Milestone 4: Rich Practice And Second New Topic

- ship multiple select, numeric answer, sequencing, and controlled short-answer grading
- publish a second new topic that requires at least one non-multiple-choice interaction
- expand Storybook and verification coverage for all production question types

Exit criteria:

- practice analytics are normalized across all shipped question types
- the second new topic proves the platform supports a different learning shape

### Milestone 5: Rewards And Leagues

- add achievements and reward inventory
- add public profile fields and privacy controls
- add weekly league cohorts and topic leaderboards
- add anti-duplication and opt-out rules

Exit criteria:

- learners can earn durable achievements from real activity
- opted-in learners can compare weekly XP without exposing private data
- leaderboard results are derived from event history and can be recomputed

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
- staging import, smoke test, release publish, and rollback test for each new topic
- recommendation tests for new learner, returning learner, due review, weak skill, completed daily goal, and skipped recommendation cases
- accessibility tests for every production question type
- Storybook coverage for question states, grading states, reward states, leaderboard states, and empty/error states

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
