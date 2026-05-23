<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes } from 'svelte/elements';

	type NavLinkVariant = 'global' | 'learning';

	type NavLinkProps = Omit<HTMLAnchorAttributes, 'class' | 'children'> & {
		variant?: NavLinkVariant;
		current?: boolean;
		class?: string;
		children: Snippet;
	};

	let {
		variant = 'global',
		current = false,
		class: className = '',
		children,
		...anchorProps
	}: NavLinkProps = $props();
</script>

<a
	{...anchorProps}
	class={['nav-link', className]}
	data-variant={variant}
	data-current={current || undefined}
	aria-current={current ? 'page' : undefined}
>
	{@render children()}
</a>

<style>
	@property --nav-link-grad-from {
		syntax: '<color>';
		inherits: false;
		initial-value: transparent;
	}

	@property --nav-link-grad-to {
		syntax: '<color>';
		inherits: false;
		initial-value: transparent;
	}

	@property --nav-link-inset {
		syntax: '<color>';
		inherits: false;
		initial-value: transparent;
	}

	@property --nav-link-shadow {
		syntax: '<color>';
		inherits: false;
		initial-value: transparent;
	}

	.nav-link {
		align-items: center;
		border: 1px solid transparent;
		border-radius: var(--radius-sm);
		color: var(--color-text-muted);
		display: inline-flex;
		font-family: var(--font-display);
		font-weight: 600;
		gap: var(--space-2);
		line-height: 1;
		text-decoration: none;
		transition:
			--nav-link-grad-from 120ms ease-out,
			--nav-link-grad-to 120ms ease-out,
			--nav-link-inset 180ms cubic-bezier(0.22, 1, 0.36, 1),
			--nav-link-shadow 180ms cubic-bezier(0.22, 1, 0.36, 1),
			border-color 120ms ease-out,
			color 120ms ease-out,
			transform 100ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.nav-link:focus-visible {
		outline: 3px solid color-mix(in srgb, var(--color-focus), transparent 40%);
		outline-offset: 2px;
	}

	.nav-link:active {
		transform: scale(0.98);
	}

	/* ── Global variant ── */

	[data-variant='global'] {
		background: transparent;
		border-color: transparent;
		padding: var(--space-2) var(--space-3);
	}

	[data-variant='global']:hover {
		color: var(--color-text);
	}

	[data-variant='global'][data-current] {
		color: var(--color-text);
		font-weight: 700;
	}

	/* ── Learning variant ── */

	[data-variant='learning'] {
		--nav-link-grad-from: transparent;
		--nav-link-grad-to: transparent;
		background: linear-gradient(to bottom, var(--nav-link-grad-from), var(--nav-link-grad-to));
		border-radius: 999px;
		font-size: 0.875rem;
		padding: var(--space-2) var(--space-3);
		white-space: nowrap;
	}

	[data-variant='learning']:hover {
		--nav-link-grad-from: hsl(var(--color-accent-h) 18% 97%);
		--nav-link-grad-to: hsl(var(--color-accent-h) 18% 93%);
		--nav-link-inset: hsl(var(--color-accent-h) 15% 100%);
		border-color: hsl(var(--color-accent-h) 20% 86%);
		box-shadow: 0 1px 0 inset var(--nav-link-inset);
		color: var(--color-text);
	}

	[data-variant='learning'][data-current] {
		--nav-link-grad-from: hsl(var(--color-accent-h) var(--color-accent-s) var(--color-accent-l));
		--nav-link-grad-to: hsl(
			var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) - 12%)
		);
		--nav-link-inset: hsl(
			var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) + 10%)
		);
		--nav-link-shadow: hsl(
			var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) - 22%) / 0.28
		);
		border-color: hsl(
			var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) - 24%)
		);
		box-shadow:
			0 1px 0 inset var(--nav-link-inset),
			0 2px 0 0 var(--nav-link-shadow);
		color: var(--color-accent-contrast);
		font-weight: 700;
	}
</style>
