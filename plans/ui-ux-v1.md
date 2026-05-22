# UI/UX V1

The v1 product experience is a narrow, polished learning loop for English Literary Devices.

Goal: a signed-in high-school learner completes the intro lesson, unlocks one mixed practice quiz, receives immediate feedback after each question, and sees quiz-level plus device-level progress.

The v1 app should be implemented as a new SvelteKit app under `apps/web`. Reuse the existing `packages/ui` quiz components as the base, and use Bits UI primitives where appropriate for accessible controls, menus, dialogs, and other app UI building blocks.

## Product feel

The app shell should feel like a game map, not a generic study dashboard.

The v1 map can stay simple: one visible Literary Devices path with a lesson node followed by a quiz node. The important behavior is progression, completion state, and a sense of forward movement.

Tone:

- high-school friendly
- focused and readable
- lightly game-like
- polished, but not childish
- encouraging without excessive celebration

## V1 route map

Public:

- `/sign-in`
- `/auth/callback`

Protected:

- `/app`
- `/app/literary-devices`
- `/app/literary-devices/intro`
- `/app/literary-devices/quiz`
- `/app/literary-devices/quiz/results`
- `/app/progress`

For v1, `/app` can redirect to or prominently feature the Literary Devices map. Broad subject discovery can wait.

## App shell

The protected app shell should show:

- compact top navigation
- current topic name
- lightweight progress indicator
- account/logout access
- main game-map area

The first map should include:

- Intro Lesson node
- Mixed Practice Quiz node
- locked, active, completed, and current states

The quiz node is locked until the intro lesson is completed.

## Intro lesson

The intro lesson is required before the quiz.

The lesson should introduce the initial Literary Devices scope:

- metaphor
- simile
- personification
- imagery
- alliteration
- hyperbole
- irony
- symbolism
- foreshadowing
- onomatopoeia

Lesson completion should be an explicit action, such as a final "Continue" or "Mark complete" button. Completing the lesson unlocks the mixed quiz.

## Quiz flow

Use the existing quiz components in `packages/ui` as the base for the v1 quiz experience. The v1 app should adapt and compose those components before adding new quiz UI primitives.

The first mixed quiz has 15 multiple-choice questions.

Question mix:

- recognition questions: identify the literary device in a sentence or short example
- application questions: apply a device concept to a short passage, explanation, or use case

Interaction model:

- one question at a time
- visible question count, such as `4 / 15`
- user selects an answer
- user submits the current question
- app immediately grades the submitted answer
- explanation appears after grading
- user advances to the next question

There is no passing threshold in v1. Completion matters, not pass/fail status.

## Quiz results

The results page should show quiz-level progress:

- quiz completed state
- score
- correct count out of 15
- completion timestamp
- latest attempt score
- best attempt score, if available
- action to practice again
- action to return to the map

The results page should also show device-level breakdown:

- each literary device included in the quiz
- questions attempted for that device
- questions correct for that device
- simple accuracy indicator

If a device has too little data to be meaningful, still show the count plainly rather than hiding it.

## Progress view

The progress page should summarize the latest published Literary Devices content only.

For v1, progress should show:

- intro lesson completion state
- quiz completion state
- latest quiz score
- best quiz score
- total attempts
- device-level correctness across attempts

Users always follow the latest published content. Historical attempts should remain available for progress calculations and history, but the active progress view should be based on the latest published release.

## Empty, locked, and error states

Required v1 states:

- signed-out user redirected to sign-in
- quiz locked until intro lesson completion
- no previous attempts yet
- quiz attempt submission failure
- content missing or unpublished

Locked states should explain what action unlocks the next step. Error states should be concise and recoverable.

## Data and behavior requirements

Server-side quiz submission should:

- verify the user is authenticated
- verify the quiz is part of the latest published content
- verify submitted question ids belong to the quiz
- compute correctness server-side
- store the attempt
- store question-level answers
- update progress after completion

Client state can manage local selection and immediate UI transitions, but persisted attempts and progress should come from server-side validation.

## Deferred

Do not include these in v1:

- streaks
- XP
- rewards
- leaderboards
- broad subject discovery
- anonymous practice
- public lesson previews
- pass/fail quiz thresholds
- multiple learning paths
- spaced repetition
