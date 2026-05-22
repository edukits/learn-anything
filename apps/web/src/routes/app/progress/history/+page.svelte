<script lang="ts">
	import type { PageProps } from './$types';
	import { PageHeader } from '$lib/features/literary-devices';
	import { Button } from '@learn-anything/ui';

	let { data }: PageProps = $props();

	let activityLabels = {
		lesson_completed: 'Lesson completed',
		quiz_completed: 'Quiz completed',
		review_completed: 'Review completed'
	};

	function formatWhen(value: string) {
		return new Intl.DateTimeFormat('en-US', {
			dateStyle: 'medium',
			timeStyle: 'short',
			timeZone: 'America/Los_Angeles'
		}).format(new Date(value));
	}
</script>

<main class="page stack">
	<PageHeader
		eyebrow="History"
		title="Activity history"
		description="Exact content ids, versions, release ids, and attempt events are preserved here."
	/>

	<div class="button-row">
		<Button href="/app/progress" variant="secondary" label="Back to progress" />
	</div>

	<section class="history" aria-label="Activity history">
		{#each data.activityHistory as item (item.id)}
			<article>
				<div>
					<span>{activityLabels[item.activity_type]}</span>
					<h2>{item.source_id}</h2>
					<p>
						Release {item.release_id}
						{#if item.source_version}
							· Version {item.source_version}
						{/if}
					</p>
				</div>
				<time datetime={item.occurred_at}>{formatWhen(item.occurred_at)}</time>
			</article>
		{:else}
			<p class="muted">No activity has been recorded yet.</p>
		{/each}
	</section>

	<section class="history" aria-label="Latest release attempts">
		<h2>Latest release attempts</h2>
		{#each data.attempts as attempt (attempt.id)}
			<article>
				<div>
					<span>{attempt.attempt_kind === 'review' ? 'Review attempt' : 'Quiz attempt'}</span>
					<h3>{Math.round(attempt.score)}%</h3>
					<p>{attempt.correct_count} correct out of {attempt.question_count}</p>
				</div>
				<time datetime={attempt.completed_at}>{formatWhen(attempt.completed_at)}</time>
			</article>
		{:else}
			<p class="muted">No attempts for {data.release.title} yet.</p>
		{/each}
	</section>
</main>

<style>
	.history {
		display: grid;
		gap: 12px;
	}

	.history > h2 {
		font-size: 1.2rem;
		letter-spacing: 0;
		margin: 0;
	}

	.history article {
		align-items: center;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		display: flex;
		gap: 16px;
		justify-content: space-between;
		padding: 14px;
	}

	.history div {
		display: grid;
		gap: 4px;
		min-inline-size: 0;
	}

	.history span {
		color: var(--color-text-muted);
		font-size: 0.78rem;
		font-weight: 750;
		letter-spacing: 0;
		text-transform: uppercase;
	}

	.history h2,
	.history h3,
	.history p {
		margin: 0;
	}

	.history h2,
	.history h3 {
		font-size: 1rem;
		letter-spacing: 0;
		overflow-wrap: anywhere;
	}

	.history p,
	time {
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}

	time {
		white-space: nowrap;
	}

	@media (max-width: 680px) {
		.history article {
			align-items: start;
			flex-direction: column;
		}
	}
</style>
