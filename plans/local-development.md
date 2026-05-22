# Local Development

Use the Supabase CLI local stack for database, auth, storage, and local review. Local Supabase setup is the first implementation step for v1. The local workflow should mirror production closely enough that migrations, RLS policies, auth flows, storage buckets, and the JSONL content import path are exercised before anything is pushed to a hosted Supabase project.

Do not set up hosted Supabase at the start of v1. Build and verify the full quiz/progress loop against local Supabase first.

## Prerequisites

- Node from `.nvmrc`
- PNPM through Corepack
- Docker-compatible container runtime
- Supabase CLI installed as a local dev dependency or run through the package manager

The v1 web app should live in `apps/web`. Development should run locally against the Supabase local stack while still using a Cloudflare Pages-compatible SvelteKit adapter for the deployment target.

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

For v1, migrations should create:

- content tables
- release tables
- attempt/progress tables
- RLS policies
- storage buckets/policies if needed
- fixed system data only, if any

Do not put curriculum content directly in SQL migrations. Literary Devices curriculum content should use the same JSONL artifact/import workflow planned for later generated content.

## Local content import workflow

After `supabase db reset`, import the v1 JSONL artifacts into the local database with the same import script that will later run against staging.

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

V1 auth testing should cover:

- email magic-link sign-in
- callback route session exchange
- protected route redirects
- logout
- profile/account row creation
- user-owned RLS enforcement

Use the local email testing tool exposed by the Supabase stack rather than sending real emails during local development. The exact local URL should come from `supabase status`.

## Local storage workflow

Supabase Object Storage should be available in the local stack. For v1, storage may only be needed for validating the future artifact/media path.

If storage is used locally:

- create buckets through migrations or controlled setup scripts
- keep media/artifact paths immutable
- test storage policies locally before applying them to a hosted project

## Hosted project workflow

Local development is the source of truth for schema changes. Hosted Supabase is deferred until the local v1 loop works end to end.

Before pushing to a hosted Supabase project:

1. Run local migrations from a clean reset.
2. Run JSONL validation and local import.
3. Exercise auth, quiz submission, progress, and RLS locally.
4. Review generated SQL migrations.
5. Push migrations to the hosted project only after local verification.

Hosted staging should receive the same migrations and JSONL artifacts that passed locally.

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
