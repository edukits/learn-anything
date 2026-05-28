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
</script>

<article class={['reward-card', className]} class:equipped={reward.equipped}>
	<div
		class="reward-icon"
		class:is-badge={reward.rewardKind === 'badge'}
		class:is-title={reward.rewardKind === 'title'}
	>
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
		border-radius: var(--radius-md);
		color: #fff;
		display: grid;
		block-size: 40px;
		inline-size: 40px;
		justify-items: center;
		position: relative;
	}

	.reward-icon::after {
		background: linear-gradient(
			to bottom,
			hsl(0 0% 100% / 0.28) 0%,
			hsl(0 0% 100% / 0.06) 44%,
			transparent 50%,
			hsl(0 0% 0% / 0.1) 100%
		);
		border-radius: inherit;
		content: '';
		inset: 0;
		pointer-events: none;
		position: absolute;
	}

	.reward-icon.is-badge {
		background: linear-gradient(
			to bottom,
			hsl(var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) + 10%)),
			hsl(var(--color-accent-h) var(--color-accent-s) var(--color-accent-l)),
			hsl(var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) - 14%))
		);
		border: 1px solid hsl(var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) - 22%));
		box-shadow:
			inset 0 1px 2px hsl(var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) + 24%) / 0.5),
			0 1px 4px hsl(var(--color-accent-h) var(--color-accent-s) var(--color-accent-l) / 0.3);
	}

	.reward-icon.is-title {
		background: linear-gradient(to bottom, hsl(280 80% 62%), hsl(280 80% 50%), hsl(280 80% 38%));
		border: 1px solid hsl(280 80% 30%);
		box-shadow:
			inset 0 1px 2px hsl(280 80% 72% / 0.5),
			0 1px 4px hsl(280 80% 50% / 0.3);
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
