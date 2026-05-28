<script lang="ts">
	import type { Snippet } from 'svelte';
	import Button from '../Button.svelte';
	import { formatUiDate } from './format';
	import { getRewardKindIcon, getRewardKindLabel } from './metadata';
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

	let RewardIcon = $derived(getRewardKindIcon(reward.rewardKind));
	let rewardKindLabel = $derived(getRewardKindLabel(reward.rewardKind));
	let nextRewardKey = $derived(reward.equipped ? null : reward.rewardKey);

	const hexId = Math.random().toString(36).slice(2, 8);
	const HEX = 'M16.4 3.5Q19 2 21.6 3.5L33.72 10.5Q36.32 12 36.32 15L36.32 29Q36.32 32 33.72 33.5L21.6 40.5Q19 42 16.4 40.5L4.28 33.5Q1.68 32 1.68 29L1.68 15Q1.68 12 4.28 10.5Z';
</script>

<article class={['reward-card', className]} class:equipped={reward.equipped}>
	<div
		class="reward-icon"
		class:is-badge={reward.rewardKind === 'badge'}
		class:is-title={reward.rewardKind === 'title'}
	>
		<svg class="hex-bg" viewBox="0 0 38 44" aria-hidden="true">
			<defs>
				<linearGradient id="hfill-{hexId}" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stop-color="var(--hex-c1)" />
					<stop offset="50%" stop-color="var(--hex-c2)" />
					<stop offset="100%" stop-color="var(--hex-c3)" />
				</linearGradient>
				<linearGradient id="hshade-{hexId}" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stop-color="white" stop-opacity="0.28" />
					<stop offset="44%" stop-color="white" stop-opacity="0.06" />
					<stop offset="50%" stop-color="white" stop-opacity="0" />
					<stop offset="100%" stop-color="black" stop-opacity="0.1" />
				</linearGradient>
				<linearGradient id="hinset-{hexId}" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stop-color="white" stop-opacity="0.5" />
					<stop offset="35%" stop-color="white" stop-opacity="0" />
				</linearGradient>
			</defs>
			<path
				class="hex-outline"
				d={HEX}
				transform="translate(19 22) scale(1.12) translate(-19 -22)"
			/>
			<path d={HEX} fill="url(#hfill-{hexId})" stroke="var(--hex-stroke)" stroke-width="1" />
			<path d={HEX} fill="url(#hshade-{hexId})" />
			<path d={HEX} fill="url(#hinset-{hexId})" />
		</svg>
		<RewardIcon size={22} />
	</div>
	<div class="reward-details">
		<strong>{reward.rewardLabel}</strong>
		<span class="reward-meta">
			{rewardKindLabel}
			{#if reward.equipped}
				<span class="equipped-pill">Equipped</span>
			{/if}
		</span>
	</div>
	<time class="reward-date">{formatDate(reward.earnedAt)}</time>
	<div class="reward-action">
		{#if reward.rewardKind === 'title'}
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
			{:else}
				<span class="collection-note">Title reward</span>
			{/if}
		{:else}
			<span class="collection-note">Collection only</span>
		{/if}
	</div>
</article>

<style>
	.reward-card {
		align-items: center;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 14px 16px;
		transition: border-color 0.15s;
	}

	.reward-card.equipped {
		border-color: var(--color-star);
		box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-star), transparent 70%);
	}

	.reward-icon {
		align-items: center;
		color: #fff;
		display: grid;
		block-size: 50px;
		inline-size: 100%;
		justify-items: center;
		position: relative;
	}

	.hex-bg {
		block-size: 100%;
		inline-size: 100%;
		inset: 0;
		position: absolute;
		overflow: visible;
	}

	.hex-outline {
		fill: none;
		stroke: color-mix(in srgb, var(--hex-c1), white 55%);
		stroke-width: 1.4;
	}

	.reward-icon :global(svg ~ *) {
		position: relative;
	}

	.reward-icon.is-badge {
		--hex-c1: hsl(var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) + 10%));
		--hex-c2: hsl(var(--color-accent-h) var(--color-accent-s) var(--color-accent-l));
		--hex-c3: hsl(var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) - 14%));
		--hex-stroke: hsl(var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) - 22%));
		filter:
			drop-shadow(0 1px 4px hsl(var(--color-accent-h) var(--color-accent-s) var(--color-accent-l) / 0.3));
	}

	.reward-icon.is-title {
		--hex-c1: hsl(280 80% 62%);
		--hex-c2: hsl(280 80% 50%);
		--hex-c3: hsl(280 80% 38%);
		--hex-stroke: hsl(280 80% 30%);
		filter:
			drop-shadow(0 1px 4px hsl(280 80% 50% / 0.3));
	}

	.reward-details {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		min-inline-size: 0;
	}

	.reward-details strong {
		font-size: 0.94rem;
	}

	.reward-meta {
		align-items: center;
		color: var(--color-text-muted);
		display: flex;
		font-size: 0.8rem;
		font-weight: 600;
		gap: 6px;
	}

	.equipped-pill {
		background: color-mix(in srgb, var(--color-star), transparent 85%);
		border-radius: 999px;
		color: hsl(var(--color-star-h) var(--color-star-s) 38%);
		font-size: 0.7rem;
		font-weight: 750;
		padding: 2px 8px;
		text-transform: uppercase;
	}

	.reward-date {
		color: var(--color-text-muted);
		font-size: 0.78rem;
		white-space: nowrap;
	}

	.reward-action {
		justify-self: end;
	}

	.reward-action :global(form) {
		margin: 0;
	}

	.collection-note {
		color: var(--color-text-muted);
		font-size: 0.76rem;
		font-weight: 700;
		white-space: nowrap;
	}

	@media (max-width: 520px) {
		.reward-card {
			grid-template-columns: auto 1fr;
		}

		.reward-date,
		.reward-action {
			grid-column: 2;
			justify-self: start;
		}
	}
</style>
