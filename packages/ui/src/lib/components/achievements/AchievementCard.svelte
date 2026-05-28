<script lang="ts">
	import { BadgeCheck, Lock } from '@lucide/svelte';
	import ProgressBar from '../ProgressBar.svelte';
	import { clampPercent, formatUiDate } from './format';
	import { getAchievementCategoryIcon } from './metadata';
	import type { AchievementCardData } from './types';

	let {
		achievement,
		formatDate = formatUiDate,
		class: className = ''
	}: {
		achievement: AchievementCardData;
		formatDate?: (iso: string) => string;
		class?: string;
	} = $props();

	let earned = $derived(Boolean(achievement.earnedAt));
	let progressPercent = $derived(clampPercent(achievement.progressPercent));
	let Icon = $derived(getAchievementCategoryIcon(achievement.category));
</script>

<article class={['achievement-card', className]} class:earned class:locked={!earned}>
	<div class="card-top">
		<div class="achievement-icon" class:earned>
			<Icon size={24} />
		</div>
		{#if earned}
			<span class="earned-badge">
				<BadgeCheck size={14} />
				Earned
			</span>
		{:else}
			<span class="locked-badge" aria-label="Locked">
				<Lock size={13} />
			</span>
		{/if}
	</div>

	<div class="card-body">
		<p class="eyebrow">{achievement.categoryLabel}</p>
		<h3>{achievement.name}</h3>
		<p class="achievement-desc">{achievement.description}</p>
		<div class="achievement-progress">
			<div class="achievement-progress-label">
				<span>{achievement.progressLabel}</span>
				<strong>{progressPercent}%</strong>
			</div>
			<ProgressBar
				value={progressPercent}
				size="sm"
				aria-label={`${achievement.name} progress`}
				disableSparks
			/>
		</div>
	</div>

	<div class="card-footer">
		{#if achievement.rewardLabel}
			<span class="reward-pill" class:earned>
				<Icon size={12} />
				{achievement.rewardLabel}
			</span>
		{/if}
		{#if achievement.earnedAt}
			<time>{formatDate(achievement.earnedAt)}</time>
		{/if}
	</div>
</article>

<style>
	.achievement-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		display: grid;
		gap: 12px;
		padding: 18px;
		transition:
			border-color 0.2s,
			box-shadow 0.2s,
			opacity 0.2s;
	}

	.achievement-card.earned {
		border-color: color-mix(in srgb, var(--color-success), transparent 40%);
	}

	.achievement-card.earned:hover {
		box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-success), transparent 60%);
	}

	.achievement-card.locked {
		opacity: 0.74;
	}

	.achievement-card.locked:hover {
		opacity: 0.82;
	}

	.card-top {
		align-items: center;
		display: flex;
		justify-content: space-between;
	}

	.achievement-icon {
		align-items: center;
		background: linear-gradient(to bottom, hsl(0 0% 92%), hsl(0 0% 84%), hsl(0 0% 78%));
		border: 1px solid hsl(0 0% 68%);
		border-radius: var(--radius-md);
		box-shadow:
			inset 0 1px 2px hsl(0 0% 100% / 0.45),
			inset 0 -1px 1px hsl(0 0% 0% / 0.08),
			0 1px 3px hsl(0 0% 0% / 0.1);
		color: hsl(0 0% 48%);
		display: grid;
		block-size: 44px;
		inline-size: 44px;
		justify-items: center;
		position: relative;
	}

	.achievement-icon::after {
		background: linear-gradient(
			to bottom,
			hsl(0 0% 100% / 0.3) 0%,
			hsl(0 0% 100% / 0.06) 44%,
			transparent 50%,
			hsl(0 0% 0% / 0.08) 100%
		);
		border-radius: inherit;
		content: '';
		inset: 0;
		pointer-events: none;
		position: absolute;
	}

	.achievement-icon.earned {
		background: linear-gradient(
			to bottom,
			hsl(var(--color-success-h) var(--color-success-s) calc(var(--color-success-l) + 12%)),
			hsl(var(--color-success-h) var(--color-success-s) var(--color-success-l)),
			hsl(var(--color-success-h) var(--color-success-s) calc(var(--color-success-l) - 10%))
		);
		border-color: hsl(var(--color-success-h) var(--color-success-s) calc(var(--color-success-l) - 18%));
		box-shadow:
			inset 0 1px 2px hsl(var(--color-success-h) var(--color-success-s) calc(var(--color-success-l) + 26%) / 0.5),
			inset 0 -1px 1px hsl(var(--color-success-h) var(--color-success-s) calc(var(--color-success-l) - 16%) / 0.2),
			0 1px 4px hsl(var(--color-success-h) var(--color-success-s) var(--color-success-l) / 0.3),
			0 0 10px hsl(var(--color-success-h) var(--color-success-s) var(--color-success-l) / 0.12);
		color: #fff;
	}

	.earned-badge {
		align-items: center;
		color: var(--color-success);
		display: flex;
		font-size: 0.78rem;
		font-weight: 750;
		gap: 4px;
	}

	.locked-badge {
		color: var(--color-text-muted);
	}

	.card-body {
		display: grid;
		gap: 4px;
	}

	.card-body h3 {
		font-size: 1rem;
		letter-spacing: 0;
		margin: 0;
	}

	.card-body p {
		margin: 0;
	}

	.eyebrow {
		color: var(--color-text-muted);
		font-size: 0.76rem;
		font-weight: 750;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.achievement-desc {
		color: var(--color-text-muted);
		font-size: 0.9rem;
		line-height: 1.45;
	}

	.achievement-progress {
		display: grid;
		gap: 7px;
		margin-block-start: 8px;
	}

	.achievement-progress-label {
		align-items: baseline;
		display: flex;
		gap: 12px;
		justify-content: space-between;
	}

	.achievement-progress-label span {
		color: var(--color-text-muted);
		font-size: 0.82rem;
		font-weight: 650;
	}

	.achievement-progress-label strong {
		color: var(--color-text);
		font-size: 0.8rem;
	}

	.card-footer {
		align-items: center;
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		min-block-size: 24px;
	}

	.reward-pill {
		align-items: center;
		background: var(--color-surface-raised);
		border: 1px solid var(--color-border);
		border-radius: 999px;
		color: var(--color-text-muted);
		display: inline-flex;
		font-size: 0.75rem;
		font-weight: 700;
		gap: 4px;
		padding: 3px 10px 3px 7px;
	}

	.reward-pill.earned {
		background: color-mix(in srgb, var(--color-accent), transparent 90%);
		border-color: color-mix(in srgb, var(--color-accent), transparent 60%);
		color: var(--color-accent);
	}

	.card-footer time {
		color: var(--color-text-muted);
		font-size: 0.78rem;
		margin-inline-start: auto;
	}
</style>
