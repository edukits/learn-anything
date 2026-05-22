# Release Operations

V3 content releases move through local, staging, admin review, then production publish. The same migrations and JSONL artifacts must be used in each environment.

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
6. Record `manifest.review_status = "approved"`, `manifest.staging.imported_at`, `manifest.staging.smoke_tested_at`, and `manifest.rollback.previous_release_id` before production import.
7. Import the approved candidate into production:

```sh
node tools/content/import-run.mjs <manifest.json> --target production --confirm-production
```

The importer validates before every import, writes `validation-report.json`, requires an explicit target, and refuses production without `--confirm-production`. Production import creates or updates a candidate release review with validation and diff evidence; publishing happens through `/app/content-admin`, not direct SQL.

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

Emergency rollback uses `/app/content-admin`. The release manifest must include `rollback.previous_release_id`; the rollback control retires the bad release and republishes that previous release in the same topic scope. If that metadata is missing, publish a corrective release instead of manually editing production.

Avoid direct SQL rollback except during a declared database incident. If direct SQL is unavoidable, first prove the exact statements in staging and verify the topic keeps one published release.

Example emergency SQL:

```sql
begin;

update public.content_releases
set status = 'retired'
where id = '<bad_release_id>'
	and scope_type = 'topic_area';

update public.content_releases
set status = 'published',
	published_at = coalesce(published_at, now())
where id = '<previous_release_id>'
	and scope_type = 'topic_area';

commit;
```

Before using the emergency path in production, prove it in staging:

- latest published Literary Devices content reverts to the previous release
- old quiz attempts still render from their stored `release_id`, content ids, and versions
- `activity_events`, `xp_events`, `streak_events`, and history remain readable
- review selection excludes retired or unpublished question versions

Keep the previous published release id in every release note so rollback does not depend on dashboard memory.

## Content Incidents

Use content issue reports for learner-visible defects in lessons and quiz questions.

1. Triage open reports in `/app/content-admin`.
2. Mark duplicates or non-issues as `dismissed` with resolution notes.
3. For valid reports, reproduce against the reported release id, content id, and version.
4. If the issue affects scoring, pause promotion of the candidate release and create a replacement content run.
5. If the issue is already published and severe, use the rollback procedure above.
6. Resolve the report only after the replacement release is published or the rollback is complete.

Do not log answer keys, private learner email, or raw auth metadata in issue notes.

## Engagement Incidents

Engagement data must remain append-friendly.

1. For duplicate XP, achievements, streaks, or leaderboard scores, identify the source event ids before changing projections.
2. Prefer compensating events or projection recomputation over deleting event history.
3. Temporarily disable public leaderboard participation only by updating public profile opt-in or league membership status, not by deleting profiles.
4. Recompute affected projections in staging first, then production.
5. Note the affected user ids, release ids, and time window in the incident log.
