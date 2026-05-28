<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Sparkle } from '@lucide/svelte';
	import Button from '../Button.svelte';
	import { formatUiDate } from './format';
	import { getAchievementCategoryIcon, getRewardKindLabel } from './metadata';
	import type { RewardInventoryCardData } from './types';

	let {
		reward,
		formatDate = formatUiDate,
		action,
		onEquip,
		class: className = ''
	}: {
		reward: RewardInventoryCardData;
		formatDate?: (iso: string) => string;
		action?: Snippet<[RewardInventoryCardData, string | null]>;
		onEquip?: (reward: RewardInventoryCardData, nextRewardKey: string | null) => void;
		class?: string;
	} = $props();

	let RewardIcon = $derived(getAchievementCategoryIcon(reward.achievementCategory));
	let rewardKindLabel = $derived(getRewardKindLabel(reward.rewardKind));
	let nextRewardKey = $derived(reward.equipped ? null : reward.rewardKey);
	let showEquip = $derived(reward.rewardKind === 'title' && (Boolean(action) || Boolean(onEquip)));

	const hexId = Math.random().toString(36).slice(2, 8);
	const HEX =
		'M17 4.68L27 4.68Q32 4.68 34.5 9.01L39.5 17.67Q42 22 39.5 26.33L34.5 34.99Q32 39.32 27 39.32L17 39.32Q12 39.32 9.5 34.99L4.5 26.33Q2 22 4.5 17.67L9.5 9.01Q12 4.68 17 4.68Z';
</script>

<article
	class={['reward-card', `kind-${reward.rewardKind}`, className]}
	class:equipped={reward.equipped}
