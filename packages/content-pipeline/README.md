# Content Pipeline

Generates modular curriculum content, validates the JSONL artifacts, and imports approved releases into Supabase.

## Generate Content

Create a topic directory with:

```txt
topic.json
README.md
sources/            # optional, with sources/sources.json when needed
```

Run generation from the repo root:

```sh
corepack pnpm --filter @learn-anything/content-pipeline content-pipeline generate <topic-dir>
```

The pipeline writes planning files to `<topic-dir>/.content-pipeline/` and importable artifacts to `<topic-dir>/dist/manifest.json`.

The generated flow is module-based:

1. `TOPIC_MODULES.json` defines the modules.
2. Each module gets its own syllabus.
3. Lessons and quizzes are generated from the ordered module syllabi.
4. Bundling emits `topic-modules.jsonl` and module-linked `learning-paths.jsonl`.

## Test Locally With Supabase

Start or reset the local Supabase stack:

```sh
corepack pnpm exec supabase start
corepack pnpm exec supabase db reset
```

Validate and diff the generated run:

```sh
node tools/content/validate-run.mjs <topic-dir>/dist/manifest.json --base none
node tools/content/diff-run.mjs <topic-dir>/dist/manifest.json --base none
```

Import it into local Supabase:

```sh
node tools/content/import-run.mjs <topic-dir>/dist/manifest.json --target local
```

Then run the app against local Supabase and smoke-test topic discovery, enrollment, lessons, quizzes, progress, and adaptive review.

## Promote To Production

Use the same manifest that passed local testing.

Import to staging first:

```sh
node tools/content/upload-run.mjs <topic-dir>/dist/manifest.json --target staging
node tools/content/diff-run.mjs <topic-dir>/dist/manifest.json --base <published-base-manifest.json> --target staging
node tools/content/import-run.mjs <topic-dir>/dist/manifest.json --target staging
```

Run staging QA and approve the release through the content admin flow.

For production, import only after staging has passed and the release manifest includes the required review, staging, and rollback metadata:

```sh
node tools/content/upload-run.mjs <topic-dir>/dist/manifest.json --target production
node tools/content/import-run.mjs <topic-dir>/dist/manifest.json --target production --confirm-production
```

Production import creates or updates the release review record. Publishing happens through `/app/content-admin`; avoid direct SQL except during an incident.
