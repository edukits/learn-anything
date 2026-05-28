<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Dialog } from 'bits-ui';
	import { ChevronLeft, ChevronRight, Sparkles } from '@lucide/svelte';
	import Button from '../Button.svelte';
	import { getAchievementCategoryIcon, getRewardKindLabel } from './metadata';
	import type { AchievementCelebrationItem } from './types';

	let {
		open = $bindable(false),
		achievements = [],
		continueLabel = 'Continue learning',
		dismissAction,
		onDismiss,
		class: className = ''
	}: {
		open?: boolean;
		achievements?: AchievementCelebrationItem[];
		continueLabel?: string;
		dismissAction?: Snippet<[AchievementCelebrationItem[]]>;
		onDismiss?: (achievements: AchievementCelebrationItem[]) => void;
		class?: string;
	} = $props();

	let pageState = $state({ signature: '', index: 0 });

	let achievementsSignature = $derived(achievements.map((achievement) => achievement.eventId).join('|'));
	let pageCount = $derived(achievements.length);
	let currentIndex = $derived(
		pageState.signature === achievementsSignature ? Math.min(pageState.index, Math.max(pageCount - 1, 0)) : 0
	);
	let current = $derived(achievements[currentIndex] ?? null);
	let isFirst = $derived(currentIndex === 0);
	let isLast = $derived(currentIndex >= pageCount - 1);
	let RewardIcon = $derived(current ? getAchievementCategoryIcon(current.category) : Sparkles);
	let rewardKindLabel = $derived(current ? getRewardKindLabel(current.rewardKind) : 'Achievement');

	function getOpen() {
		return open && pageCount > 0;
	}

	function setOpen(nextOpen: boolean) {
		if (nextOpen || pageCount === 0) {
			if (nextOpen && !open) {
				pageState = { signature: achievementsSignature, index: 0 };
			}
			open = nextOpen;
		}
	}

	function setPageIndex(index: number) {
		pageState = { signature: achievementsSignature, index };
	}

	function previous() {
		setPageIndex(Math.max(0, currentIndex - 1));
	}

	function next() {
		setPageIndex(Math.min(pageCount - 1, currentIndex + 1));
	}

	function dismiss() {
		if (onDismiss) {
			onDismiss(achievements);
		} else {
			open = false;
		}
	}
</script>

