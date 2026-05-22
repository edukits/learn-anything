# V4 Roadmap

V4 moves Learn Anything from the first broad platform shape into a scalable learning system: a larger catalog, deeper adaptive planning, stronger practice modes, trustworthy assisted learning, and small-group learning loops.

Theme: **scale, guide, and prove**.

## Objective

V4 is complete when a learner can search a meaningful multi-subject catalog, choose a concrete learning goal, receive a multi-week adaptive plan, practice with richer interactive formats, get grounded help when stuck, and optionally learn inside a small cohort or class without sacrificing privacy or content quality.

The implementation must provide these platform capabilities:

- the catalog can grow from a few topics to a curated network of subjects, topics, skills, prerequisites, and collections
- recommendations can optimize for explicit learner goals, deadlines, time budget, mastery, due review, and prerequisite gaps
- practice can support multi-step tasks, hints, worked examples, simulations, and rubric-backed answers where appropriate
- assisted learning is grounded in published content, auditable, and separated from XP-critical grading
- cohorts and lightweight assignments work without turning the product into a full LMS
- content quality improves from learner outcomes, reviewer signals, and item analytics
- privacy, accessibility, and safety rules are enforced before scaling social or assisted features

## Product Scope

### 1. Catalog Scale And Topic Graph

V3 proves multiple topics. V4 should make the catalog feel navigable and coherent.

Target catalog:

- 5 to 7 subject areas with public landing pages
- 20 to 30 published topics across those subjects
- at least 3 topic collections, such as "Algebra Foundations", "High School English", or "Driving Test Prep"
- prerequisite links for topics where order matters
- related-topic links for discovery and next-step recommendations

Discovery routes:

- `/subjects`
- `/subjects/[subject]`
- `/collections`
- `/collections/[collection]`
- `/topics/[topic]`
- `/search`

Protected routes:

- `/app/library`
- `/app/goals`
- `/app/goals/[goalId]`
- `/app/search`

Requirements:

- catalog search supports subject, topic, skill, level, estimated time, and goal tags
- topic prerequisites are data-driven and can be used by placement, recommendations, and public discovery
- public pages make clear what a learner can do next: preview, enroll, add to goal, or continue
- collections can be curated manually without duplicating topic content
- topic graph data is versioned separately from user progress
- retired topics remain readable for history but do not appear in default discovery

Schema candidates:

- `topic_collections`
- `topic_collection_items`
- `topic_prerequisites`
- `topic_relationships`
- `learning_goals`
- `learning_goal_topics`
- `catalog_search_documents`

### 2. Goal-Based Adaptive Plans

V3 has a daily plan. V4 should add explicit learner goals that produce multi-week plans.

Goal examples:

- "Pass the California driving test in 3 weeks"
- "Review Algebra Foundations for 15 minutes per day"
- "Improve literary analysis before an exam"
- "Explore beginner statistics with no deadline"

Plan inputs:

- learner-selected goal
- target date or no deadline
- daily time budget
- placement and diagnostics
- current mastery and spaced repetition queue
- prerequisite gaps
- topic enrollment state
- recent activity and skipped recommendations

Plan outputs:

- weekly target
- daily plan
- prerequisite remediation items
- review load estimate
- confidence/status indicator, such as `on_track`, `at_risk`, or `behind`
- explanation for each recommended item

Requirements:

- planning is computed server-side from durable data
- the planner is a pure, testable function over a normalized learner state
- learners can adjust time budget, deadline, and active topics without losing progress
- skipped items and missed days reflow the plan instead of corrupting mastery state
- the system does not promise exam readiness from weak evidence; confidence labels must be conservative

Schema candidates:

- `user_learning_goals`
- `user_goal_topics`
- `goal_plan_snapshots`
- `goal_plan_events`
- `goal_plan_dismissals`
- `planner_experiments`

### 3. Rich Practice, Hints, And Simulations

V3 expands production question types. V4 should make practice better suited to each domain.

Practice modes:

- multi-step problem solving
- worked-example study
- hint ladder before final answer
- matching and classification
- cloze/fill-in-the-blank
- diagram labeling
- graph or coordinate interaction for math
- passage-based reading questions
- timed exam simulation
- writing or short response with rubric-backed feedback

Requirements:

