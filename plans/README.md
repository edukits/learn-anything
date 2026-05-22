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

1. Ship authentication with Supabase magic links.
2. Define the core content schema for subject areas, topic areas, skills, lessons, quizzes, questions, and releases.
3. Build the authenticated app shell and quiz/practice experience.
4. Add subject/topic landing pages for discovery.
5. Implement a minimal content generation and publishing flow for one initial subject.
6. Add progress tracking, streaks, XP, and basic rewards.
7. Expand generation and publishing to more subjects once the pipeline is reliable.
