<script lang="ts">
	import type { PageProps } from './$types';
	import {
		Award,
		BadgeCheck,
		Crown,
		Lock,
		Medal,
		Sparkles,
		Star,
		Trophy
	} from '@lucide/svelte';

	let { data }: PageProps = $props();

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

	let categories = $derived([...new Set(data.achievements.map((a) => a.category))]);
	let activeCategory = $state<string | null>(null);
	let filteredAchievements = $derived(
		activeCategory
			? data.achievements.filter((a) => a.category === activeCategory)
			: data.achievements
	);

	let badges = $derived(data.rewards.filter((r) => r.reward_kind === 'badge'));
	let titles = $derived(data.rewards.filter((r) => r.reward_kind === 'title'));

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	const categoryIcons: Record<string, typeof Trophy> = {
		streak: Star,
		xp: Sparkles,
		milestone: Trophy
	};
</script>

<main class="page achievements-page">
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
						stroke-dashoffset="85"
					/>
					<circle cx="60" cy="60" r="54" class="ring-sheen" />
				</svg>
			</div>
		</div>
		<div class="hero-text">
			<p class="eyebrow">Achievements &amp; Rewards</p>
			<h1>Your collection</h1>
			<p class="hero-subtitle">
				Track milestones, earn badges, and unlock titles as you learn.
			</p>
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
					<article class="reward-card" class:equipped={reward.equipped}>
						<div class="reward-icon" class:is-badge={reward.reward_kind === 'badge'} class:is-title={reward.reward_kind === 'title'}>
							{#if reward.reward_kind === 'badge'}
								<BadgeCheck size={22} />
							{:else}
								<Crown size={22} />
							{/if}
						</div>
						<div class="reward-details">
							<strong>{reward.reward_label}</strong>
							<span class="reward-meta">
								{reward.reward_kind === 'badge' ? 'Badge' : 'Title'}
								{#if reward.equipped}
									<span class="equipped-pill">Equipped</span>
								{/if}
							</span>
						</div>
						<time class="reward-date">{formatDate(reward.earned_at)}</time>
					</article>
				{/each}
			</div>
		</section>
	{/if}

	<section class="achievements-section" aria-label="Achievements">
		<div class="section-header">
			<h2>All achievements</h2>
			<p>{earnedAchievements.length} of {data.achievements.length} unlocked</p>
		</div>

		{#if categories.length > 1}
			<div class="category-tabs" role="tablist" aria-label="Filter by category">
				<button
					role="tab"
					class:active={activeCategory === null}
					aria-selected={activeCategory === null}
					onclick={() => (activeCategory = null)}
				>
					All
				</button>
				{#each categories as category (category)}
					<button
						role="tab"
						class:active={activeCategory === category}
						aria-selected={activeCategory === category}
						onclick={() => (activeCategory = category)}
					>
						{category}
					</button>
				{/each}
			</div>
		{/if}

		<div class="achievement-grid">
		{#each filteredAchievements as achievement (achievement.key)}
			{@const earned = Boolean(achievement.earned_at)}
			{@const Icon = categoryIcons[achievement.category] ?? Award}
			<article class="achievement-card" class:earned class:locked={!earned}>
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
							<span class="locked-badge">
								<Lock size={12} />
							</span>
						{/if}
					</div>
					<div class="card-body">
						<p class="eyebrow">{achievement.category}</p>
						<h3>{achievement.name}</h3>
						<p class="achievement-desc">{achievement.description}</p>
					</div>
					<div class="card-footer">
						{#if achievement.reward_label}
							<span class="reward-pill" class:earned>
								{#if achievement.reward_kind === 'badge'}
									<BadgeCheck size={12} />
								{:else}
									<Crown size={12} />
								{/if}
								{achievement.reward_label}
							</span>
						{/if}
						{#if achievement.earned_at}
							<time>{formatDate(achievement.earned_at)}</time>
						{/if}
					</div>
				</article>
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

	/* ---- Hero ---- */

	.hero {
		display: grid;
		gap: 50px;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		padding: clamp(24px, 4vw, 40px) 0;
		border-bottom: 1px dashed var(--color-border);
	}

	.hero-visual {
		position: relative;
		inline-size: 96px;
		block-size: 96px;
	}

	.hero-visual::before {
		content: '';
		position: absolute;
		inset: -10px;
		border-radius: 50%;
		background: radial-gradient(
			circle,
			hsl(var(--color-star-h) var(--color-star-s) var(--color-star-l) / 0.1) 40%,
			hsl(var(--color-star-h) var(--color-star-s) var(--color-star-l) / 0.04) 70%,
			transparent 100%
		);
		box-shadow:
			inset 0 0 12px hsl(var(--color-star-h) var(--color-star-s) var(--color-star-l) / 0.08);
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
			inset 0 2px 3px hsl(var(--color-star-h) var(--color-star-s) calc(var(--color-star-l) + 28%) / 0.55),
			inset 0 -1px 2px hsl(var(--color-star-h) var(--color-star-s) calc(var(--color-star-l) - 20%) / 0.3),
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
		border-radius: inherit;
		inset: 0;
		pointer-events: none;
		position: absolute;
		background: linear-gradient(
			to bottom,
			hsl(0 0% 100% / 0.32) 0%,
			hsl(0 0% 100% / 0.08) 42%,
			transparent 50%,
			hsl(0 0% 0% / 0.1) 100%
		);
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

	.ring-track {
		fill: none;
		stroke: url(#track-grad);
		stroke-width: 10;
		filter: drop-shadow(0 1px 1px hsl(0 0% 0% / 0.12));
	}

	.ring-inset {
		fill: none;
		stroke: hsl(0 0% 0% / 0.08);
		stroke-width: 10;
	}

	.progress-arc {
		fill: none;
		stroke: url(#fill-grad);
		stroke-linecap: round;
		stroke-width: 10;
		transition: stroke-dasharray 0.6s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.ring-sheen {
		fill: none;
		stroke: url(#sheen-grad);
		stroke-width: 10;
		pointer-events: none;
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

	/* ---- Section headers ---- */

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

	/* ---- Inventory ---- */

	.inventory-section {
		display: grid;
		gap: 16px;
	}

	.inventory-grid {
		display: grid;
		gap: 10px;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
	}

	.reward-card {
		align-items: center;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		display: grid;
		gap: 12px;
		grid-template-columns: auto 1fr auto;
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
		display: grid;
		block-size: 40px;
		inline-size: 40px;
		justify-items: center;
		position: relative;
		color: #fff;
	}

	.reward-icon::after {
		border-radius: inherit;
		content: '';
		inset: 0;
		pointer-events: none;
		position: absolute;
		background: linear-gradient(
			to bottom,
			hsl(0 0% 100% / 0.28) 0%,
			hsl(0 0% 100% / 0.06) 44%,
			transparent 50%,
			hsl(0 0% 0% / 0.1) 100%
		);
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
		background: linear-gradient(
			to bottom,
			hsl(280 80% 62%),
			hsl(280 80% 50%),
			hsl(280 80% 38%)
		);
		border: 1px solid hsl(280 80% 30%);
		box-shadow:
			inset 0 1px 2px hsl(280 80% 72% / 0.5),
			0 1px 4px hsl(280 80% 50% / 0.3);
	}

	.reward-details {
		display: grid;
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

	/* ---- Category tabs ---- */

	.achievements-section {
		display: grid;
		gap: 16px;
	}

	.category-tabs {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.category-tabs button {
		background: var(--color-surface-raised);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		color: var(--color-text-muted);
		cursor: pointer;
		font-size: 0.82rem;
		font-weight: 700;
		padding: 7px 14px;
		text-transform: capitalize;
		transition:
			background 0.12s,
			color 0.12s,
			border-color 0.12s;
	}

	.category-tabs button:hover {
		background: var(--color-surface);
		color: var(--color-text);
	}

	.category-tabs button.active {
		background: var(--color-text);
		border-color: var(--color-text);
		color: var(--color-surface);
	}

	/* ---- Achievement grid ---- */

	.achievement-grid {
		display: grid;
		gap: 12px;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
	}

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
		opacity: 0.55;
	}

	.achievement-card.locked:hover {
		opacity: 0.75;
	}

	.card-top {
		align-items: center;
		display: flex;
		justify-content: space-between;
	}

	.achievement-icon {
		align-items: center;
		border-radius: var(--radius-md);
		display: grid;
		block-size: 44px;
		inline-size: 44px;
		justify-items: center;
		position: relative;
		background: linear-gradient(
			to bottom,
			hsl(0 0% 92%),
			hsl(0 0% 84%),
			hsl(0 0% 78%)
		);
		border: 1px solid hsl(0 0% 68%);
		box-shadow:
			inset 0 1px 2px hsl(0 0% 100% / 0.45),
			inset 0 -1px 1px hsl(0 0% 0% / 0.08),
			0 1px 3px hsl(0 0% 0% / 0.1);
		color: hsl(0 0% 48%);
	}

	.achievement-icon::after {
		border-radius: inherit;
		content: '';
		inset: 0;
		pointer-events: none;
		position: absolute;
		background: linear-gradient(
			to bottom,
			hsl(0 0% 100% / 0.3) 0%,
			hsl(0 0% 100% / 0.06) 44%,
			transparent 50%,
			hsl(0 0% 0% / 0.08) 100%
		);
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

	.achievement-desc {
		color: var(--color-text-muted);
		font-size: 0.9rem;
		line-height: 1.45;
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

	/* ---- Empty state ---- */

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

	/* ---- Responsive ---- */

	@media (max-width: 840px) {
		.hero {
			grid-template-columns: 1fr;
			justify-items: start;
		}

		.hero-stats {
			justify-self: stretch;
			justify-content: center;
			background: var(--color-surface-raised);
			border-radius: var(--radius-sm);
			padding: 14px;
		}
	}

	@media (max-width: 480px) {
		.achievement-grid {
			grid-template-columns: 1fr;
		}

		.inventory-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
