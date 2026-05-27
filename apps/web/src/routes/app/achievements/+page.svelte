<script lang="ts">
	import type { PageProps } from './$types';
	import {
		AchievementCard,
		Button,
		formatAchievementCategoryLabel,
		RewardInventoryCard,
		Tabs,
		type RewardInventoryCardData,
		type TabItem
	} from '@learn-anything/ui';
	import { Medal, Trophy } from '@lucide/svelte';
	import {
		toAchievementCardData,
		toRewardInventoryCardData
	} from '$lib/features/engagement/achievement-ui';

	let { data, form }: PageProps = $props();

	let earnedAchievements = $derived(
		data.achievements.filter((achievement) => achievement.earned_at)
	);
	let lockedAchievements = $derived(
		data.achievements.filter((achievement) => !achievement.earned_at)
	);
	let earnedPercent = $derived(
		data.achievements.length === 0
			? 0
			: Math.round((earnedAchievements.length / data.achievements.length) * 100)
	);
	let categories = $derived([
		...new Set(data.achievements.map((achievement) => achievement.category))
	]);
	let activeCategory = $state<string | null>(null);
	let categoryTabs = $derived.by((): TabItem[] => [
		{ value: null, label: 'All' },
		...categories.map((category) => ({
			value: category,
			label: formatAchievementCategoryLabel(category)
		}))
	]);
	let filteredAchievements = $derived(
		activeCategory
			? data.achievements.filter((achievement) => achievement.category === activeCategory)
			: data.achievements
	);
</script>

