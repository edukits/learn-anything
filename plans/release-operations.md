# Release Operations

V2 content releases move through local, staging, then production. The same migrations and JSONL artifacts must be used in each environment.

## Environments

Use project-scoped variables for hosted imports:

```sh
STAGING_SUPABASE_URL=
STAGING_SUPABASE_SERVICE_ROLE_KEY=
PRODUCTION_SUPABASE_URL=
PRODUCTION_SUPABASE_SERVICE_ROLE_KEY=
```

Local imports may continue to use:

```sh
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Do not expose service-role keys to SvelteKit public environment variables.

## Import Flow

1. Reset local Supabase from migrations.
2. Validate the candidate run:

```sh
corepack pnpm content:validate
```

3. Import locally:

```sh
corepack pnpm content:import:local
```

4. Import the exact same manifest into staging:

```sh
corepack pnpm content:import:staging
```

5. Run staging smoke tests and manual QA.
6. Import production only after staging approval:

```sh
node tools/content/import-run.mjs <manifest.json> --target production --confirm-production
```

The importer validates before every import, writes `validation-report.json`, requires an explicit target, and refuses production without `--confirm-production`.

## Staging QA

Record these checks with the release notes:

- migrations apply to a clean hosted staging project
- candidate content imports without validation failures
- public discovery reads topic metadata and preview content
- anonymous users cannot read lesson bodies, answer keys, attempts, XP, streaks, release items, or review data
- sign-in and auth callback work with staging URLs
- protected Literary Devices map loads from the latest published release
- lesson completion writes completion, activity, XP, streak, daily goal, and progress projection once
- quiz submission writes attempt, answers, activity, XP, streak, and progress projection once
- repeated lesson and quiz submissions do not duplicate XP
- release notes list added, revised, and retired content

## Rollback

Preferred rollback is to publish a new release that points to the last known-good content versions. This keeps the release ledger append-friendly.

Emergency rollback can retire the bad release:

```sql
update public.content_releases
set status = 'retired'
where id = '<bad_release_id>';
```

Before using the emergency path in production, prove it in staging:

- latest published Literary Devices content reverts to the previous release
- old quiz attempts still render from their stored `release_id`, content ids, and versions
- `activity_events`, `xp_events`, `streak_events`, and history remain readable
- review selection excludes retired or unpublished question versions

Keep the previous published release id in every release note so rollback does not depend on dashboard memory.
