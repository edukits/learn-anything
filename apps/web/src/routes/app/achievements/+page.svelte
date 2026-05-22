<script lang="ts">
	import type { PageProps } from './$types';
	import { Award, BadgeCheck, Medal } from '@lucide/svelte';

	let { data }: PageProps = $props();
	let earnedAchievements = $derived(data.achievements.filter((achievement) => achievement.earned_at));
	let lockedAchievements = $derived(data.achievements.filter((achievement) => !achievement.earned_at));
</script>

<main class="page achievements-page">
	<section class="hero">
		<Medal size={32} />
		<p class="eyebrow">Achievements</p>
		<h1>Rewards</h1>
		<p>{earnedAchievements.length} earned · {lockedAchievements.length} still available</p>
	</section>

	<section class="inventory" aria-label="Reward inventory">
		<h2>Inventory</h2>
		{#if data.rewards.length}
			<div class="reward-list">
				{#each data.rewards as reward (reward.id)}
					<article>
						<BadgeCheck size={18} />
						<div>
							<strong>{reward.reward_label}</strong>
							<span>{reward.reward_kind}</span>
						</div>
					</article>
				{/each}
			</div>
		{:else}
			<p>No rewards earned yet.</p>
		{/if}
	</section>

	<section class="achievement-grid" aria-label="Achievement list">
		{#each data.achievements as achievement (achievement.key)}
			<article class:locked={!achievement.earned_at}>
				<Award size={20} />
				<div>
					<p class="eyebrow">{achievement.category}</p>
					<h2>{achievement.name}</h2>
					<p>{achievement.description}</p>
					{#if achievement.reward_label}
						<span>{achievement.reward_label}</span>
					{/if}
				</div>
				<strong>{achievement.earned_at ? 'Earned' : 'Locked'}</strong>
			</article>
		{/each}
	</section>
</main>

<style>
	.achievements-page {
		display: grid;
		gap: 20px;
	}

	.hero,
	.inventory,
	.achievement-grid article {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
	}

	.hero,
	.inventory {
		display: grid;
		gap: 12px;
		padding: clamp(20px, 4vw, 32px);
	}

	.hero h1,
	.hero p,
	.inventory h2,
	.inventory p,
	.achievement-grid h2,
	.achievement-grid p {
		margin: 0;
	}

	.hero h1 {
		font-size: clamp(2rem, 4vw, 3.2rem);
		letter-spacing: 0;
		line-height: 1;
	}

	.hero > p:not(.eyebrow),
	.inventory > p,
	.achievement-grid p:not(.eyebrow) {
		color: var(--color-text-muted);
	}

	.reward-list,
	.achievement-grid {
		display: grid;
		gap: 12px;
	}

	.reward-list {
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
	}

	.reward-list article,
	.achievement-grid article {
		align-items: start;
		display: grid;
		gap: 10px;
	}

	.reward-list article {
		background: var(--color-surface-raised);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		grid-template-columns: auto 1fr;
		padding: 12px;
	}

	.reward-list span,
	.achievement-grid span,
	.achievement-grid strong {
		color: var(--color-text-muted);
		font-size: 0.85rem;
		font-weight: 760;
	}

	.achievement-grid {
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
	}

	.achievement-grid article {
		grid-template-columns: auto 1fr auto;
		padding: 16px;
	}

	.achievement-grid article.locked {
		opacity: 0.62;
	}

	.achievement-grid h2 {
		font-size: 1rem;
		letter-spacing: 0;
	}
</style>
