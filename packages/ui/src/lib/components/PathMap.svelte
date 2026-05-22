<script lang="ts" module>
	export type PathMapItemState = 'available' | 'active' | 'completed' | 'locked' | 'review';
	export type PathMapItemKind = 'lesson' | 'practice' | 'quiz' | 'review' | 'milestone';
	export type PathMapIcon = 'book' | 'check' | 'lock' | 'play' | 'refresh' | 'target' | 'trophy';
	export type PathMapDensity = 'comfortable' | 'compact';

	export type PathMapItem = {
		id: string;
		title: string;
		description?: string;
		eyebrow?: string;
		meta?: string;
		href?: string;
		state?: PathMapItemState;
		kind?: PathMapItemKind;
		icon?: PathMapIcon;
	};
</script>

<script lang="ts">
	import { BookOpen, Check, Lock, Play, RotateCcw, Target, Trophy } from '@lucide/svelte';

	type PathMapProps = {
		items: PathMapItem[];
		ariaLabel?: string;
		density?: PathMapDensity;
		class?: string;
	};

	const iconComponents = {
		book: BookOpen,
		check: Check,
		lock: Lock,
		play: Play,
		refresh: RotateCcw,
		target: Target,
		trophy: Trophy
	};

	let {
		items,
		ariaLabel = 'Learning path',
		density = 'comfortable',
		class: className = ''
	}: PathMapProps = $props();

	function isLinked(item: PathMapItem): item is PathMapItem & { href: string } {
		return Boolean(item.href) && item.state !== 'locked';
	}

	function resolveIcon(item: PathMapItem) {
		if (item.icon) return iconComponents[item.icon];
		if (item.state === 'locked') return Lock;
		if (item.state === 'completed') return Check;
		if (item.state === 'review') return RotateCcw;
		if (item.kind === 'quiz' || item.kind === 'milestone') return Trophy;
		if (item.kind === 'practice' || item.kind === 'review') return Target;
		return item.state === 'active' ? Play : BookOpen;
	}

	function normalizeState(state: PathMapItemState | undefined) {
		return state ?? 'available';
	}
</script>

