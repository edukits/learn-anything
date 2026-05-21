---
name: frontend-architecture
description: Svelte 5/SvelteKit architecture rules for scalable frontend apps
category: frontend
tags: [svelte, sveltekit, architecture, state, components]
version: 1.1.0
---

# Svelte 5 Frontend Architecture

Use this when designing, reviewing, or refactoring a SvelteKit app that needs clear boundaries, predictable state, and maintainable data flow.

## Defaults

Use SvelteKit, TypeScript, and Svelte 5 runes. Prefer feature folders over global buckets. Keep route data in SvelteKit `load`, keep mutations in actions or `+server.ts` endpoints, and keep secrets in server-only modules. Avoid architecture patterns that do not reduce real coupling.

## Structure

For a specific app:

```txt
src/
  lib/
    features/
      products/
        components/
        state.svelte.ts
        types.ts
        index.ts              # client-safe public API
        server/
          queries.server.ts
          mutations.server.ts
          index.server.ts     # server-only public API
    shared/
      components/
      utils/
      types/
    server/
      db/
      auth/
  routes/
    +layout.svelte
    +layout.ts
    products/
      +page.svelte
      +page.server.ts
      [id]/
        +page.svelte
        +page.server.ts
```

Rules:

* `routes/` owns routing, redirects, page composition, route data, and route actions.
* `features/*` owns domain UI, feature types, feature state, and feature-level APIs.
* `shared/*` is for reusable, domain-neutral primitives only.
* Server-only code must live in `$lib/server/**` or use a `.server.ts` filename. A folder named `server/` is not enough by itself.
* Do not create root-level `components/`, `stores/`, or `utils/` dumping grounds.

## Components

Components should render UI and emit intent. They should not combine rendering with persistence, authorization, route data loading, or cross-page state. Route-critical data belongs in `load`; browser-only or isolated widget data may be fetched inside a component when that boundary is simpler.

Prefer callback props for intent:

```svelte
<script lang="ts">
  import type { Product } from '../types';

  let { product, onAdd }: { product: Product; onAdd: (product: Product) => void } = $props();
</script>

<button type="button" onclick={() => onAdd(product)}>Add</button>
```

## State

Use the smallest viable scope:

1. Local component state: `$state`
2. Derived view state: `$derived`
3. Subtree state: context with runes
4. Shared client state: `.svelte.ts` rune modules
5. Server state: `load`, actions, endpoints, invalidation, cookies, sessions, and the database

Use `$effect` only for side effects, not routine state synchronization. Prefer runes over stores for app state; use stores only when the store contract, async stream interop, or third-party library integration justifies them.

Never put request-specific or user-specific state in module scope on the server. Use `event.locals`, cookies, persisted sessions, the database, or route data instead.

## Data and Mutations

Use `+page.ts` / `+layout.ts` for universal route data and `+page.server.ts` / `+layout.server.ts` for secrets, database access, private APIs, and authorization.

```ts
// routes/products/+page.server.ts
import { getProducts } from '$lib/features/products/server/queries.server';

export async function load() {
	return { products: await getProducts() };
}
```

Rules:

* Fetch page data in `load`, not `onMount`, unless the data is browser-only.
* Prefer form actions for normal CRUD, auth, settings, and product flows.
* Use `+server.ts` endpoints for webhooks, non-form APIs, programmatic clients, or JSON protocols.
* Validate inputs at the server boundary.
* After mutations, use returned action data, `invalidate`, or `invalidateAll` deliberately.
* Do not copy server state into long-lived client state unless drafts, optimistic UI, or offline behavior require it.

## Auth

Parse sessions in `hooks.server.ts`, put trusted user/session data on `event.locals`, and enforce authorization in server loads, actions, and endpoints. Client-side guards are UX only, never security.

Be careful using layout loads as auth gates: child loads can run independently or concurrently. Enforce sensitive checks at the route or endpoint that owns the protected data.

## Module Boundaries

A feature may import from itself and `$lib/shared/*`. Server-only feature files may also import `$lib/server/*`.

A feature should not import another feature's internals. Export intentional client-safe APIs from `index.ts`; export server-only APIs from `server/index.server.ts`. Never mix client and server exports in the same barrel.

## Styling

Shared primitives own layout-neutral styling. Page components own page layout. Feature components own feature-specific styling. Global CSS is for tokens, resets, fonts, and app shell rules only.

## Testing

Test behavior, not Svelte internals or rune mechanics.

* Unit: validation, formatting, pure domain logic
* Component: important UI states and emitted intent
* Integration: risky `load`, action, and endpoint behavior
* E2E: critical user flows only

Use Vitest for unit/integration tests, component testing where it pays for itself, and Playwright for E2E.

## Performance

Measure production behavior before optimizing. Start with route data shape, invalidation scope, assets, dependency weight, and waterfalls.

Rules:

* Keep route data in `load` to avoid client waterfalls.
* Split by route first; dynamically import only genuinely heavy UI.
* Avoid large global client state objects.
* Use `$derived` instead of repeated template computation.
* Keep images sized, lazy where appropriate, and responsive.
* Audit UI kits, charts, editors, maps, and date libraries before adding them.

## Naming

* Components: `PascalCase.svelte`
* Rune state modules: `state.svelte.ts`
* Types: `types.ts`
* Server-only modules: `$lib/server/**` or `*.server.ts`
* Tests: `*.test.ts` or `*.test.svelte.ts`
* Routes: SvelteKit file conventions exactly

## Review Checklist

Approve architecture only when:

* State is scoped as locally as practical.
* Route data uses SvelteKit loading primitives.
* Secrets and privileged logic are server-only by enforcement, not convention.
* Components are small and intent-driven.
* Feature APIs are exported intentionally.
* Client and server barrels are separate.
* Auth is enforced server-side at the data boundary.
* Tests cover risky behavior.
* Performance work removes measured or plausible cost.