{#if pageCount > 0 && current}
	<Dialog.Root bind:open={getOpen, setOpen}>
		<Dialog.Portal>
			<Dialog.Overlay class="achievement-dialog-overlay" />
			<Dialog.Content class={['achievement-dialog', className]}>
				<div class="dialog-sparkles" aria-hidden="true">
					<Sparkles size={18} />
					<Sparkles size={14} />
					<Sparkles size={16} />
				</div>
				<div class="medallion" data-kind={current.rewardKind ?? 'achievement'}>
					<RewardIcon size={44} />
				</div>

				<div class="dialog-copy">
					<p class="eyebrow">Achievement unlocked</p>
					<Dialog.Title class="achievement-dialog-title">{current.name}</Dialog.Title>
					<Dialog.Description class="achievement-dialog-description">
						{current.description}
					</Dialog.Description>
				</div>

				{#if current.rewardLabel}
					<div class="reward-reveal">
						<span>{rewardKindLabel} reward</span>
						<strong>{current.rewardLabel}</strong>
					</div>
				{/if}

				<div class="pager">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						label="Previous"
						disabled={isFirst}
						onclick={previous}
					>
						<ChevronLeft size={16} />
						Previous
					</Button>
					<span>{currentIndex + 1} / {pageCount}</span>
					{#if isLast}
						{#if dismissAction}
							{@render dismissAction(achievements)}
						{:else}
							<Button type="button" size="sm" label={continueLabel} onclick={dismiss} />
						{/if}
					{:else}
						<Button type="button" size="sm" label="Next" onclick={next}>
							Next
							<ChevronRight size={16} />
						</Button>
					{/if}
				</div>
			</Dialog.Content>
		</Dialog.Portal>
	</Dialog.Root>
{/if}

<style>
	:global(.achievement-dialog-overlay) {
		animation: overlay-in 180ms ease-out;
		background: hsl(0 0% 0% / 0.46);
		inset: 0;
		position: fixed;
		z-index: 80;
	}

	:global(.achievement-dialog) {
		animation: dialog-in 260ms cubic-bezier(0.22, 1, 0.36, 1);
		background:
			linear-gradient(135deg, hsl(0 0% 100% / 0.86), transparent 32%),
			var(--color-surface);
		border: 1px solid color-mix(in srgb, var(--color-star), var(--color-border) 45%);
		border-radius: var(--radius-md);
		box-shadow:
			0 24px 70px hsl(0 0% 0% / 0.24),
			0 0 0 1px hsl(0 0% 100% / 0.32) inset;
		display: grid;
		gap: 18px;
		inline-size: min(92vw, 460px);
		left: 50%;
		overflow: hidden;
		padding: 28px;
		position: fixed;
		text-align: center;
		top: 50%;
		transform: translate(-50%, -50%);
		z-index: 81;
	}

	:global(.achievement-dialog)::before {
		background:
			radial-gradient(circle at 18% 18%, hsl(var(--color-star-h) 90% 64% / 0.2), transparent 34%),
			radial-gradient(circle at 86% 12%, hsl(var(--color-accent-h) 82% 62% / 0.15), transparent 30%);
		content: '';
		inset: 0;
		pointer-events: none;
		position: absolute;
	}

	.dialog-sparkles {
		align-items: center;
		color: hsl(var(--color-star-h) var(--color-star-s) 46%);
		display: flex;
		gap: 20px;
		justify-content: center;
		min-block-size: 18px;
		position: relative;
		z-index: 1;
	}

	.dialog-sparkles :global(svg) {
		animation: sparkle 1400ms ease-in-out infinite;
	}

	.dialog-sparkles :global(svg:nth-child(2)) {
		animation-delay: 180ms;
	}

	.dialog-sparkles :global(svg:nth-child(3)) {
		animation-delay: 360ms;
	}

	.medallion {
		align-items: center;
		animation: medallion-in 420ms cubic-bezier(0.22, 1, 0.36, 1);
		aspect-ratio: 1;
		background: linear-gradient(to bottom, hsl(42 96% 64%), hsl(39 95% 48%), hsl(36 92% 38%));
		border: 1px solid hsl(38 90% 34%);
		border-radius: 50%;
		box-shadow:
			inset 0 2px 4px hsl(0 0% 100% / 0.5),
			inset 0 -2px 3px hsl(0 0% 0% / 0.14),
			0 12px 28px hsl(39 95% 48% / 0.32);
		color: #fff;
		display: grid;
		inline-size: 92px;
		justify-self: center;
		justify-items: center;
		position: relative;
		z-index: 1;
	}

	.medallion[data-kind='title'] {
		background: linear-gradient(to bottom, hsl(280 80% 65%), hsl(280 78% 50%), hsl(280 76% 38%));
		border-color: hsl(280 76% 30%);
		box-shadow:
			inset 0 2px 4px hsl(0 0% 100% / 0.42),
			0 12px 28px hsl(280 78% 50% / 0.28);
	}

	.dialog-copy {
		display: grid;
		gap: 6px;
		position: relative;
		z-index: 1;
	}

	.eyebrow {
		color: hsl(var(--color-star-h) var(--color-star-s) 36%);
		font-size: 0.76rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		margin: 0;
		text-transform: uppercase;
	}

	:global(.achievement-dialog-title) {
		font-size: clamp(1.55rem, 5vw, 2.1rem);
		letter-spacing: 0;
		line-height: 1.02;
		margin: 0;
	}

	:global(.achievement-dialog-description) {
		color: var(--color-text-muted);
		line-height: 1.45;
		margin: 0;
	}

	.reward-reveal {
		animation: reward-in 320ms ease-out 140ms both;
		background: color-mix(in srgb, var(--color-star), transparent 88%);
		border: 1px solid color-mix(in srgb, var(--color-star), transparent 58%);
		border-radius: var(--radius-md);
		display: grid;
		gap: 3px;
		padding: 12px;
		position: relative;
		z-index: 1;
	}

	.reward-reveal span {
		color: hsl(var(--color-star-h) var(--color-star-s) 34%);
		font-size: 0.74rem;
		font-weight: 800;
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}

	.reward-reveal strong {
		font-size: 1.05rem;
	}

	.pager {
		align-items: center;
		display: grid;
		gap: 12px;
		grid-template-columns: 1fr auto 1fr;
		position: relative;
		z-index: 1;
	}

	.pager > :last-child {
		justify-self: end;
	}

	.pager span {
		color: var(--color-text-muted);
		font-size: 0.82rem;
		font-weight: 750;
		white-space: nowrap;
	}

	@keyframes overlay-in {
		from {
			opacity: 0;
		}
	}

	@keyframes dialog-in {
		from {
			opacity: 0;
			transform: translate(-50%, calc(-50% + 16px)) scale(0.97);
		}
	}

	@keyframes medallion-in {
		from {
			opacity: 0;
			transform: translateY(10px) scale(0.8) rotate(-8deg);
		}
	}

	@keyframes reward-in {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
	}

	@keyframes sparkle {
		0%,
		100% {
			opacity: 0.55;
			transform: translateY(0) scale(0.9);
		}
		50% {
			opacity: 1;
			transform: translateY(-3px) scale(1.05);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		:global(.achievement-dialog-overlay),
		:global(.achievement-dialog),
		.medallion,
		.reward-reveal,
		.dialog-sparkles :global(svg) {
			animation: none;
		}
	}

	@media (max-width: 520px) {
		:global(.achievement-dialog) {
			padding: 22px;
		}

		.pager {
			grid-template-columns: 1fr;
			justify-items: stretch;
		}

		.pager > :last-child {
			justify-self: stretch;
		}
	}
</style>
