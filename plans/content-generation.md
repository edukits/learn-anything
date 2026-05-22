# Content Generation

Generate curriculum content from source documents, write it as versioned JSONL artifacts, upload those artifacts to Supabase Object Storage, and publish only validated releases into the database.

This plan sits before and feeds into `content-architecture.md`.

## Goal

Support three common content operations:

1. **Create**: start from an empty database and generate the first lessons, quizzes, questions, topics, skills, and media.
2. **Add**: introduce new source material and generate additional content without disturbing unrelated existing content.
3. **Revise**: improve or regenerate existing content when source material, prompts, schemas, or quality requirements change.

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
- license/usage notes
- version
- date added
- notes for generation

## Generation run

A generation run is a reproducible attempt to create or update content.

Inputs:

- grounding documents
- generation scripts
- prompt templates
- schemas
- model settings
- previous content, when revising

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

## Workflows

### 1. Create from empty state

1. Add initial grounding documents.
2. Run generation scripts.
3. Produce JSONL artifacts for topics, skills, lessons, quizzes, questions, and media references.
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

Generated artifacts become available to users only after they are:

1. uploaded,
2. validated,
3. imported into staging,
4. reviewed,
5. attached to a content release,
6. published.

Production should serve only published content releases.

## Minimal first implementation

Start with:

- one source document folder
- one generation script
- one JSON schema per content type
- JSONL output for lessons, quizzes, and questions
- a manifest file
- a validation script
- manual upload/import steps
- one staging review pass

Then expand to topics, skills, media, partial regeneration, and richer quality checks.