- every new interaction type has a schema, renderer, server-side validation, analytics contract, and Storybook case
- XP-critical correctness is deterministic or human-reviewed; assisted feedback can be advisory
- hint usage is logged and affects mastery confidence where appropriate
- worked examples are first-class content items, not ad hoc lesson text
- simulations can draw from published question pools while preserving attempt history
- accessibility, keyboard use, and mobile layout are verified for each interaction type

Schema candidates:

- `worked_examples`
- `worked_example_versions`
- `practice_interactions`
- `practice_interaction_versions`
- `hint_sets`
- `hint_versions`
- `simulation_templates`
- `simulation_attempts`

### 4. Grounded Learning Coach

V4 may introduce a learning coach, but it must be bounded. The coach should help learners understand published content and their own mistakes; it should not become an unreviewed content publisher or grading authority.

Coach capabilities:

- explain why an answer was wrong after submission
- provide a next hint during practice
- restate a lesson concept using the current topic's published source material
- suggest a review item based on mastery state
- answer "what should I do next?" from the goal plan

Non-capabilities:

- no autonomous publishing
- no final grading for XP-critical attempts unless a deterministic verifier accepts the answer
- no exposure of answer keys before submission
- no private data from other learners
- no claims of guaranteed exam readiness

Requirements:

- responses are grounded in published lessons, explanations, source references, and learner-owned progress
- prompt inputs and outputs are logged with content ids, versions, and safety metadata
- answer-key access is restricted by interaction state
- coach output includes a machine-readable intent, such as `hint`, `explanation`, `next_action`, or `concept_review`
- unsafe, ungrounded, or low-confidence responses fail closed to static help
- the product remains usable without coach availability

Schema candidates:

- `coach_sessions`
- `coach_messages`
- `coach_grounding_refs`
- `coach_feedback_events`
- `coach_safety_events`

### 5. Cohorts, Assignments, And Accountability

V3 adds opt-in leaderboards. V4 should support small groups that create accountability without exposing unnecessary learner data.

Initial cohort types:

- friend study group
- teacher-created class
- parent or mentor supervised learner group
- goal-based cohort, such as "Driving test in June"

Capabilities:

- join by invite code
- cohort activity feed with limited public fields
- assignment of topics, lessons, quizzes, reviews, or goals
- due dates and completion summaries
- cohort leaderboard scoped to opted-in members
- mentor view of assigned progress only

Requirements:

- learners can leave a voluntary cohort
- minors and supervised learners require stricter visibility defaults
- public profile fields are reused from v3; private auth data is never exposed
- teacher/mentor views show progress summaries, not raw answers by default
- assignments do not alter the underlying content release or mastery algorithm
- cohort membership, assignments, and visibility changes are evented and auditable

Schema candidates:

- `cohorts`
- `cohort_memberships`
- `cohort_invites`
- `cohort_assignments`
- `cohort_assignment_progress`
- `cohort_activity_events`
- `guardian_links`

### 6. Content Quality And Operations At Scale

V3 creates the content factory. V4 should make it measurable and scalable.

Quality signals:

- question accuracy distribution
- item discrimination
- answer choice distractor performance
- hint usage
- explanation helpfulness
- issue reports by content id and version
- reviewer rejection reasons
- content freshness and source coverage
- prerequisite coverage gaps

Operational surfaces:

- content quality dashboard
- source coverage dashboard
- item analytics by release
- reviewer work queue with sampling rules
- issue triage queue
- release risk summary
- bulk retire, replace, and patch workflow

Requirements:

- item analytics never log unnecessary private data
- quality dashboards distinguish content id, content version, release id, topic, subject, and interaction type
- low-quality items can be removed from future practice without breaking history
- reviewer decisions are stored as events
- content generation can be scoped by prerequisite gap, weak item cluster, or collection need
- production publishing still requires explicit approval

Schema candidates:

- `content_issue_reports`
- `content_review_tasks`
- `content_review_events`
- `content_quality_metrics`
- `content_source_coverage`
- `content_generation_requests`

### 7. Onboarding, Retention, And Personalization Controls

V4 should help learners get to a useful plan quickly and control how much personalization they want.

Requirements:

