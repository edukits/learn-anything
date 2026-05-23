<script lang="ts">
	import type { Snippet } from 'svelte';

	type NavStripTone = 'global' | 'learning';

	let {
		tone = 'global',
		sticky = false,
		class: className = '',
		children
	}: {
		tone?: NavStripTone;
		sticky?: boolean;
		class?: string;
		children: Snippet;
	} = $props();
</script>

<div class={['nav-strip', className]} data-tone={tone} data-sticky={sticky || undefined}>
	{@render children()}
</div>

<style>
	@property --nav-strip-inset {
		syntax: '<color>';
		inherits: false;
		initial-value: transparent;
	}

	.nav-strip {
		background: linear-gradient(
			to bottom,
			var(--color-surface),
			color-mix(in srgb, var(--color-surface), var(--color-border) 8%)
		);
		border-block-end: 1px solid var(--color-border);
		box-shadow:
			0 1px 0 inset var(--nav-strip-inset),
			0 1px 2px rgb(20 24 31 / 0.04);
	}

	.nav-strip[data-tone='learning'] {
		--nav-strip-inset: rgb(255 255 255 / 0.55);
		background: linear-gradient(
			to bottom,
			color-mix(in srgb, var(--color-surface-raised), var(--color-surface) 55%),
			color-mix(in srgb, var(--color-surface), var(--color-border) 12%)
		);
	}

	.nav-strip[data-sticky] {
		position: sticky;
		top: 0;
		z-index: 50;
	}
</style>
