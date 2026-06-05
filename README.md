# Clarifyst

Clarifyst is a free learning website for self-study.

It gives learners short lessons, quizzes, review, XP, streaks, and leaderboards. It also has an AI content system that can create new learning paths from a topic brief.

- Live site: [clarifist.com](https://clarifist.com)
- Main app: `apps/web`
- Content system: `packages/content-pipeline`
- Shared UI: `packages/ui`

## Problem

People can find a lot of free learning material online. The hard part is knowing what to learn next, practising it, and remembering it later.

Chatbots are good for asking questions. They are less good at giving a full learning path with lessons, quizzes, review, and long-term study history.

Apps like Duolingo, Khan Academy, and Brilliant give better paths. But they only cover the topics their teams have already made.

Quizlet has more user-made content. But the quality varies, and the format is often limited.

Clarifyst tries to sit between these options. It uses AI to create structured learning paths, then puts them into a guided app.

## Core Idea

AI should do more than answer one question at a time.

It can help make a full learning system:

- short lessons
- concept checks
- quizzes with instant feedback
- review based on past answers
- visible study history
- motivation through XP, streaks, and achievements

## What Works Now

Users can sign in, browse topics, open lessons, and take quizzes.

The app stores quiz attempts, answers, lesson results, XP, streaks, and review data in Supabase.

Supabase is the database and auth service. Auth means sign-in. The database stores content and learner data.

Clarifyst currently includes learning content for:

- AI Literacy for Work and School
- California Driving Test
- Cybersecurity Essentials for Everyone
- Data Literacy and Charts
- Ethics of Artificial Intelligence
- Foundational Digital Skills for Work
- Linear Algebra
- Personal Finance Foundations
- Python for Beginners and Automation
- Reading Comprehension and Evidence
- Workplace English / ESL

This content workspace has about:

- 462 lessons
- 918 quizzes
- 8,289 questions
- 897 skills

## What I Built

This was a solo project.

I built the SvelteKit app UI, Supabase setup, quiz engine, spaced review, XP, streaks, achievements, and leaderboard logic.

I also spent a lot of time on the small app details. This includes quiz feedback, animations, sound-related design, confetti, and other game-like parts.

The largest technical part is the content system.

It uses AI agents to turn a topic brief into lessons, quizzes, questions, and review files. An agent is a program that asks an AI model to do one narrow job.

## Content System

The content system is in `packages/content-pipeline`.

It uses the open-source Pi Agent SDK. An admin gives it a topic brief and optional source files.

The system works in stages:

1. Break the topic into modules.
2. Write a syllabus for each module.
3. Write lessons.
4. Write quizzes and questions.
5. Add interactive checks where useful.
6. Review the output for clarity, accuracy, and learning value.
7. Save the result as JSONL files and a manifest.

JSONL means one JSON object per line. A manifest is a file that lists the content files in a run.

The content system does not write straight to the live database. It creates files first.

Those files are checked, compared with earlier versions, uploaded to Supabase Storage, and then imported into Supabase Postgres.

## Evidence

Clarifyst does not yet have real user data. The project changed direction late, so the current evidence is mostly technical.

Current evidence includes:

- 13 completed generated runs in `~/LearnAnythingContent`
- 4 smaller content manifests in this repo
- 13 JSON schemas for content files
- 32 Supabase migrations
- 24 test files
- 171 Git commits when this README was updated
- schema checks for generated content
- AI repair loops when generated files have the wrong shape
- review agents that check generated lessons and quizzes
- content diff reports before database import
- local Supabase testing for sign-in, lessons, quizzes, review, and learner data
- tests for quiz logic, answer checks, content loading, review scheduling, achievements, profiles, and release controls

A schema is a set of rules for what a file must contain. The schema checks help catch broken AI output before it reaches the app.

## Iteration

The project started as an AI writing project. I explored fine-tuning and ways to make AI better at writing.

That was hard to judge. Writing quality is subjective, and it was difficult to measure well.

During that work, I found that careful prompts could make AI explain technical topics clearly. That led to the current version of Clarifyst.

The project changed from improving writing to making learning paths.

Important changes included:

- moving from writing feedback to guided learning
- moving from chatbot answers to full study paths
- adding strict file formats for AI content
- adding checks before content reaches the database
- adding generated math and exam-prep topics
- adding XP, streaks, review, achievements, and leaderboards

## Limits

Clarifyst is working, but it is early.

- It has not launched to real users yet.
- There is no user study or learning outcome data yet.
- The content set is still small.
- AI-made content still needs review before use.
- The app has review based on past answers, but it does not yet create extra practice for each learner's weak skills.
- The content system can make structured files, but live publishing still needs human approval.

## AI Use and Credits

AI was used throughout the project.

Codex and Cursor were used for coding, debugging, refactoring, planning, and README writing.

AI is also part of the product. The content system uses AI agents to make modules, syllabi, lessons, quizzes, questions, and review notes.

The repo was not forked from another project. No external person contributed code.

Clarifyst uses open-source tools and services, including SvelteKit, Supabase, Cloudflare, Turborepo, PNPM, Zod, Vitest, Oxlint, Storybook, and the Pi Agent SDK.

## Repo Layout

```txt
apps/web                  SvelteKit app
apps/demo                 demo app
packages/content-pipeline AI content system
packages/ui               shared Svelte components
packages/tokens           design tokens
packages/config           shared config
content-schemas           JSON schemas
curriculum-artifacts      content runs and reports
content-sources           topic briefs and source notes
supabase                  database config, migrations, and seeds
tools/content             content check and import scripts
plans                     planning notes
```

## Run Locally

Use Node `26.2.0` from `.nvmrc` and PNPM `10.15.0` through Corepack.

```sh
nvm use
corepack pnpm install
```

Create local env files:

```sh
cp .env.example .env.local
cp apps/web/.env.example apps/web/.env.local
```

Start Supabase:

```sh
corepack pnpm exec supabase start
corepack pnpm exec supabase db reset
```

Copy the local Supabase keys from `supabase status` into the env files.

Import content and run the app:

```sh
corepack pnpm content:import:local
corepack pnpm dev
```

Checks:

```sh
corepack pnpm check
corepack pnpm lint
corepack pnpm test
corepack pnpm build-storybook
```
