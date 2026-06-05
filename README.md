# Clarifyst

Clarifyst is a free, interactive learning platform for self-guided study. It combines short lessons, structured quizzes, spaced review, progress tracking, XP, streaks, leaderboards, and AI-generated curriculum pipelines so learners can follow guided paths across many subjects.

- Live site: [clarifist.com](https://clarifist.com)
- Product app: `apps/web`
- Content generation system: `packages/content-pipeline`
- Demo/component workspace: `packages/ui` and `apps/demo`

## Problem and Insight

People need better ways to learn independently. Free resources are scattered, videos and articles are often passive, and chatbots can answer questions but usually do not organize a learner into a durable path with practice, review, and progress.

Existing learning tools cover different parts of the problem:

- Duolingo, Khan Academy, and Brilliant provide high-quality guided paths, but only for the subjects they have explicitly built.
- Quizlet and user-generated study tools cover more topics, but the quality varies and the format is usually limited to flashcards or quizzes.
- ChatGPT and other LLM chatbots can explain almost anything, but they do not naturally provide a coherent curriculum, reliable assessment loop, spaced repetition, or long-term motivation system.

Clarifyst is built around the idea that AI should do more than answer questions. It should help create better learning systems: structured pathways, interactive practice, review schedules, and high-quality learning content across many domains.

## What Clarifyst Does

The learner-facing app is designed for short, repeatable study sessions:

- Browse subjects and topics.
- Follow topic learning paths made of lessons, concept checks, and quizzes.
- Answer reliably gradable question types, including multiple choice, multi-select, ordering, math, short-answer-style structured prompts, and other schema-backed formats.
- Receive instant feedback after practice questions.
- Track lesson completion, quiz attempts, confidence, skill progress, XP, streaks, daily goals, achievements, and leaderboard progress.
- Use spaced repetition and review recommendations to revisit weak or aging material.

The current app supports authenticated learning flows: users can sign in, view available content, open lessons, complete learning paths, take quizzes, and persist progress.

## Technical Work

Clarifyst has two major systems: the web app where users learn, and the content generation/release system that creates and validates curriculum before it enters the app.

### Web App

The app is a SvelteKit application deployed to Cloudflare Workers. Supabase provides Auth, Postgres, Object Storage, and local/staging/production-style environments.

Implemented product areas include:

- SvelteKit app UI and route structure in `apps/web`
- Supabase Auth integration and protected app routes
- Supabase Postgres schema for content, releases, attempts, answers, mastery, spaced repetition, XP, streaks, rewards, achievements, leaderboards, and admin review
- server-side quiz grading and answer validation
- topic enrollment, lesson progress, quiz attempts, review scheduling, and daily plan logic
- gamified UI details including progress states, feedback, micro-interactions, confetti, and sound-oriented interaction design
- shared design tokens and reusable Svelte components in `packages/ui`
- Storybook workspace for developing and reviewing reusable UI components

### Content Generation Pipeline

The most technically substantial part of the project is the content pipeline in `packages/content-pipeline`.

The pipeline is a custom AI agent system built on the open-source Pi Agent SDK. An admin provides a topic brief and optional sources. The system then produces a structured learning path through a top-down process:

1. A modules agent breaks the topic into modules.
2. Syllabus agents define what each lesson and quiz should cover.
3. Lesson agents generate short instructional content.
4. Quiz and question agents generate structured practice.
5. Interaction agents create interactive lesson checks where appropriate.
6. Review agents check clarity, accuracy, structure, consistency, and learning value.
7. The bundler emits versioned JSONL artifacts and a manifest for validation, diffing, upload, and import.

Generated content does not write directly to the production database. It becomes a versioned content bundle, is validated against schemas, can be diffed against previous releases, uploaded to Supabase Object Storage, imported into a Supabase database, reviewed, and then published through release controls.

## Current Content

The repository includes multiple content runs under `curriculum-artifacts/runs`:

- English Literary Devices v1 and v2
- Mathematics: Linear Equations v1
- Exam Prep: California Driving Test v1

The current committed bundles include:

- 4 content manifests
- 13 JSON schemas for curriculum and release artifacts
- 32 Supabase migrations
- 24 test files across the app, content tools, and content pipeline
- 171 Git commits at the time this README was written

Example committed topic sizes:

- English Literary Devices v2: 3 lessons, 3 quizzes, 45 questions, 10 skills
- Mathematics Linear Equations v1: 3 lessons, 3 quizzes, 12 questions, 3 skills
- California Driving Test v1: 2 lessons, 2 quizzes, 8 questions, 4 skills

## Evaluation and Evidence

Clarifyst has not yet been evaluated with real learner usage because the project pivoted late from an earlier AI-writing direction into this learning-platform direction. The evidence so far is mostly technical, validation-oriented, and process-oriented.

Current evidence includes:

- strict JSON schema validation for generated curriculum artifacts
- repair loops when agent output does not match expected structure
- review-agent passes for clarity, accuracy, consistency, and learning value
- content diff reports before ingestion so changes can be inspected before publication
- local Supabase testing flow for migrations, imports, topic discovery, enrollment, lessons, quizzes, progress, and adaptive review
- cloud Supabase environment support for staging/production-style release operations
- server-side tests for quiz mapping, answer validation, content loading, issue reporting, review scheduling, achievements, profiles, recommendations, release controls, and content-pipeline behavior
- Storybook and shared UI packages for isolated component development
- visible development history through the Git commit log

This is not a substitute for a real user study. The next evaluation step should be to watch self-guided learners use the product, measure completion/drop-off across lessons and quizzes, compare generated content quality against hand-authored baselines, and collect expert review on topic accuracy.

## Iteration History

The project changed substantially over time.

The original direction was an AI writing improvement project, including exploration around fine-tuning. That direction proved hard to evaluate because writing quality is difficult to measure objectively and consistently. During that work, effective prompting and synthetic data experiments showed that LLMs could produce clear explanations for technical material when guided carefully.

That led to the current pivot: instead of using AI only to improve writing, Clarifyst uses agentic generation to create structured learning content. The app then turns that content into lessons, quizzes, review loops, and motivation systems.

Major iteration points included:

- moving from a writing-quality project to a self-guided learning platform
- shifting from one-off chatbot explanations to full learning paths
- adding schema-first content artifacts so AI output can be checked before import
- separating generation, validation, storage, ingestion, review, and publication
- expanding from a narrow hand-authored content slice to generated bundles for math and exam-prep topics
- improving the app from basic lesson/quiz flows into a richer gamified experience with XP, streaks, review, achievements, and leaderboards

## Limitations

Clarifyst is functional, but still early.

- The product has not launched to real users yet.
- There is no meaningful usage dataset or controlled learner outcome study.
- The pivot happened late, so evaluation is stronger on technical validation than on learning efficacy.
- AI-generated curriculum still requires validation and human review before publication.
- Current content coverage is small compared with the long-term goal.
- The content pipeline can produce structured bundles, but fully autonomous production publishing is intentionally out of scope.
- Personalization exists through progress and spaced repetition, but future work should generate extra practice from each learner's weak skills.

## Future Work

Near-term priorities:

- user-requested content generation so learners can ask for new learning paths
- stronger expert review workflows for generated topics
- more generated subjects and deeper topic coverage
- personalized review questions and explanations based on weak skills
- learner feedback collection, completion analytics, and content-quality scoring
- clearer public demo/video walkthrough for evaluators

## AI Usage, Sources, and Collaboration

This was a solo project.

AI was used extensively and intentionally:

- Codex and Cursor were used for code generation, debugging, refactoring, implementation planning, and documentation drafting.
- AI agents are part of the product's content generation pipeline.
- Curriculum generation uses AI to produce modules, syllabi, lessons, quizzes, interaction drafts, and review passes.
- Generated curriculum is treated as draft/release content, not as automatically trusted production content.

The repository was not forked from another project. The codebase was created for Clarifyst. The content pipeline uses the open-source Pi Agent SDK packages, and the app uses standard open-source framework and infrastructure dependencies including SvelteKit, Supabase, Cloudflare, Turborepo, PNPM, Zod, Vitest, Oxlint, and Storybook.

No external collaborators contributed code. Any future borrowed content, source documents, templates, generated media, or third-party datasets should be cited in the relevant content manifest and release notes.

## Repository Layout

```txt
apps/web                  SvelteKit product app
apps/demo                 demo app for package/component development
packages/content-pipeline AI-agent curriculum generation pipeline
packages/ui               shared Svelte component library and Storybook workspace
packages/tokens           design tokens exported as CSS custom properties
packages/config           shared Prettier, Oxlint, and Vite helpers
content-schemas           JSON schemas for importable curriculum artifacts
curriculum-artifacts      committed content runs, manifests, validation, and diff reports
content-sources           source briefs and topic inputs
supabase                  local Supabase config, migrations, and seeds
tools/content             content validation, diff, upload, download, import, and verification tools
plans                     planning documents and historical product architecture notes
```

## Running Locally

Use Node `26.2.0` from `.nvmrc` and PNPM `10.15.0` through Corepack.

```sh
nvm use
corepack pnpm install
```

Create local environment files from the examples:

```sh
cp .env.example .env.local
cp apps/web/.env.example apps/web/.env.local
```

Start or reset local Supabase:

```sh
corepack pnpm exec supabase start
corepack pnpm exec supabase db reset
```

Update the Supabase keys in the local env files using the values from `supabase status`, then import a content bundle:

```sh
corepack pnpm content:import:local
```

Run the app:

```sh
corepack pnpm dev
```

Common checks:

```sh
corepack pnpm check
corepack pnpm lint
corepack pnpm test
corepack pnpm build-storybook
```

## Content Commands

Validate and diff a generated run:

```sh
node tools/content/validate-run.mjs <path-to-manifest.json> --base none
node tools/content/diff-run.mjs <path-to-manifest.json> --base none
```

Generate a new topic with the content pipeline:

```sh
corepack pnpm --filter @learn-anything/content-pipeline content-pipeline generate <topic-dir>
```

Import a reviewed run:

```sh
node tools/content/import-run.mjs <path-to-manifest.json> --target local
```