>
	<div class="reward-icon">
		<span class="sparkle sparkle-1" aria-hidden="true"><Sparkle size={14} fill="currentColor" stroke="none" /></span>
		<span class="sparkle sparkle-2" aria-hidden="true"><Sparkle size={10} fill="currentColor" stroke="none" /></span>
		<span class="sparkle sparkle-3" aria-hidden="true"><Sparkle size={12} fill="currentColor" stroke="none" /></span>
		<svg class="hex-bg" viewBox="0 0 44 44" aria-hidden="true">
			<defs>
				<linearGradient id="hfill-{hexId}" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stop-color="var(--hex-c1)" />
					<stop offset="50%" stop-color="var(--hex-c2)" />
					<stop offset="100%" stop-color="var(--hex-c3)" />
				</linearGradient>
				<linearGradient id="hshade-{hexId}" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stop-color="white" stop-opacity="0.32" />
					<stop offset="44%" stop-color="white" stop-opacity="0.07" />
					<stop offset="50%" stop-color="white" stop-opacity="0" />
					<stop offset="100%" stop-color="black" stop-opacity="0.12" />
				</linearGradient>
				<linearGradient id="hinset-{hexId}" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stop-color="white" stop-opacity="0.55" />
					<stop offset="35%" stop-color="white" stop-opacity="0" />
				</linearGradient>
			</defs>
			<path
				class="hex-outline"
				d={HEX}
				transform="translate(22 22) scale(1.1) translate(-22 -22)"
			/>
			<path d={HEX} fill="url(#hfill-{hexId})" stroke="var(--hex-stroke)" stroke-width="1" />
			<path d={HEX} fill="url(#hshade-{hexId})" />
			<path d={HEX} fill="url(#hinset-{hexId})" />
		</svg>
		<RewardIcon size={26} />
	</div>

	<strong class="reward-name">{reward.rewardLabel}</strong>

	<span class="reward-pill">
		{rewardKindLabel}
		{#if reward.equipped}
			<span class="equipped-dot" aria-hidden="true"></span>
			Equipped
		{/if}
	</span>

	<time class="reward-date">Earned {formatDate(reward.earnedAt)}</time>

	{#if showEquip}
		<div class="reward-action">
			{#if action}
				{@render action(reward, nextRewardKey)}
			{:else if onEquip}
				<Button
					type="button"
					size="sm"
					variant={reward.equipped ? 'ghost' : 'secondary'}
					label={reward.equipped ? 'Unequip' : 'Equip'}
					onclick={() => onEquip?.(reward, nextRewardKey)}
				/>
			{/if}
		</div>
	{/if}
</article>

<style>
	.reward-card {
		--tint-h: var(--color-accent-h);
		--tint-s: var(--color-accent-s);
		--tint-l: var(--color-accent-l);
		align-items: center;
		background:
			radial-gradient(
				120% 80% at 50% -10%,
				hsl(var(--tint-h) var(--tint-s) var(--tint-l) / 0.1),
				transparent 60%
			),
			var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 22px 18px 20px;
		text-align: center;
		transition:
			border-color 0.15s,
			box-shadow 0.15s;
	}

	.reward-card.equipped {
		border-color: hsl(var(--tint-h) var(--tint-s) var(--tint-l) / 0.45);
		box-shadow: 0 0 0 1px hsl(var(--tint-h) var(--tint-s) var(--tint-l) / 0.2);
	}

	.reward-icon {
		align-items: center;
		block-size: 64px;
		color: #fff;
		display: grid;
		inline-size: 64px;
		justify-items: center;
		position: relative;
	}

	.hex-bg {
		block-size: 100%;
		inline-size: 100%;
		inset: 0;
		overflow: visible;
		position: absolute;
	}

	.hex-outline {
		fill: none;
		stroke: hsl(var(--tint-h) var(--tint-s) calc(var(--tint-l) + 26%) / 0.6);
		stroke-width: 1.2;
	}

	.reward-icon :global(svg ~ svg) {
		position: relative;
	}

	.sparkle {
		color: hsl(var(--tint-h) var(--tint-s) calc(var(--tint-l) + 8%) / 0.55);
		position: absolute;
		z-index: 1;
		animation: sparkle 2200ms ease-in-out infinite;
	}

	.sparkle :global(svg) {
		fill: currentColor;
		stroke: none;
	}

	.sparkle-1 {
		inset-block-start: -4px;
		inset-inline-end: -10px;
	}

	.sparkle-2 {
		inset-block-end: -2px;
		inset-inline-start: -10px;
		animation-delay: 500ms;
	}

	.sparkle-3 {
		inset-block-start: 24px;
		inset-inline-end: -14px;
		animation-delay: 1000ms;
	}

	.reward-card.kind-badge {
		--tint-h: var(--color-accent-h);
		--tint-s: var(--color-accent-s);
		--tint-l: var(--color-accent-l);
	}

	.reward-card.kind-badge .reward-icon {
		--hex-c1: hsl(var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) + 10%));
		--hex-c2: hsl(var(--color-accent-h) var(--color-accent-s) var(--color-accent-l));
		--hex-c3: hsl(var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) - 14%));
		--hex-stroke: hsl(var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) - 22%));
		filter: drop-shadow(
			0 3px 8px hsl(var(--color-accent-h) var(--color-accent-s) var(--color-accent-l) / 0.32)
		);
	}

	.reward-card.kind-title {
		--tint-h: 280;
		--tint-s: 80%;
		--tint-l: 50%;
	}

	.reward-card.kind-title .reward-icon {
		--hex-c1: hsl(280 80% 62%);
		--hex-c2: hsl(280 80% 50%);
		--hex-c3: hsl(280 80% 38%);
		--hex-stroke: hsl(280 80% 30%);
		filter: drop-shadow(0 3px 8px hsl(280 80% 50% / 0.32));
	}

	.reward-name {
		font-size: 1.05rem;
		font-weight: 750;
		letter-spacing: -0.01em;
		line-height: 1.2;
	}

	.reward-pill {
		align-items: center;
		background: hsl(var(--tint-h) var(--tint-s) var(--tint-l) / 0.12);
		border: 1px solid hsl(var(--tint-h) var(--tint-s) var(--tint-l) / 0.22);
		border-radius: 999px;
		color: hsl(var(--tint-h) var(--tint-s) calc(var(--tint-l) - 8%));
		display: inline-flex;
		font-size: 0.78rem;
		font-weight: 700;
		gap: 6px;
		padding: 3px 12px;
	}

	.equipped-dot {
		background: currentColor;
		block-size: 5px;
		border-radius: 50%;
		inline-size: 5px;
	}

	.reward-date {
		color: var(--color-text-muted);
		font-size: 0.82rem;
	}

	.reward-action {
		margin-block-start: 4px;
	}

	.reward-action :global(form) {
		margin: 0;
	}

	@media (prefers-reduced-motion: reduce) {
		.sparkle {
			animation: none;
		}
	}

	@keyframes sparkle {
		0%,
		100% {
			opacity: 0.5;
			transform: scale(0.85);
		}
		50% {
			opacity: 1;
			transform: scale(1.1);
		}
	}
</style>