- onboarding captures goal, experience level, deadline, daily time budget, and preferred reminder cadence
- learners can choose a low-pressure mode that hides competitive surfaces
- learners can pause goals, cohorts, reminders, and leaderboards independently
- notification preferences are explicit and revocable
- the daily plan explains why each item appears and how to change it
- progress summaries highlight mastery, consistency, and next action rather than only XP

Schema candidates:

- `user_onboarding_events`
- `user_preferences`
- `notification_preferences`
- `personalization_settings`
- `goal_pause_events`

### 8. Trust, Privacy, Safety, And Accessibility

V4 adds more social and assisted surfaces, so trust work must be part of the roadmap rather than cleanup.

Requirements:

- privacy review for coach, cohort, assignment, leaderboard, and notification data
- export and deletion path for learner-owned activity data where legally required
- block, report, and moderation path for cohort activity
- stricter defaults for minors and supervised learner accounts
- accessibility audit for catalog, plans, practice, coach, and cohort flows
- content safety checks for public previews, generated explanations, and coach responses
- RLS tests for every new social, coach, and mentor-visible table

## Platform Architecture

V4 should keep the v3 split between generic features and topic renderers. New capability modules should stay data-driven and reusable across subjects.

Suggested module additions:

```txt
apps/web/src/lib/
  features/
    search/
      server/
        catalog-index.server.ts
        search.server.ts
    goals/
      components/
      server/
        goals.server.ts
        planner.server.ts
        planner-events.server.ts
    coach/
      components/
      server/
        grounding.server.ts
        coach.server.ts
        safety.server.ts
    cohorts/
      components/
      server/
        cohorts.server.ts
        assignments.server.ts
        visibility.server.ts
    content-quality/
      components/
      server/
        metrics.server.ts
        review-queue.server.ts
        issue-reports.server.ts
    simulations/
      components/
      server/
        simulation.server.ts
        scoring.server.ts
```

Rules:

- goal planning, coach grounding, cohort visibility, and simulation scoring live in server modules
- generated coach output is never trusted directly for persistence decisions
- topic-specific rendering remains in `topic-renderers/`; planning and analytics remain generic
- search indexes are projections and can be rebuilt from published content tables
- cohort and mentor access always flows through explicit membership and visibility checks
- every recommendation, coach response, assignment, reward, and notification should be explainable from stored events

## Milestones

### Milestone 0: V3 Readiness Gate

- confirm v3 dynamic topic routes, enrollment, daily plan, SR, rewards, leaderboards, and content factory are stable
- audit v3 feature modules for assumptions that would block catalog scale, topic graph traversal, or goal planning
- define v4 privacy rules for coach, cohorts, mentor views, and notifications
- define the first scaled catalog targets and source availability
- define the goal planner contract and normalized learner state shape
- define whether the first coach release is enabled globally, per topic, or behind an experiment flag

Exit criteria:

- v3 smoke tests pass for all published topics
- v3 content operations can publish, roll back, and diff a topic without direct database edits
- v4 schema candidates have event/projection boundaries
- privacy and RLS requirements are written before implementation starts

### Milestone 1: Catalog Graph And Search

- add topic collections, prerequisites, and related-topic links
- build catalog search projection and `/search`
- add `/collections` and collection detail pages
- add `/app/library` for enrolled, paused, completed, and recommended topics
- publish enough catalog content to validate browsing across at least 5 subject areas

Exit criteria:

- learners can search and browse by subject, topic, collection, level, and goal tag
- prerequisite and related-topic links appear in public discovery and app recommendations
- search index can be rebuilt from published content state

### Milestone 2: Goal Plans

- add onboarding for goal, level, deadline, and daily time budget
- add goal CRUD and active goal selection
- implement goal planner as a pure function with unit tests
- add `/app/goals` and `/app/goals/[goalId]`
- integrate daily plan with goal plan snapshots

Exit criteria:

- a learner can create, adjust, pause, and resume a goal
- missed days and skipped items reflow future recommendations
- goal confidence labels are explainable and conservative
- planner tests cover new learner, returning learner, deadline pressure, prerequisite gap, missed day, due review overload, and low-pressure mode

### Milestone 3: Rich Practice And Simulations

- add worked examples and hint sets as versioned content
- ship at least two new interaction types beyond v3
- add timed simulation support for one exam-style topic
- add hint analytics and interaction-level outcome normalization
- expand Storybook for all new states

Exit criteria:

