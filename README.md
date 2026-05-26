# Clarifyst

PNPM monorepo managed with Turborepo.

## Workspace layout

- `apps/demo` - first SvelteKit app consuming the shared system
- `packages/config` - shared Prettier, Oxlint, and Vite helpers
- `packages/tokens` - design tokens exported as CSS custom properties
- `packages/ui` - Svelte component library and Storybook workspace

## Commands

```sh
pnpm dev
pnpm build
pnpm check
pnpm lint
pnpm format
pnpm storybook
pnpm test
```
