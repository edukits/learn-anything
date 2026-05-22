# V2 Roadmap

V2 prepares Learn Anything to move from a single validated MVP path into a small, repeatable learning platform. It should build directly on the v1 Literary Devices loop instead of replacing it.

Theme: **discover, return, and improve**.

## Goals

V2 should prove that the platform can support:

- public topic discovery before sign-in
- multiple lessons and quizzes inside one topic
- durable learner motivation through XP, streaks, and daily goals
- progress views that explain what the learner should do next
- focused review from missed questions and weaker skills
- repeatable content releases across local, staging, and production

V2 is successful when a learner can discover Literary Devices publicly, sign in, move through a multi-step path, return on another day with streak/XP state intact, review weak devices, and see progress that reflects more than one quiz attempt.

## Product Scope

### 1. Public Discovery

Add public pages that explain what is available without exposing the full practice experience.

Routes:

- `/`
- `/topics`
- `/topics/literary-devices`
- `/topics/literary-devices/preview`

Requirements:

- show available topic, learner level, lesson count, quiz count, and estimated time
- include a short preview of the intro lesson
- show the devices covered by the topic
- route signed-out practice actions to sign-in
- route signed-in learners to the app path

Practice, persisted progress, attempt history, XP, and streaks remain protected.

### 2. Literary Devices Expansion

Expand Literary Devices from one lesson and one quiz into a fuller topic path.

Minimum path:

- intro lesson
- recognition quiz
- application lesson
- application quiz
- mixed review quiz

Content requirements:

- at least 3 lessons
- at least 3 quizzes
- at least 45 reusable questions
- each initial literary device represented in more than one question
- question metadata sufficient for skill review and weak-area summaries

The path map should support locked, active, available, completed, and review states across more than two nodes.

### 3. XP, Streaks, and Daily Goals

Add the first engagement loop.

Rules:

- award XP from completed lessons, completed quizzes, and review sessions
- store XP as append-only `xp_events`
- compute current XP totals from events, not from mutable counters alone
- count a streak day when the learner completes at least one meaningful activity
- allow one daily goal setting for v2, such as 10 XP per day
- preserve streak and XP history when content releases change

V2 should avoid complex economies, reward shops, leagues, and friend comparisons.

### 4. Adaptive Review

Add a review mode generated from user history.

Initial review sources:

- questions answered incorrectly
- skills/devices with low accuracy
- questions not seen recently

Route:

- `/app/literary-devices/review`

Requirements:

- build review sessions server-side
- do not include unpublished or retired questions
- store review attempts using the same attempt/answer model where practical
- show why the review was selected, such as "Practice symbolism" or "Review missed questions"

Full spaced repetition scheduling can remain simple in v2. The important outcome is a credible weak-skill review loop.

### 5. Progress and History

Upgrade progress from a minimal summary into a learner-facing dashboard.

Protected routes:

- `/app`
- `/app/progress`
- `/app/progress/history`

Progress should show:

- current path position
- completed lessons and quizzes
- latest score and best score per quiz
- XP earned today and all time
- current streak
- device-level accuracy
- recommended next action
- recent activity history

The progress view should be based on the latest published release, while history should preserve the exact content ids and versions from past attempts.

## Content Operations

V2 should move from local-only confidence to a repeatable release workflow.

Required:

- hosted Supabase staging project
- hosted Supabase production project
- documented environment variable setup
- content import against staging before production
- validation report committed or attached for each release
- manual QA checklist for lesson samples, quiz samples, answer keys, and release diffs
- rollback procedure for bad content releases

Generated content can be piloted in v2, but production content should only ship after the same validation, import, review, and publish boundary used by hand-authored content.

## Data Model Additions

Likely v2 additions:

```txt
xp_events
streak_events
daily_goal_settings
review_sessions
review_session_questions
activity_events
```

Existing tables should remain the source of truth for quiz attempts, question-level answers, lesson completions, and published content versions.

Data rules:

- keep user activity separate from curriculum content
- make XP and streak records append-friendly
- store release ids and content versions on user-visible history
- server-side code computes awards, streak events, and review selections
- clients do not directly write derived progress, XP, streaks, or review session results

## UI/UX Requirements

The app should still feel like a game map, but v2 needs better orientation and return behavior.

Key surfaces:

- public topic landing page
- expanded protected path map
- daily progress strip in the app shell
- review entry point
- progress dashboard
- activity history

Design requirements:

- keep the app useful on mobile
- make the next action obvious
- show locked states with clear unlock requirements
- keep celebrations short and tied to completed actions
- avoid overwhelming the learner with all metrics at once

## Milestones

### Milestone 1: Platform Readiness

- create hosted staging and production Supabase projects
- document env setup
- verify migrations, RLS, auth callback URLs, and content import in staging
- add release QA and rollback docs

### Milestone 2: Public Discovery

- add public topic listing and Literary Devices landing pages
- add preview content
- connect signed-out and signed-in calls to action

### Milestone 3: Expanded Literary Devices Path

- add new lessons, quizzes, questions, and path items
- update import validation for multi-quiz paths
- update path map and progress calculations

### Milestone 4: Engagement Loop

- add XP events
- add streak events
- add daily goal setting and app-shell display
- update protected progress views

### Milestone 5: Review Mode

- add review session selection
- add review route and UI
- store review attempts and update weak-skill progress

## Acceptance Criteria

V2 is ready when:

- a signed-out user can discover Literary Devices and preview what they will learn
- a signed-in user can complete a multi-step Literary Devices path
- XP and streak state survive refreshes, logout, and content release changes
- review sessions are generated from real attempt history
- progress recommends a next action based on current state
- staging import and release review happen before production publication
- rollback from a bad content release is documented and tested at least once in staging

## Deferred Beyond V2

- global leaderboards
- reward inventory, shop, or cosmetics
- anonymous persisted learning state
- broad many-subject catalog
- full automated AI generation at scale
- social features
- mobile app packaging
