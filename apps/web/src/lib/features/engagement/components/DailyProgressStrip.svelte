<script lang="ts">
	import type { EngagementSummary } from '../types';
	import { Flame, Star } from '@lucide/svelte';
	import { ProgressBar } from '@learn-anything/ui';

	type Props = {
		engagement: EngagementSummary;
	};

	let { engagement }: Props = $props();

	let goalMet = $derived(engagement.daily_goal_remaining === 0);
	let dailyGoalLabel = $derived(
		goalMet ? 'Daily goal met!' : `${engagement.daily_goal_remaining} XP to daily goal`
	);
	let streakLabel = $derived(
		`${engagement.current_streak} ${engagement.current_streak === 1 ? 'day' : 'days'} streak`
	);
	let streakActive = $derived(engagement.current_streak > 0);
</script>

<section class="daily-strip" aria-label="Daily progress">
	<div class="daily-strip-content layout-content">
		<div class="daily-meter">
			<div class="daily-meter-header">
				<strong>{engagement.xp_today}/{engagement.daily_xp_goal} XP</strong>
				<span class="goal-label" class:goal-met={goalMet}>{dailyGoalLabel}</span>
			</div>
			<ProgressBar
				value={engagement.xp_today}
				max={engagement.daily_xp_goal}
				size="sm"
				h={goalMet ? 42 : undefined}
				s={goalMet ? 92 : undefined}
				l={goalMet ? 52 : undefined}
				aria-label="Daily XP goal progress"
				disableSparks={!goalMet}
				sparkThreshold={1}
				sparkTrigger={goalMet}
			/>
		</div>
		<div class="daily-stats">
			<div class="daily-stat" class:streak-active={streakActive}>
				<Flame size={18} />
				<span>{streakLabel}</span>
			</div>
			<div class="daily-stat">
				<Star size={18} />
				<span>{engagement.xp_total} XP total</span>
			</div>
		</div>
	</div>
</section>

<style>
	.daily-strip {
		background: color-mix(in srgb, var(--color-surface), var(--color-surface-raised) 55%);
		border-block-end: 1px solid var(--color-border);
	}

	.daily-strip-content {
		align-items: center;
		display: grid;
		gap: 16px;
		grid-template-columns: minmax(220px, 1fr) auto;
		padding-block: 12px;
	}

	.daily-meter {
		display: flex;
		flex-direction: column;
		gap: 6px;
		max-inline-size: 320px;
	}

	.daily-meter-header {
		display: flex;
		align-items: baseline;
		gap: 8px;
	}

	.daily-meter strong {
		font-size: 0.96rem;
		line-height: 1.1;
	}

	.goal-label {
		color: var(--color-text-muted);
		font-size: 0.88rem;
		white-space: nowrap;
		transition: color 300ms ease;
	}

	.goal-met {
		color: hsl(42 92% 42%);
		font-weight: 600;
	}

	.daily-stats {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.daily-stat {
		align-items: center;
		color: var(--color-accent);
		display: inline-flex;
		gap: 7px;
	}

	.daily-stat span {
		color: var(--color-text-muted);
		font-size: 0.88rem;
		white-space: nowrap;
	}

	.streak-active :global(svg) {
		animation: pulse-glow 2s ease-in-out infinite;
		color: hsl(24 95% 54%);
		filter: drop-shadow(0 0 4px hsl(24 95% 54% / 0.5));
	}

	@keyframes pulse-glow {
		0%,
		100% {
			opacity: 1;
			filter: drop-shadow(0 0 4px hsl(24 95% 54% / 0.5));
		}
		50% {
			opacity: 0.75;
			filter: drop-shadow(0 0 8px hsl(24 95% 54% / 0.7));
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.streak-active :global(svg) {
			animation: none;
		}
	}

	@media (max-width: 860px) {
		.daily-strip-content {
			align-items: start;
			grid-template-columns: 1fr;
		}
	}
</style>
