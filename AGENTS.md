# AGENTS

## Runtime

- Use Node `26.2.0` from `.nvmrc`; avoid Codex-bundled Node 24.
- Use `corepack pnpm ...`; PNPM is pinned to `10.15.0`.
- If Turbo cannot find `pnpm`, create a local shim:

```sh
corepack enable --install-directory node_modules/.bin pnpm
```

## Sandboxed Setup

- PNPM uses the workspace store `.pnpm-store`.
- If `pnpm add` reports a store mismatch, relink first:

```sh
corepack pnpm install --force
```

- If Corepack needs a writable cache, use:

```sh
COREPACK_HOME="$PWD/.corepack" corepack pnpm install --frozen-lockfile
```

## Svelte

- Use `svelte-code-writer` and `svelte-core-bestpractices` when working on Svelte files.
- Checks: `corepack pnpm check`, `corepack pnpm lint`.
- Storybook verification: `corepack pnpm build-storybook`.