<main class="page achievements-page">
	{#snippet titleRewardAction(reward: RewardInventoryCardData, nextRewardKey: string | null)}
		<form method="POST" action="?/equipTitle" class="reward-action-form">
			<input type="hidden" name="rewardKey" value={nextRewardKey ?? ''} />
			<Button
				type="submit"
				size="sm"
				variant={reward.equipped ? 'ghost' : 'secondary'}
				label={reward.equipped ? 'Unequip' : 'Equip'}
			/>
		</form>
	{/snippet}

	<section class="hero">
		<div class="hero-visual">
			<div class="hero-icon">
				<div class="hero-icon-sheen" aria-hidden="true"></div>
				<Medal size={36} />
			</div>
			<div class="hero-ring" aria-hidden="true">
				<svg viewBox="0 0 120 120">
					<defs>
						<linearGradient id="track-grad" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stop-color="hsl(0 0% 0% / 0.12)" />
							<stop offset="100%" stop-color="hsl(0 0% 100% / 0.06)" />
						</linearGradient>
						<linearGradient id="fill-grad" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stop-color="hsl(41 100% 55%)" />
							<stop offset="50%" stop-color="hsl(41 100% 50%)" />
							<stop offset="100%" stop-color="hsl(41 100% 38%)" />
						</linearGradient>
						<linearGradient id="sheen-grad" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stop-color="hsl(0 0% 100% / 0.45)" />
							<stop offset="40%" stop-color="hsl(0 0% 100% / 0.08)" />
							<stop offset="50%" stop-color="transparent" />
							<stop offset="100%" stop-color="hsl(0 0% 0% / 0.12)" />
						</linearGradient>
					</defs>
					<circle cx="60" cy="60" r="54" class="ring-track" />
					<circle cx="60" cy="60" r="54" class="ring-inset" />
					<circle
						cx="60"
						cy="60"
						r="54"
						class="progress-arc"
						stroke-dasharray={`${earnedPercent * 3.39} ${339 - earnedPercent * 3.39}`}
					/>
					<circle cx="60" cy="60" r="54" class="ring-sheen" />
				</svg>
			</div>
		</div>
		<div class="hero-text">
			<p class="eyebrow">Achievements &amp; Rewards</p>
			<h1>Your collection</h1>
			<p class="hero-subtitle">Track milestones, earn badges, and unlock titles as you learn.</p>
		</div>
		<div class="hero-stats">
			<div class="stat">
				<strong>{earnedAchievements.length}</strong>
				<span>Earned</span>
			</div>
			<div class="stat-divider" aria-hidden="true"></div>
			<div class="stat">
				<strong>{lockedAchievements.length}</strong>
				<span>Remaining</span>
			</div>
			<div class="stat-divider" aria-hidden="true"></div>
			<div class="stat">
				<strong>{data.rewards.length}</strong>
				<span>Rewards</span>
			</div>
		</div>
	</section>

	{#if data.rewards.length}
		<section class="inventory-section" aria-label="Reward inventory">
			<div class="section-header">
				<h2>Your rewards</h2>
				<p>Badges and titles you've unlocked</p>
			</div>
			<div class="inventory-grid">
				{#each data.rewards as reward (reward.id)}
					<RewardInventoryCard
						reward={toRewardInventoryCardData(reward)}
						action={titleRewardAction}
					/>
				{/each}
			</div>
			{#if form?.equipError}
				<p class="message error">{form.equipError}</p>
			{/if}
		</section>
	{/if}

	<section class="achievements-section" aria-label="Achievements">
		<div class="section-header">
			<h2>All achievements</h2>
			<p>{earnedAchievements.length} of {data.achievements.length} unlocked</p>
		</div>

		{#if categories.length > 1}
			<Tabs items={categoryTabs} bind:value={activeCategory} ariaLabel="Filter by category" />
		{/if}

		<div class="achievement-grid">
			{#each filteredAchievements as achievement (achievement.key)}
				<AchievementCard achievement={toAchievementCardData(achievement)} />
			{/each}
		</div>
	</section>

	{#if !data.achievements.length}
		<section class="empty-state">
			<Trophy size={48} />
			<h2>No achievements yet</h2>
			<p>Start learning to unlock your first achievements and earn rewards.</p>
		</section>
	{/if}
</main>

<style>
	.achievements-page {
		display: grid;
		gap: 28px;
	}

	.reward-action-form {
		margin: 0;
	}

	.hero {
		align-items: center;
		border-bottom: 1px dashed var(--color-border);
		display: grid;
		gap: 50px;
		grid-template-columns: auto 1fr auto;
		padding: clamp(24px, 4vw, 40px) 0;
	}

	.hero-visual {
		block-size: 96px;
		inline-size: 96px;
		position: relative;
	}

	.hero-visual::before {
		background: radial-gradient(
			circle,
			hsl(var(--color-star-h) var(--color-star-s) var(--color-star-l) / 0.1) 40%,
			hsl(var(--color-star-h) var(--color-star-s) var(--color-star-l) / 0.04) 70%,
			transparent 100%
		);
		border-radius: 50%;
		box-shadow: inset 0 0 12px
			hsl(var(--color-star-h) var(--color-star-s) var(--color-star-l) / 0.08);
		content: '';
		inset: -10px;
		position: absolute;
	}

	.hero-icon {
		align-items: center;
		background: linear-gradient(
			to bottom,
			hsl(var(--color-star-h) var(--color-star-s) calc(var(--color-star-l) + 14%)),
			hsl(var(--color-star-h) var(--color-star-s) var(--color-star-l)),
			hsl(var(--color-star-h) var(--color-star-s) calc(var(--color-star-l) - 12%))
		);
		border: 1px solid hsl(var(--color-star-h) var(--color-star-s) calc(var(--color-star-l) - 18%));
		border-radius: 50%;
		box-shadow:
			inset 0 2px 3px
				hsl(var(--color-star-h) var(--color-star-s) calc(var(--color-star-l) + 28%) / 0.55),
			inset 0 -1px 2px
				hsl(var(--color-star-h) var(--color-star-s) calc(var(--color-star-l) - 20%) / 0.3),
			0 2px 8px hsl(var(--color-star-h) var(--color-star-s) var(--color-star-l) / 0.4),
			0 0 20px hsl(var(--color-star-h) var(--color-star-s) var(--color-star-l) / 0.22);
		color: #fff;
		display: grid;
		block-size: 100%;
		inline-size: 100%;
		justify-items: center;
		position: relative;
		z-index: 1;
	}

	.hero-icon-sheen {
		background: linear-gradient(
			to bottom,
			hsl(0 0% 100% / 0.32) 0%,
			hsl(0 0% 100% / 0.08) 42%,
			transparent 50%,
			hsl(0 0% 0% / 0.1) 100%
		);
		border-radius: inherit;
		inset: 0;
		pointer-events: none;
		position: absolute;
		z-index: 2;
	}

	.hero-ring {
		inset: -8px;
		position: absolute;
	}

	.hero-ring svg {
		block-size: 100%;
		inline-size: 100%;
		transform: rotate(-90deg);
	}

	.ring-track,
	.ring-inset,
	.progress-arc,
	.ring-sheen {
		fill: none;
		stroke-width: 10;
	}

	.ring-track {
		filter: drop-shadow(0 1px 1px hsl(0 0% 0% / 0.12));
		stroke: url(#track-grad);
	}

	.ring-inset {
		stroke: hsl(0 0% 0% / 0.08);
	}

	.progress-arc {
		stroke: url(#fill-grad);
		stroke-linecap: round;
		transition: stroke-dasharray 0.6s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.ring-sheen {
		pointer-events: none;
		stroke: url(#sheen-grad);
	}

	.hero-text {
		display: grid;
		gap: 4px;
	}

	.hero h1 {
		font-size: clamp(1.8rem, 4vw, 2.6rem);
		letter-spacing: 0;
		line-height: 1;
		margin: 0;
	}

	.hero p {
		margin: 0;
	}

	.hero-subtitle {
		color: var(--color-text-muted);
		max-inline-size: 38ch;
	}

	.hero-stats {
		align-items: center;
		display: flex;
		gap: 20px;
	}

	.stat {
		display: grid;
		gap: 2px;
		text-align: center;
	}

	.stat strong {
		font-size: 1.8rem;
		line-height: 1;
	}

	.stat span {
		color: var(--color-text-muted);
		font-size: 0.78rem;
		font-weight: 700;
		text-transform: uppercase;
	}

	.stat-divider {
		background: var(--color-border);
		block-size: 32px;
		inline-size: 1px;
	}

	.section-header {
		display: grid;
		gap: 2px;
	}

	.section-header h2 {
		font-size: 1.25rem;
		letter-spacing: 0;
		margin: 0;
	}

	.section-header p {
		color: var(--color-text-muted);
		margin: 0;
	}

	.inventory-section,
	.achievements-section {
		display: grid;
		gap: 16px;
	}

	.inventory-grid {
		display: grid;
		gap: 10px;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
	}

	.achievement-grid {
		display: grid;
		gap: 12px;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
	}

	.message {
		border-radius: var(--radius-sm);
		font-size: 0.88rem;
		font-weight: 650;
		margin: 0;
		padding: 10px 12px;
	}

	.message.error {
		background: color-mix(in srgb, var(--color-danger), transparent 88%);
		color: var(--color-danger);
	}

	.empty-state {
		align-items: center;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		color: var(--color-text-muted);
		display: grid;
		gap: 12px;
		justify-items: center;
		padding: 60px 32px;
		text-align: center;
	}

	.empty-state h2 {
		color: var(--color-text);
		margin: 0;
	}

	.empty-state p {
		margin: 0;
		max-inline-size: 36ch;
	}

	@media (max-width: 840px) {
		.hero {
			grid-template-columns: 1fr;
			justify-items: start;
		}

		.hero-stats {
			background: var(--color-surface-raised);
			border-radius: var(--radius-sm);
			justify-content: center;
			justify-self: stretch;
			padding: 14px;
		}
	}

	@media (max-width: 480px) {
		.achievement-grid,
		.inventory-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
