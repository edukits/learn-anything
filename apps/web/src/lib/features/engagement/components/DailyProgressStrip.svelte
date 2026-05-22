<script lang="ts">
	import type { EngagementSummary } from '../types';
	import { Flame, Star } from '@lucide/svelte';

	type Props = {
		engagement: EngagementSummary;
	};

	let { engagement }: Props = $props();

	let dailyGoalLabel = $derived(
		engagement.daily_goal_remaining === 0
			? 'Daily goal met'
			: `${engagement.daily_goal_remaining} XP to daily goal`
	);
	let streakLabel = $derived(
		`${engagement.current_streak} ${engagement.current_streak === 1 ? 'day' : 'days'} streak`
	);
</script>

<section class="daily-strip" aria-label="Daily progress">
	<div class="daily-strip-content layout-content">
		<div class="daily-meter">
			<div>
				<strong>{engagement.xp_today}/{engagement.daily_xp_goal} XP</strong>
				<span>{dailyGoalLabel}</span>
			</div>
			<div
				class="meter"
				role="progressbar"
				aria-label="Daily XP goal progress"
				aria-valuemin="0"
				aria-valuemax={engagement.daily_xp_goal}
				aria-valuenow={Math.min(engagement.xp_today, engagement.daily_xp_goal)}
			>
				<span style:width={`${engagement.daily_goal_percent}%`}></span>
			</div>
		</div>
		<div class="daily-stat">
			<Flame size={18} />
			<span>{streakLabel}</span>
		</div>
		<div class="daily-stat">
			<Star size={18} />
			<span>{engagement.xp_total} XP total</span>
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
		grid-template-columns: minmax(220px, 1fr) auto auto;
		padding-block: 12px;
	}

	.daily-meter {
		align-items: center;
		display: grid;
		gap: 12px;
		grid-template-columns: minmax(120px, auto) minmax(120px, 280px);
	}

	.daily-meter div:first-child {
		display: grid;
		gap: 2px;
	}

	.daily-meter strong {
		font-size: 0.96rem;
		line-height: 1.1;
	}

	.daily-meter span,
	.daily-stat span {
		color: var(--color-text-muted);
		font-size: 0.88rem;
		white-space: nowrap;
	}

	.meter {
		background: var(--color-border);
		border-radius: 999px;
		block-size: 9px;
		overflow: hidden;
	}

	.meter span {
		background: var(--color-accent);
		block-size: 100%;
		display: block;
	}

	.daily-stat {
		align-items: center;
		color: var(--color-accent);
		display: inline-flex;
		gap: 7px;
	}

	@media (max-width: 860px) {
		.daily-strip-content {
			align-items: start;
			grid-template-columns: 1fr;
		}

		.daily-meter {
			grid-template-columns: 1fr;
		}
	}
</style>
