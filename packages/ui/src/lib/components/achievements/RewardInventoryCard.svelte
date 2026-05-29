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

	type SparklePoint = {
		id: string;
		x: string;
		y: string;
		size: number;
		duration: string;
		delay: string;
		driftX: string;
		driftY: string;
		opacity: string;
		minOpacity: string;
	};

	const SPARKLE_COUNT = 11;
	const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
	const HEX_CLEAR_RADIUS = 34;
	const SPARKLE_CLEARANCE = 2;
	const SPARKLE_MAX_SCALE = 1.12;
	const SPARKLE_SPREAD_VARIANCE = 52;
	const CARD_ICON_CENTER_Y = 54;

	const hexId = Math.random().toString(36).slice(2, 8);
	const HEX =
		'M17 4.68L27 4.68Q32 4.68 34.5 9.01L39.5 17.67Q42 22 39.5 26.33L34.5 34.99Q32 39.32 27 39.32L17 39.32Q12 39.32 9.5 34.99L4.5 26.33Q2 22 4.5 17.67L9.5 9.01Q12 4.68 17 4.68Z';

	let sparkles = $derived.by(() => createSparkles(reward));

	function createSparkles(reward: RewardInventoryCardData): SparklePoint[] {
		const random = createSeededRandom(
			hashText(`${reward.rewardKey}|${reward.rewardLabel}|${reward.earnedAt}|${reward.rewardKind}`)
		);
		const cardPhase = random();

		return Array.from({ length: SPARKLE_COUNT }, (_, index) => {
			const size = Math.round(7 + random() * 8);
			const angle = index * GOLDEN_ANGLE + random() * 0.75;
			const sparkleRadius = (size * SPARKLE_MAX_SCALE) / 2;
			const minRadius = HEX_CLEAR_RADIUS + sparkleRadius + SPARKLE_CLEARANCE;
			const unconstrainedRadius = minRadius + Math.pow(random(), 0.72) * SPARKLE_SPREAD_VARIANCE;
			const verticalDirection = Math.sin(angle);
			const topRadiusLimit =
				verticalDirection < 0
					? (CARD_ICON_CENTER_Y - sparkleRadius - 2) / Math.abs(verticalDirection)
					: Number.POSITIVE_INFINITY;
			const radius = Math.max(minRadius, Math.min(unconstrainedRadius, topRadiusLimit));
			const x = Math.cos(angle) * radius;
			const y = Math.sin(angle) * radius;
			const duration = 1850 + random() * 1200;
			const delay = -(cardPhase * duration + random() * duration);
			const opacity = 0.46 + random() * 0.34;

			return {
				id: `${reward.rewardKey}-${index}-${Math.round(x * 10)}-${Math.round(y * 10)}`,
				x: `${x.toFixed(1)}px`,
				y: `${y.toFixed(1)}px`,
				size,
				duration: `${Math.round(duration)}ms`,
				delay: `${Math.round(delay)}ms`,
				driftX: `${((random() - 0.5) * 7).toFixed(1)}px`,
				driftY: `${((random() - 0.5) * 7).toFixed(1)}px`,
				opacity: opacity.toFixed(2),
				minOpacity: (opacity * 0.42).toFixed(2)
			};
		});
	}

	function hashText(value: string): number {
		let hash = 2166136261;

		for (let index = 0; index < value.length; index += 1) {
			hash ^= value.charCodeAt(index);
			hash = Math.imul(hash, 16777619);
		}

		return hash >>> 0;
	}

	function createSeededRandom(seed: number) {
		let state = seed || 1;

		return () => {
			state = Math.imul(state, 1664525) + 1013904223;
			return (state >>> 0) / 4294967296;
		};
	}
</script>

<article
	class={['reward-card', `kind-${reward.rewardKind}`, className]}
	class:equipped={reward.equipped}
>
	<div class="reward-icon">
		<div class="sparkle-field" aria-hidden="true">
			{#each sparkles as sparkle (sparkle.id)}
				<span
					class="sparkle"
					style:--sparkle-x={sparkle.x}
					style:--sparkle-y={sparkle.y}
					style:--sparkle-duration={sparkle.duration}
					style:--sparkle-delay={sparkle.delay}
					style:--sparkle-drift-x={sparkle.driftX}
					style:--sparkle-drift-y={sparkle.driftY}
					style:--sparkle-opacity={sparkle.opacity}
					style:--sparkle-min-opacity={sparkle.minOpacity}
				>
					<Sparkle size={sparkle.size} fill="currentColor" stroke="none" />
				</span>
			{/each}
		</div>
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
		overflow: hidden;
		padding: 22px 18px 20px;
		position: relative;
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
		isolation: isolate;
		justify-items: center;
		position: relative;
	}

	.hex-bg {
		block-size: 100%;
		inline-size: 100%;
		inset: 0;
		overflow: visible;
		position: absolute;
		z-index: 1;
	}

	.hex-outline {
		fill: none;
		stroke: hsl(var(--tint-h) var(--tint-s) calc(var(--tint-l) + 26%) / 0.6);
		stroke-width: 1.2;
	}

	.reward-icon :global(svg ~ svg) {
		position: relative;
		z-index: 2;
	}

	.sparkle-field {
		block-size: 196px;
		inline-size: 196px;
		inset-block-start: 50%;
		inset-inline-start: 50%;
		pointer-events: none;
		position: absolute;
		transform: translate(-50%, -50%);
		z-index: 0;
	}

	.sparkle {
		color: hsl(var(--tint-h) var(--tint-s) calc(var(--tint-l) + 8%) / 0.55);
		display: grid;
		inset-block-start: 50%;
		inset-inline-start: 50%;
		place-items: center;
		position: absolute;
		transform: translate(calc(-50% + var(--sparkle-x)), calc(-50% + var(--sparkle-y)))
			scale(0.82);
		transform-origin: center;
		z-index: 1;
		animation: sparkle var(--sparkle-duration) ease-in-out var(--sparkle-delay) infinite;
	}

	.sparkle :global(svg) {
		fill: currentColor;
		stroke: none;
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
			opacity: var(--sparkle-min-opacity);
			transform: translate(calc(-50% + var(--sparkle-x)), calc(-50% + var(--sparkle-y)))
				scale(0.72);
		}
		50% {
			opacity: var(--sparkle-opacity);
			transform: translate(
					calc(-50% + var(--sparkle-x) + var(--sparkle-drift-x)),
					calc(-50% + var(--sparkle-y) + var(--sparkle-drift-y))
				)
				scale(1.12);
		}
	}
</style>
