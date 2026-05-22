# Local Development

Use the Supabase CLI local stack for database, auth, storage, and local review. The local workflow should mirror production closely enough that migrations, RLS policies, auth flows, storage buckets, and the JSONL content import path are exercised before anything is pushed to a hosted Supabase project.

V1 was intentionally local-first. V2 should add hosted staging and production Supabase projects after the local quiz/progress loop is working.

## Prerequisites

- Node from `.nvmrc`
- PNPM through Corepack
- Docker-compatible container runtime
- Supabase CLI installed as a local dev dependency or run through the package manager

The product web app lives in `apps/web`. Development should run locally against the Supabase local stack while still using a Cloudflare Pages-compatible SvelteKit adapter for the deployment target.

Expected dependency additions include:

- Supabase CLI as a dev dependency
- Supabase client/server packages for SvelteKit auth and data access
- schema validation tooling for JSONL artifacts and server-side request validation
- Cloudflare Pages SvelteKit adapter
- Bits UI primitives where appropriate for accessible app UI controls

Prefer project-local commands, for example:

```sh
corepack pnpm exec supabase --help
```

If the CLI has not been added yet, install it as a dev dependency rather than relying on a global npm install.

## First setup

Initialize Supabase local project files once:

```sh
corepack pnpm exec supabase init
```

This creates `supabase/config.toml` and the local Supabase project structure.

Start the local stack:

```sh
corepack pnpm exec supabase start
```

Inspect local service URLs and keys:

```sh
corepack pnpm exec supabase status
corepack pnpm exec supabase status -o env
```

Use those values for local SvelteKit environment variables, such as the public Supabase URL/key and any server-only service role key needed by controlled import scripts.

## Local database workflow

Schema changes should be captured as migrations under `supabase/migrations`.

Create migrations with the CLI:

```sh
corepack pnpm exec supabase migration new create_initial_content_schema
```

Apply migrations to a clean local database:

```sh
corepack pnpm exec supabase db reset
```

Current migrations should create:

- content tables
- release tables
- attempt/progress tables
- RLS policies
- storage buckets/policies if needed
- fixed system data only, if any

V2 migrations should add:

- XP events
- streak events
- daily goal settings
- review sessions
- review session question links
- activity events, if needed for history
- RLS policies for all new user-owned tables

Do not put curriculum content directly in SQL migrations. Literary Devices curriculum content should use the same JSONL artifact/import workflow planned for later generated content.

## Local content import workflow

After `supabase db reset`, import JSONL artifacts into the local database with the same import script that will later run against staging.

The local import should:

- validate schemas
- validate references
- insert content objects and versions
- insert quiz-question relationships
- insert release metadata
- publish the local Literary Devices release
- fail on broken references, duplicate ids, or invalid answer keys

The app should then read from local Supabase exactly as it would read from staging or production: latest published release only.

## Local auth workflow

Use the local Supabase Auth service for sign-in testing.

Auth testing should cover:

- email magic-link sign-in
- callback route session exchange
- protected route redirects
- logout
- profile/account row creation
- user-owned RLS enforcement

Use the local email testing tool exposed by the Supabase stack rather than sending real emails during local development. The exact local URL should come from `supabase status`.

## Local storage workflow

Supabase Object Storage should be available in the local stack. In v2, storage should be exercised for hosted artifact/media assumptions before the release path depends on it.

If storage is used locally:

- create buckets through migrations or controlled setup scripts
- keep media/artifact paths immutable
- test storage policies locally before applying them to a hosted project

## Hosted project workflow

Local development is the source of truth for schema changes. For v2, hosted staging should be introduced before production.

Before pushing to a hosted Supabase project:

1. Run local migrations from a clean reset.
2. Run JSONL validation and local import.
3. Exercise auth, quiz submission, progress, and RLS locally.
4. Review generated SQL migrations.
5. Push migrations to the hosted project only after local verification.

Hosted staging should receive the same migrations and JSONL artifacts that passed locally.

V2 hosted workflow:

1. Apply migrations to hosted staging.
2. Import the candidate content release into staging.
3. Run smoke tests for auth, protected routes, quiz submission, progress, XP/streak writes, and review sessions.
4. Run manual content QA against staging.
5. Promote the same migration set and content artifacts to production.
6. Publish the production content release only after production import succeeds.
7. Keep a rollback note for the previous published release id.

## Useful commands

```sh
corepack pnpm exec supabase --help
corepack pnpm exec supabase start
corepack pnpm exec supabase status
corepack pnpm exec supabase status -o env
corepack pnpm exec supabase migration new <name>
corepack pnpm exec supabase db reset
corepack pnpm exec supabase stop
```

When in doubt, check command help before assuming CLI flags:

```sh
corepack pnpm exec supabase <command> --help
```
