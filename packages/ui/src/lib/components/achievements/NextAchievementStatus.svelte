<script lang="ts">
	import { ArrowRight, Target } from '@lucide/svelte';
	import ProgressBar from '../ProgressBar.svelte';
	import { clampPercent } from './format';
	import type { NextAchievementData } from './types';

	let {
		achievement,
		href,
		class: className = ''
	}: {
		achievement: NextAchievementData | null;
		href: string;
		class?: string;
	} = $props();

	let progressPercent = $derived(achievement ? clampPercent(achievement.progressPercent) : 0);
</script>

{#if achievement}
	<a class={['next-achievement', className]} {href}>
		<div class="next-icon" aria-hidden="true">
			<Target size={18} />
		</div>
		<div class="next-body">
			<span class="label">Next achievement</span>
			<strong>{achievement.name}</strong>
			<div class="meter">
				<span>{achievement.progressLabel}</span>
				<ProgressBar
					value={progressPercent}
					size="sm"
					aria-label={`${achievement.name} progress`}
					disableSparks
				/>
			</div>
		</div>
		<ArrowRight class="arrow" size={17} />
	</a>
{/if}

<style>
	.next-achievement {
		align-items: center;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		color: inherit;
		display: grid;
		gap: 12px;
		grid-template-columns: auto minmax(0, 1fr) auto;
		padding: 14px;
		text-decoration: none;
		transition:
			border-color 0.16s ease,
			box-shadow 0.16s ease,
			transform 0.12s ease;
	}

	.next-achievement:hover {
		border-color: color-mix(in srgb, var(--color-accent), var(--color-border) 45%);
		box-shadow: 0 8px 18px hsl(0 0% 0% / 0.08);
		transform: translateY(-1px);
	}

	.next-achievement:focus-visible {
		outline: 3px solid color-mix(in srgb, var(--color-focus), transparent 40%);
		outline-offset: 2px;
	}

	.next-icon {
		align-items: center;
		background: color-mix(in srgb, var(--color-accent), transparent 88%);
		border: 1px solid color-mix(in srgb, var(--color-accent), transparent 66%);
		border-radius: var(--radius-sm);
		color: var(--color-accent);
		display: grid;
		block-size: 36px;
		inline-size: 36px;
		justify-items: center;
	}

	.next-body {
		display: grid;
		gap: 3px;
		min-inline-size: 0;
	}

	.label {
		color: var(--color-text-muted);
		font-size: 0.72rem;
		font-weight: 760;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.next-body strong {
		font-size: 0.95rem;
		line-height: 1.15;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.meter {
		display: grid;
		gap: 5px;
		margin-block-start: 4px;
	}

	.meter span {
		color: var(--color-text-muted);
		font-size: 0.8rem;
		font-weight: 650;
	}

	.arrow {
		color: var(--color-text-muted);
	}

	@media (prefers-reduced-motion: reduce) {
		.next-achievement {
			transition: none;
		}

		.next-achievement:hover {
			transform: none;
		}
	}
</style>
