# Plans: Overview

Learn Anything is a gamified learning platform: Duolingo-style practice for many subjects, not just languages. The core experience is short, interactive learning supported by quizzes, progress tracking, streaks, XP, leaderboards, rewards, and polished feedback animations.

## Product goal

Build a single scalable app where users can discover a subject, follow a learning path, read lesson material, practice with quizzes, and track progress over time.

Example subjects:

- languages: French, Italian, German
- mathematics: algebra, calculus, trigonometry
- English: literary devices, language techniques
- science: chemistry, physics, biology
- computer science: data structures, machine learning, statistics
- practical exams: California driving test, New South Wales driving test
- health, fitness, wellbeing, art, and creativity

## Architecture

Use a simple, scalable stack:

- **SvelteKit** for the application UI and interactive quiz experience.
- **Supabase Auth** for authentication.
- **Supabase Postgres** for runtime content indexes, relationships, releases, and user progress.
- **Supabase Object Storage** for generated content artifacts and media.
- **Cloudflare Pages** for deployment.

The product app lives under `apps/web`. The existing `apps/demo` app remains a demo/playground for package and component development.

See also:

- `auth.md`
- `content-architecture.md`
- `content-generation.md`
- `local-development.md`
- `release-operations.md`
- `ui-ux-v1.md`
- `v2-roadmap.md`

## Content hierarchy

The app should support a broad hierarchy without assuming every subject has the same shape.

```txt
subject_area
  e.g. mathematics, English, languages, science

topic_area
  e.g. calculus, literary devices, French, California driving test

skill
  e.g. basic derivatives, recognizing metaphor, road sign meanings

lesson
  Markdown or structured learning content

quiz
  a practice session or assessment

quiz_question
  reusable question object
```

Key rule: **quiz questions are independent reusable content**. Quizzes should reference questions instead of embedding them.

## Discovery and access

The platform is one unified site with multiple entry points:

- broad landing pages, such as Driving Tests or Mathematics
- subject/topic landing pages, such as California Driving Test or Literary Devices
- in-app learning paths, modules, lessons, and quizzes

Landing pages should help users understand what is available before signing in. The core app experience should require sign-in so progress, streaks, XP, and spaced repetition can be tracked.

In the future, some lesson/module previews may be public, but practice and progress tracking should remain authenticated.

## Content strategy

Most curriculum content will be generated and versioned outside the app, then published into the runtime database only after validation and review.

High-level flow:

1. Start from grounding/source documents.
2. Generate lessons, quizzes, questions, topics, skills, and media references.
3. Write versioned JSONL artifacts.
4. Upload artifacts and media to Supabase Object Storage.
5. Validate schemas, references, quality, and checksums.
6. Import approved content into staging Postgres.
7. Review samples and diffs.
8. Publish a content release.
9. Serve only published releases in production.

See `content-generation.md` and `content-architecture.md` for details.

## Scale principles

The project must be designed for a very large amount of content across many domains.

Principles:

- Keep generated bulk content out of Git.
- Store immutable artifacts and media in object storage.
- Store runtime indexes, relationships, release state, and user data in Postgres.
- Version generated content instead of overwriting it.
- Keep user progress separate from curriculum content.
- Design content relationships around reusable questions, skills, lessons, and learning paths.
- Publish content through explicit releases, not direct generation.

## Current baseline: v1 MVP

The v1 MVP is the narrow English Literary Devices vertical slice:

- SvelteKit product app at `apps/web`
- Supabase Auth with protected app routes
- Supabase Postgres schema for content releases, attempts, answers, lesson completions, and progress
- hand-authored English Literary Devices JSONL content artifacts
- schema validation and content import tooling
- one intro lesson, one mixed multiple-choice quiz, and a progress view
- server-side quiz grading and persisted attempt history

Keep `ui-ux-v1.md` as the historical product contract for this MVP.

## V2 focus

V2 should turn the v1 slice into the first real learning platform surface without jumping directly to a broad marketplace.

The v2 theme is: **discover, return, and improve**.

Priorities:

1. Add public discovery and preview pages so users can understand available learning paths before signing in.
2. Expand from one Literary Devices quiz to a small topic experience with multiple lessons, multiple quizzes, and richer progress.
3. Add the first durable engagement loop: XP, streaks, daily goals, and clearer completion state.
4. Add adaptive review from historical answers, starting with missed-question and weak-skill practice.
5. Harden content operations with hosted Supabase environments, release review, import repeatability, and rollback expectations.

Non-goals for v2:

- global leaderboards
- rewards economy or shop mechanics
- anonymous persisted progress
- many unrelated subjects at once
- full AI-generated curriculum at production scale
- collaborative/social learning

See `v2-roadmap.md` for the v2 plan.