{#snippet nodeBody(item: PathMapItem)}
	{@const Icon = resolveIcon(item)}
	<span class="icon" aria-hidden="true">
		<Icon size={24} strokeWidth={2.25} />
	</span>
	<span class="content">
		{#if item.eyebrow}
			<span class="eyebrow">{item.eyebrow}</span>
		{/if}
		<strong>{item.title}</strong>
		{#if item.description}
			<span class="description">{item.description}</span>
		{/if}
		{#if item.meta}
			<small>{item.meta}</small>
		{/if}
	</span>
{/snippet}

<section class={['path-map', className]} data-density={density} aria-label={ariaLabel}>
	{#each items as item, index (item.id)}
		{@const state = normalizeState(item.state)}
		<div class="step">
			{#if isLinked(item)}
				<a class="node" data-state={state} data-kind={item.kind ?? 'lesson'} href={item.href} aria-current={state === 'active' ? 'step' : undefined}>
					{@render nodeBody(item)}
				</a>
			{:else}
				<div class="node" data-state={state} data-kind={item.kind ?? 'lesson'} aria-disabled={state === 'locked' ? 'true' : undefined}>
					{@render nodeBody(item)}
				</div>
			{/if}

			{#if index < items.length - 1}
				<div class="connector" data-state={state} aria-hidden="true"></div>
			{/if}
		</div>
	{/each}
</section>

<style>
	.path-map {
		color: var(--color-text);
		display: grid;
	}

	.step {
		display: grid;
		justify-items: start;
	}

	.node {
		--path-item-accent-h: var(--color-accent-h);
		--path-item-accent-l: var(--color-accent-l);
		--path-item-accent-s: var(--color-accent-s);
		--path-item-accent: hsl(
			var(--path-item-accent-h) var(--path-item-accent-s) var(--path-item-accent-l)
		);
		--path-item-accent-ink: hsl(
			var(--path-item-accent-h) var(--path-item-accent-s) calc(var(--path-item-accent-l) - 28%)
		);
		align-items: center;
		background: color-mix(in srgb, var(--color-surface), var(--color-surface-raised) 42%);
		border: 2px solid color-mix(in srgb, var(--path-item-accent), var(--color-border) 72%);
		border-radius: var(--radius-md);
		color: var(--color-text);
		display: grid;
		gap: var(--space-5);
		grid-template-columns: auto minmax(0, 1fr);
		inline-size: 100%;
		min-block-size: 6rem;
		padding: var(--space-5);
		text-decoration: none;
		transition:
			background 150ms ease-out,
			border-color 150ms ease-out,
			box-shadow 150ms ease-out;
	}

	a.node:hover {
		background: color-mix(in srgb, var(--path-item-accent), var(--color-surface) 92%);
		border-color: color-mix(in srgb, var(--path-item-accent), var(--color-border) 45%);
	}

	a.node:focus-visible {
		outline: 3px solid color-mix(in srgb, var(--color-focus), transparent 40%);
		outline-offset: 3px;
	}

	.node[data-state='active'] {
		--path-item-accent-h: var(--color-accent-h);
		--path-item-accent-l: var(--color-accent-l);
		--path-item-accent-s: var(--color-accent-s);
		border-color: var(--path-item-accent);
		box-shadow: var(--shadow-sm);
	}

	.node[data-state='completed'] {
		--path-item-accent-h: var(--color-correct-h);
		--path-item-accent-l: var(--color-correct-l);
		--path-item-accent-s: var(--color-correct-s);
		border-color: color-mix(in srgb, var(--path-item-accent), var(--color-border) 34%);
	}

	.node[data-state='review'] {
		--path-item-accent-h: var(--color-star-h);
		--path-item-accent-l: var(--color-star-l);
		--path-item-accent-s: var(--color-star-s);
		border-color: color-mix(in srgb, var(--path-item-accent), var(--color-border) 34%);
	}

	.node[data-state='locked'] {
		--path-item-accent-h: var(--color-accent-h);
		--path-item-accent-l: 58%;
		--path-item-accent-s: 12%;
		background: var(--color-surface-raised);
		color: var(--color-text-muted);
	}

	.icon {
		align-items: center;
		border-radius: 999px;
		display: inline-flex;
		justify-content: center;
		min-block-size: 3.375rem;
		min-inline-size: 3.375rem;
		/* Give it a 3D appearance */
		--tone-top: var(--path-item-accent-l);
		--tone-bottom: calc(var(--path-item-accent-l) - 15%);
		--tone-border: calc(var(--path-item-accent-l) - 25%);
		--tone-inset: calc(var(--color-accent-l) + 10%);
		background: linear-gradient(
			to bottom,
			hsl(var(--path-item-accent-h) var(--path-item-accent-s) var(--tone-top)),
			hsl(var(--path-item-accent-h) var(--path-item-accent-s) var(--tone-bottom))
		);
		border: 1px solid hsl(var(--path-item-accent-h) var(--path-item-accent-s) var(--tone-border));
		box-shadow:
			0 2px 1px inset hsl(var(--path-item-accent-h) var(--path-item-accent-s) var(--tone-inset)),
			0 2px 0 hsl(var(--path-item-accent-h) var(--path-item-accent-s) var(--tone-border));
		color: var(--color-accent-contrast);
	}

	.content {
		display: grid;
		gap: var(--space-1);
		min-inline-size: 0;
	}

	.eyebrow {
		color: var(--color-text-muted);
		font-size: 0.75rem;
		font-weight: 750;
		letter-spacing: 0;
		line-height: 1.1;
		text-transform: uppercase;
	}

	strong {
		font-size: 1.15rem;
		line-height: 1.2;
		overflow-wrap: anywhere;
	}

	.description {
		color: var(--color-text-muted);
		font-size: 0.95rem;
		line-height: 1.35;
	}

	small {
		color: var(--color-text-muted);
		font-size: 0.92rem;
		line-height: 1.3;
	}

	.connector {
		--path-item-accent-h: var(--color-accent-h);
		--path-item-accent-l: var(--color-accent-l);
		--path-item-accent-s: var(--color-accent-s);
		--path-item-accent: hsl(
			var(--path-item-accent-h) var(--path-item-accent-s) var(--path-item-accent-l)
		);
		background: color-mix(in srgb, var(--path-item-accent), var(--color-border) 78%);
		block-size: var(--space-8);
		inline-size: 0.375rem;
		margin-inline-start: calc(1.6875rem + var(--space-5));
	}

	.connector[data-state='completed'] {
		--path-item-accent-h: var(--color-correct-h);
		--path-item-accent-l: var(--color-correct-l);
		--path-item-accent-s: var(--color-correct-s);
		background: color-mix(in srgb, var(--path-item-accent), var(--color-border) 24%);
	}

	.connector[data-state='review'] {
		--path-item-accent-h: var(--color-star-h);
		--path-item-accent-l: var(--color-star-l);
		--path-item-accent-s: var(--color-star-s);
		background: color-mix(in srgb, var(--path-item-accent), var(--color-border) 24%);
	}

	.connector[data-state='locked'] {
		--path-item-accent-h: var(--color-accent-h);
		--path-item-accent-l: 58%;
		--path-item-accent-s: 12%;
	}

	.path-map[data-density='compact'] {
		padding: var(--space-5);
	}

	.path-map[data-density='compact'] .node {
		gap: var(--space-3);
		min-block-size: 4.75rem;
		padding: var(--space-4);
	}

	.path-map[data-density='compact'] .icon {
		min-block-size: 2.75rem;
		min-inline-size: 2.75rem;
	}

	.path-map[data-density='compact'] .connector {
		block-size: var(--space-5);
		margin-inline-start: calc(1.375rem + var(--space-4));
	}

	@media (max-width: 560px) {
		.node {
			align-items: start;
			gap: var(--space-3);
			min-block-size: 5.5rem;
			padding: var(--space-4);
		}

		.icon {
			min-block-size: 2.75rem;
			min-inline-size: 2.75rem;
		}

		.connector {
			block-size: var(--space-5);
			margin-inline-start: calc(1.375rem + var(--space-4));
		}
	}
</style>
