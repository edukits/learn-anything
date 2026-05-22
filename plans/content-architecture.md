# Content Architecture

Use Git for code/manifests, Supabase Object Storage for bulk artifacts, and Postgres for published production content plus runtime indexes. Designed for scale.

## Bulk quiz content artifacts

Quiz content is written as compressed JSONL shards:

```
curriculum-artifacts/
  runs/
    run_2026_05_21_math_trig_v12/
      questions/
        part-00000.jsonl.zst
        part-00001.jsonl.zst
        part-00002.jsonl.zst
      quizzes/
        quizzes.jsonl.zst
      lessons/
        lessons.jsonl.zst
      manifest.json
```

Each JSONL line is one content object.

## Images and media

Store images, diagrams, audio, video, and generated media in Supabase Object Storage as immutable files:

```
curriculum-media/
  published/
    mathematics/trigonometry/unit-circle-diagram/v1/original.png
    mathematics/trigonometry/unit-circle-diagram/v1/inline.webp
    mathematics/trigonometry/unit-circle-diagram/v1/thumbnail.webp
```

Content should reference media by asset_id, not by raw URL.

Published media should not be overwritten. New versions get new paths.

## Git's role

Git should store:
- generation code
- prompt templates
- schemas
- validators
- import scripts
- small sample fixtures
- small v1 hand-authored Literary Devices JSONL artifacts
- release manifests
- quality reports

Git should not store generated bulk content. The first Literary Devices release is small enough that its hand-authored JSONL artifacts may be committed to Git as a bootstrap exception.

For normal generated runs, the manifest committed to Git points to the generated artifacts in Supabase Object Storage. For the first small hand-authored Literary Devices release, the manifest may point to JSONL artifacts committed in Git.

## Database role

Supabase/Postgres stores the published runtime content, indexes, relationships, release state, and user data.

Production lesson bodies, quiz bodies, question bodies, answer keys, explanations, and structured lesson/quiz blocks should be served from Postgres. Supabase Object Storage remains the archive for bulk import artifacts, source run outputs, immutable release files, and media files.

Core tables:

```
subject_areas
subject_area_versions
topic_areas
topic_area_versions
skills
skill_versions
quizzes
quiz_versions
lessons
lesson_versions
quiz_questions
quiz_question_versions
quiz_question_to_quiz
learning_paths
learning_path_versions
learning_path_items
media_assets
media_asset_versions
content_runs
content_releases
content_release_bundles
content_release_items
```

User data stays separate:
```
user_progress
quiz_attempts
quiz_attempt_answers
lesson_completions
streaks
xp_events
spaced_repetition_state
```

## Content model

Suggested content types (for now):
```
subject_area
  e.g. mathematics, english, computer science

topic_area
  e.g. trigonometry, literary devices, data structures

skill
  e.g. basic trig identities, recognizing metaphors, stack operations

lesson
  learning content, probably Markdown + structured interactive blocks

quiz
  a curated or generated collection of quiz questions

quiz_question
  reusable question object

media_asset
  image, diagram, audio, video, animation

learning_path
  ordered path through topics, lessons, quizzes, and skills

content_release
  publication event that makes scoped content versions available

content_bundle
  large importable group of related content
```

Important: quiz questions should be independent from quizzes.

For the first Literary Devices release, quiz questions should be multiple choice only. The UI library can support additional question types later, but the first content/import path should not need to handle them.

Use a join table:
```
quiz_question_to_quiz
  quiz_id
  quiz_version
  question_id
  question_version
  ordering
  weight
```

## Versioning

Generated content should be append-versioned instead of overwritten in place.

Versioned content types:
- subject_area
- topic_area
- skill
- lesson
- quiz
- quiz_question
- media_asset
- learning_path

Stable umbrella objects like English or Mathematics should rarely be removed. Smaller objects such as lessons, quizzes, modules, and individual questions can be revised, retired, replaced, or merged.

When a content object changes materially, create a new version. When a question is replaced with a different question, create a new question id rather than reusing the old id. When a typo or metadata error is corrected without changing meaning, use a new version on the same stable id.

Retired content should generally remain in the database so old attempts, XP events, streak calculations, and historical progress can still be understood. It should be hidden from current practice unless it is republished.

## Release model

A `content_release` is a publication event, not necessarily a snapshot of the entire app.

Use scoped release bundles so the platform can publish or roll back Literary Devices without republishing unrelated subjects like Mathematics. A release can contain one or more bundles, and each bundle has a scope such as:

- subject area
- topic area
- learning path
- specific content bundle

`content_release_items` should record the exact content ids and versions included in the release. Production queries should serve only content versions attached to the currently published release state for that scope.

This gives the app flexibility to:
- publish the first English Literary Devices slice independently
- revise individual questions without disturbing unrelated topics
- keep user progress history tied to the version the user actually saw
- roll back a bad content bundle while keeping other subjects live

## Publishing flow

1. Generate or hand-author content locally.
2. Write JSONL artifacts.
3. Upload artifacts to Supabase Object Storage for normal release runs, or keep the first small hand-authored Literary Devices artifacts in Git.
4. Generate manifest.
5. Commit manifest, schema, prompt, and validation report to Git.
6. CI validates checksums and schemas.
7. CI or a controlled import script imports artifacts into staging Postgres.
8. QA samples content.
9. Publish a content_release.
10. Production app serves only published release content.

## Main rule

Use this split:
```
Supabase Object Storage:
  bulk generated content artifacts
  images and media
  immutable release files

Git:
  source code, schemas, prompts, manifests, validation reports, small bootstrap fixtures

Postgres:
  published production content
  searchable runtime index
  content relationships
  release state
  user progress and attempts
```
