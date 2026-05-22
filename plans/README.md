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
- **Cloudflare** for deployment.

See also:

- `auth.md`
- `content-architecture.md`
- `content-generation.md`
- `ui-ux-v1.md`

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

## Initial implementation focus

Start with one narrow end-to-end vertical slice: English Literary Devices.

The v1 MVP is deliberately small: a signed-in high-school learner can complete one Literary Devices quiz and see stored progress.

1. Ship authentication with Supabase magic links, protected app routes, and RLS policies for user-owned data.
2. Define the core content schema for subject areas, topic areas, skills, lessons, quizzes, questions, releases, attempts, and progress.
3. Create small hand-authored JSONL artifacts for the initial Literary Devices topic and commit them to Git for v1.
4. Include curriculum records in JSONL from day one: subject area, topic area, skills, lesson, quiz, questions, quiz-question relationships, and release metadata.
5. Import validated JSONL content into Supabase Postgres.
6. Store production lesson bodies, quiz bodies, question bodies, answers, and explanations in Postgres for runtime serving.
7. Publish the imported Literary Devices content through an explicit content release.
8. Build the authenticated app shell, one intro lesson, one mixed multiple-choice practice quiz, server-side attempt storage, and a minimal progress view.
9. Serve only the latest published content to users. Historical attempts should still store the exact content ids and versions seen.
10. Defer streaks, XP, rewards, leaderboards, broad public discovery, anonymous practice, and public previews until the quiz/progress loop works reliably.
11. Expand generation and publishing to more subjects once the Literary Devices pipeline is reliable.

See `ui-ux-v1.md` for the first user experience plan.
