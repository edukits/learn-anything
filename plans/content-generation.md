# Content Generation

Generate or hand-author curriculum content from source documents, write it as versioned JSONL artifacts, upload those artifacts to Supabase Object Storage, and publish only validated releases into the database.

This plan sits before and feeds into `content-architecture.md`.

## Goal

Support three common content operations:

1. **Create**: start from an empty database and create the first lessons, quizzes, questions, topics, skills, and media.
2. **Add**: introduce new source material and generate additional content without disturbing unrelated existing content.
3. **Revise**: improve or regenerate existing content when source material, prompts, schemas, or quality requirements change.

The first release should use small hand-authored JSONL artifacts for English Literary Devices. These artifacts can be committed to Git as a bootstrap exception. AI generation can be added after the import, validation, release, and practice loop works end to end.

Use the same JSONL artifact/import pattern for v1 that later generated content will use. Curriculum content should not be seeded directly through SQL migrations unless it is fixed system data.

Initial Literary Devices scope:

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

The first learning path should contain one intro lesson plus one mixed practice quiz covering the initial devices. The target learner is high school. The quiz should include both recognition questions and application questions.

## Source material

Generation starts from grounding documents.

Examples:

- literary devices and techniques notes
- math topic notes
- curriculum outlines
- worked examples
- style guides
- assessment rules

Grounding documents are internal inputs. They are not served directly to the client.

Store source material in a stable, reviewable location with metadata:

```txt
content-sources/
  english/
    literary-devices/
      source.md
      metadata.json
```

Metadata should include:

- source id
- subject/topic
- author or origin
- version
- date added
- notes for generation

## Content run

A content run is a reproducible attempt to create or update content. For the first release, the run may be hand-authored instead of AI-generated.

Inputs:

- grounding documents
- generation scripts
- prompt templates
- schemas
- model settings
- previous content, when revising

For hand-authored runs, prompt templates and model settings can be omitted or recorded as `null`.

Outputs:

- JSONL artifacts
- media artifacts, if generated
- manifest
- validation report
- quality review notes

Example output:

```txt
curriculum-artifacts/
  runs/
    run_2026_05_21_english_literary_devices_v1/
      topics.jsonl.zst
      skills.jsonl.zst
      lessons.jsonl.zst
      quizzes.jsonl.zst
      questions.jsonl.zst
      manifest.json
      validation-report.json
```

Each JSONL line is one content object.

## Content object rules

Every generated object should have:

- stable id
- version
- content type
- subject/topic/skill references
- source document references
- generation run id
- schema version
- created/updated timestamps

Existing content should not be overwritten in place. Regenerated content creates a new version.

Quiz questions should remain reusable and independent from quizzes. Quizzes reference questions through relationships, not by embedding the full question body.

The first release should use multiple-choice questions only. Future releases can add other question types already supported by the UI library.

Initial question records should include:

- literary device or skill
- question type, such as recognition or application
- difficulty
- prompt
- choices
- correct answer
- explanation
- source references

Production content bodies are imported into Postgres. Object Storage keeps the immutable JSONL artifacts and media files, but the app should not need to fetch JSONL artifacts at runtime to render published lessons or questions.

## Workflows

### 1. Create from empty state

1. Add initial grounding documents.
2. Create hand-authored JSONL artifacts or run generation scripts.
3. Produce JSONL artifacts for subject areas, topic areas, skills, lessons, quizzes, questions, quiz-question relationships, release metadata, and media references.
4. Validate schema, references, duplicates, and basic quality rules.
5. Bundle and compress artifacts.
6. Upload artifacts to Supabase Object Storage.
7. Write and commit the manifest, prompts, schemas, scripts, and validation report.
8. Import into staging database.
9. Review samples.
10. Publish a content release.

### 2. Add new content

1. Add new grounding documents or extend existing ones.
2. Run generation for the new subject/topic/skill scope.
3. Preserve stable ids and versions for unrelated existing content.
4. Validate the new artifacts and their references to existing content.
5. Upload the new run artifacts.
6. Update the manifest.
7. Import into staging.
8. Review, then publish a new content release.

### 3. Revise existing content

1. Identify the content scope to improve.
2. Update source documents, prompts, schemas, or generation scripts.
3. Run regeneration for only the affected scope when possible.
4. Create new versions for changed objects.
5. Keep unchanged objects and ids stable.
6. Validate diffs, references, and quality.
7. Upload the new run artifacts.
8. Update the manifest.
9. Import into staging.
10. Review changed samples.
11. Publish a new content release.

## Progress and content revisions

User progress should be durable even when curriculum content changes.

Keep:
- earned XP
- streak history
- quiz attempts
- lesson completions
- question responses where they are useful for history, analytics, or future restoration

Allow current curriculum to change:
- add new questions
- retire old questions
- replace a question with a new id
- create a new version of a corrected question
- merge or split smaller modules
- hide retired content from current practice

Progress views should be computed against the latest published release for the relevant scope. Users always follow the latest published content. Historical attempts should keep references to the exact content id and version the user saw.

If a module changes, it is acceptable for current module completion to be recalculated from the currently published content. Historical XP and streaks should not be removed just because curriculum content changed.

## Validation

Every run should validate:

- JSON schema correctness
- required fields
- stable ids and versions
- duplicate detection
- broken references
- quiz-to-question relationships
- source attribution
- media asset references
- age/level appropriateness
- spelling and formatting basics
- prompt/model metadata

Validation should fail the run if the content cannot be safely imported.

## Review

Use lightweight review before publishing:

- sample generated lessons
- sample quiz questions
- check answer keys and explanations
- check difficulty labels
- check topic/skill coverage
- inspect diffs for revised content

The first version can rely on manual review plus generated quality reports. More automated review can be added later.

## Publishing boundary

Generation is not publication.

Generated or hand-authored artifacts become available to users only after they are:

1. stored in the approved artifact location,
2. validated,
3. imported into staging,
4. reviewed,
5. attached to a content release,
6. published.

Production should serve only published content releases.

## Minimal first implementation

Start with:

- one source document folder
- hand-authored English Literary Devices JSONL artifacts
- one JSON schema per content type
- JSONL output for subject areas, topic areas, skills, lessons, quizzes, questions, quiz-question relationships, and release metadata
- one intro lesson
- one mixed multiple-choice practice quiz for high-school learners
- a manifest file
- a validation script
- manual upload/import steps
- one staging review pass

Then expand to generation scripts, topics, skills, media, partial regeneration, and richer quality checks.
