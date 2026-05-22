<script lang="ts">
	import type { PageProps } from './$types';
	import { MetricGrid, PageHeader, SkillAccuracyPanel } from '$lib/features/learning';
	import type { MetricItem } from '$lib/features/learning';
	import { Button } from '@learn-anything/ui';

	let { data }: PageProps = $props();

	let engagement = $derived(data.engagement);
	let completedPathItems = $derived(
		data.pathProgress.filter((item) => item.state === 'completed' || item.state === 'review').length
	);
	let quizItems = $derived(data.pathProgress.filter((item) => item.item_type === 'quiz'));
	let stateLabels = {
		active: 'Active',
		available: 'Available',
		completed: 'Completed',
		locked: 'Locked',
		review: 'Review'
	};

	let progressMetrics: MetricItem[] = $derived([
		{
			id: 'path-items',
			label: 'Path items',
			value: `${completedPathItems}/${data.pathProgress.length}`
		},
		{
			id: 'lessons',
			label: 'Lessons',
			value: data.pathProgress.filter((item) => item.item_type === 'lesson' && item.state === 'completed').length
		},
		{
			id: 'quizzes',
			label: 'Quizzes',
			value: quizItems.filter((item) => item.total_attempts > 0).length
		},
		{
			id: 'best-score',
			label: 'Best score',
			value:
				quizItems.every((item) => item.best_score === null)
					? '-'
					: `${Math.round(Math.max(...quizItems.map((item) => item.best_score ?? 0)))}%`
		},
		{
			id: 'total-attempts',
			label: 'Total attempts',
			value: quizItems.reduce((total, item) => total + item.total_attempts, 0)
		},
		{
			id: 'xp-today',
			label: 'XP today',
			value: `${engagement.xp_today}/${engagement.daily_xp_goal}`
		},
		{
			id: 'xp-total',
			label: 'XP total',
			value: engagement.xp_total
		},
		{
			id: 'streak',
			label: 'Current streak',
			value: engagement.current_streak
		}
	]);
</script>

<main class="page stack">
	<PageHeader
		eyebrow="Progress"
		title={data.topic.name}
		description={`Based on the latest published release: ${data.release.title}`}
	/>

	<div class="button-row">
		<Button href="/app/progress/history" variant="secondary" label="View history" />
	</div>

	<MetricGrid metrics={progressMetrics} />

	{#if data.reviewSummary.available}
		<section class="recommendation" aria-label="Recommended next action">
			<div>
				<span>Recommended</span>
				<h2>{data.reviewSummary.reason_label ?? 'Adaptive review'}</h2>
				<p>{data.reviewSummary.question_count} questions selected from your recent attempt history.</p>
			</div>
			<Button href={`/app/topics/${data.topic.slug}/review`} label="Start review" />
		</section>
	{/if}

	<section class="path-summary" aria-label="Path progress by item">
		{#each data.pathProgress as item (item.id)}
			<article>
				<span>{stateLabels[item.state]}</span>
				<h2>{item.title}</h2>
				<p>
					{#if item.item_type === 'lesson'}
						{item.estimated_minutes} min lesson
					{:else if item.total_attempts > 0}
						Best score {Math.round(item.best_score ?? 0)}% across {item.total_attempts} attempts
					{:else}
						{item.question_count} questions
					{/if}
				</p>
			</article>
		{/each}
	</section>

	<SkillAccuracyPanel
		title="Skill accuracy"
		stats={data.skillAccuracy}
		emptyMessage={`No quiz answers yet. Complete a ${data.topic.name} quiz to populate this view.`}
	/>
</main>

<style>
	.recommendation {
		align-items: center;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		display: flex;
		gap: 16px;
		justify-content: space-between;
		padding: 18px;
	}

	.recommendation div {
		display: grid;
		gap: 4px;
	}

	.recommendation span {
		color: var(--color-text-muted);
		font-size: 0.78rem;
		font-weight: 750;
		letter-spacing: 0;
		text-transform: uppercase;
	}

	.recommendation h2,
	.recommendation p {
		margin: 0;
	}

	.recommendation h2 {
		font-size: 1.12rem;
		letter-spacing: 0;
	}

	.recommendation p {
		color: var(--color-text-muted);
	}

	.path-summary {
		display: grid;
		gap: 12px;
	}

	.path-summary article {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		display: grid;
		gap: 4px;
		padding: 14px;
	}

	.path-summary span {
		color: var(--color-text-muted);
		font-size: 0.78rem;
		font-weight: 750;
		letter-spacing: 0;
		text-transform: uppercase;
	}

	.path-summary h2,
	.path-summary p {
		margin: 0;
	}

	.path-summary h2 {
		font-size: 1rem;
		letter-spacing: 0;
	}

	.path-summary p {
		color: var(--color-text-muted);
	}

	@media (max-width: 620px) {
		.recommendation {
			align-items: start;
			flex-direction: column;
		}
	}
</style>
