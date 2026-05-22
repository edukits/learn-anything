# Content Architecture

Use Git for code/manifests, Supabase Object Storage for bulk artifacts, and Postgres for the published runtime index. Designed for scale.

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
- release manifests
- quality reports

Git should not store actual content.

The manifest committed to Git points to the generated artifacts in Supabase Object Storage.

## Database role

Supabase/Postgres stores the runtime index and published content state, not necessarily every raw generation artifact.

Core tables:

```
subject_areas
topic_areas
skills
quizzes
lessons
quiz_questions
quiz_question_versions
quiz_question_to_quiz
media_assets
media_asset_versions
content_runs
content_releases
content_release_bundles
```

User data stays separate:
```
user_progress
quiz_attempts
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
  versioned published curriculum snapshot

content_bundle
  large importable group of related content
```

Important: quiz questions should be independent from quizzes.

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

## Publishing flow

1. Generate content locally or on a batch machine.
2. Write compressed JSONL artifacts.
3. Upload artifacts to Supabase Object Storage.
4. Generate manifest.
5. Commit manifest, schema, prompt, and validation report to Git.
6. CI validates checksums and schemas.
7. CI imports artifacts into staging Postgres.
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
  source code, schemas, prompts, manifests, validation reports

Postgres:
  searchable runtime index
  content relationships
  release state
  user progress and attempts
```