- at least one math or exam topic uses multi-step or simulation practice in production
- hint usage affects mastery confidence without directly awarding correctness
- simulation attempts preserve exact content ids, versions, timing, and scoring rules

### Milestone 4: Grounded Coach

- build coach grounding over published content, explanations, source references, and learner-owned progress
- add coach UI for post-answer explanations and hint requests
- add safety fallback for ungrounded or low-confidence responses
- log coach sessions, grounding refs, and feedback events
- gate the feature per topic until quality is proven

Exit criteria:

- coach responses are traceable to content ids and versions
- answer keys are not exposed before submission
- XP-critical grading does not depend on unverified coach output
- the product handles coach provider failure gracefully

### Milestone 5: Cohorts And Assignments

- add cohort creation and invite codes
- add membership roles and visibility rules
- add assignment creation for topics, lessons, quizzes, reviews, and goals
- add cohort progress summaries and scoped leaderboard
- add leave, remove, and report flows

Exit criteria:

- a learner can join a cohort, complete an assignment, and see limited peer activity
- a mentor can see assignment progress without raw private answer history by default
- RLS tests prove non-members cannot read cohort data

### Milestone 6: Content Quality Operations

- add issue reporting from lessons, questions, simulations, and coach responses
- add item analytics dashboards by content version and release
- add reviewer queues and evented review decisions
- add bulk retire/replace workflow for low-quality items
- add release risk summaries based on validation, diffs, analytics, and review status

Exit criteria:

- content reviewers can identify weak items and retire them from future practice without breaking history
- release approval includes quality signals, not only schema validation
- source coverage and prerequisite coverage are visible by collection and topic

### Milestone 7: Privacy, Accessibility, And Launch Hardening

- complete RLS coverage for goal, coach, cohort, assignment, notification, and quality tables
- audit public discovery, coach, cohort, and mentor surfaces for private data leaks
- run accessibility checks across core v4 flows
- add notification preference handling if reminders are enabled
- document operations for coach incidents, content quality incidents, cohort reports, and data export/deletion

Exit criteria:

- all v4 social and assisted surfaces have explicit privacy tests
- core flows meet accessibility expectations on desktop and mobile
- incident playbooks exist for the new v4 risk areas

## Verification

Run before merging v4 platform work:

```sh
corepack pnpm check
corepack pnpm lint
corepack pnpm build-storybook
```

Additional required verification:

- search projection rebuild tests
- catalog public/anon boundary tests
- topic graph cycle detection and prerequisite traversal tests
- goal planner unit tests for all listed cases
- goal adjustment and pause/resume integration tests
- simulation scoring and attempt history tests
- hint usage analytics tests
- coach grounding, answer-key boundary, and provider-failure tests
- cohort membership, assignment visibility, and mentor view RLS tests
- content quality dashboard query tests
- issue-reporting and reviewer-event idempotency tests
- accessibility tests for new interaction types, coach UI, goals, and cohort flows
- content validation, diff, staging import, publish, and rollback reports for every v4 topic release

## Database Migration Strategy

All v4 schema changes should remain additive. Do not drop or rename v3 tables in use. Add new tables for goal planning, coach logs, cohorts, search projections, content quality metrics, and simulations.

For derived data such as search documents, goal plan snapshots, content quality metrics, and leaderboard/cohort summaries, store enough source events to rebuild projections.

For coach and social data, migrations must include RLS policies in the same milestone as the table creation. No table containing learner messages, cohort membership, assignment progress, or mentor visibility should be merged without corresponding access tests.

## Performance Budget

- public catalog and search pages use indexed projections, not large content body scans
- goal planning loads normalized learner state for active goals only
- coach grounding retrieves a bounded set of published content refs
- cohort feeds paginate and avoid loading full assignment histories by default
- simulations load only the active attempt and required question content
- analytics dashboards aggregate through materialized or cached projections where needed
- large interaction dependencies remain lazy-loaded by topic and question type

## Deferred Beyond V4

- native mobile app packaging
- third-party creator marketplace
- unrestricted user-generated courses
- fully autonomous AI publication without human review
- high-stakes certification or proctored exams
- real-money rewards, purchases, or paid reward economies
- live multiplayer lessons as a core product dependency
- full LMS replacement features such as gradebook exports, school rostering standards, and district administration
- open-ended chat tutoring as the primary learning path
