<script lang="ts">
	import type { PageProps } from './$types';
	import { PageHeader } from '$lib/features/learning';
	import { Button } from '@learn-anything/ui';

	let { data }: PageProps = $props();

	const activityMeta: Record<string, { label: string; icon: string }> = {
		lesson_completed: { label: 'Lesson', icon: '📖' },
		quiz_completed: { label: 'Quiz', icon: '✓' },
		review_completed: { label: 'Review', icon: '↻' }
	};

	const timeFormatter = new Intl.DateTimeFormat('en-US', {
		hour: 'numeric',
		minute: '2-digit'
	});

	const dateFormatter = new Intl.DateTimeFormat('en-US', {
		weekday: 'short',
		month: 'short',
		day: 'numeric'
	});

	function formatTime(value: string) {
		return timeFormatter.format(new Date(value));
	}

	function formatDate(value: string) {
		const date = new Date(value);
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const days = Math.floor(diff / 86_400_000);

		if (days === 0) return 'Today';
		if (days === 1) return 'Yesterday';
		return dateFormatter.format(date);
	}

	function groupByDate<T extends { occurred_at?: string; completed_at?: string }>(
		items: T[],
		key: 'occurred_at' | 'completed_at'
	): { date: string; items: T[] }[] {
		const groups: Map<string, T[]> = new Map();
		for (const item of items) {
			const dateStr = item[key] as string;
			const label = formatDate(dateStr);
			if (!groups.has(label)) groups.set(label, []);
			groups.get(label)!.push(item);
		}
		return [...groups.entries()].map(([date, items]) => ({ date, items }));
	}

	let activityGroups = $derived(groupByDate(data.activityHistory, 'occurred_at'));
	let attemptGroups = $derived(groupByDate(data.attempts, 'completed_at'));

	function scoreColor(score: number): string {
		if (score >= 80) return 'var(--color-success)';
		if (score >= 60) return 'var(--color-warning, #e5a000)';
		return 'var(--color-danger)';
	}
</script>

<main class="page stack">
	<div class="top-bar">
		<PageHeader eyebrow="Progress" title="History" />
		<Button href="/app/progress" variant="secondary" label="← Back" />
	</div>

	<section class="section" aria-label="Activity timeline">
		<h2 class="section-title">Activity</h2>

		{#if data.activityHistory.length === 0}
			<p class="empty">No activity recorded yet.</p>
		{:else}
			{#each activityGroups as group}
				<div class="date-group">
					<p class="date-label">{group.date}</p>
					<ul class="timeline">
						{#each group.items as item (item.id)}
							<li class="timeline-item">
								<span class="icon">{activityMeta[item.activity_type]?.icon ?? '•'}</span>
								<div class="item-body">
									<span class="item-label">{activityMeta[item.activity_type]?.label ?? item.activity_type}</span>
									<span class="item-detail">{item.source_id}</span>
								</div>
								<time datetime={item.occurred_at}>{formatTime(item.occurred_at)}</time>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		{/if}
	</section>

	<section class="section" aria-label="Quiz and review attempts">
		<h2 class="section-title">Attempts</h2>

		{#if data.attempts.length === 0}
			<p class="empty">No attempts for {data.release.title} yet.</p>
		{:else}
			{#each attemptGroups as group}
				<div class="date-group">
					<p class="date-label">{group.date}</p>
					<ul class="attempts-list">
						{#each group.items as attempt (attempt.id)}
							<li class="attempt-card">
								<div class="attempt-score" style:--score-color={scoreColor(attempt.score)}>
									{Math.round(attempt.score)}%
								</div>
								<div class="attempt-info">
									<span class="attempt-kind">{attempt.attempt_kind === 'review' ? 'Review' : 'Quiz'}</span>
									<span class="attempt-detail">{attempt.correct_count}/{attempt.question_count} correct</span>
								</div>
								<time datetime={attempt.completed_at}>{formatTime(attempt.completed_at)}</time>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		{/if}
	</section>
</main>

<style>
	.top-bar {
		align-items: start;
		display: flex;
		justify-content: space-between;
	}

	.section {
		display: grid;
		gap: 16px;
	}

	.section-title {
		border-block-end: 1px solid var(--color-border);
		font-size: 0.85rem;
		font-weight: 650;
		letter-spacing: 0.02em;
		margin: 0;
		padding-block-end: 8px;
		text-transform: uppercase;
		color: var(--color-text-muted);
	}

	.date-group {
		display: grid;
		gap: 8px;
	}

	.date-label {
		color: var(--color-text-muted);
		font-size: 0.82rem;
		font-weight: 600;
		margin: 0;
	}

	.empty {
		color: var(--color-text-muted);
		font-size: 0.9rem;
		margin: 0;
	}

	/* Activity timeline */

	.timeline {
		display: grid;
		gap: 2px;
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.timeline-item {
		align-items: center;
		border-radius: var(--radius-md);
		display: flex;
		gap: 12px;
		padding: 10px 12px;
		transition: background 0.1s;
	}

	.timeline-item:hover {
		background: var(--color-surface);
	}

	.icon {
		align-items: center;
		background: var(--color-surface);
		border-radius: 50%;
		display: flex;
		flex-shrink: 0;
		font-size: 0.8rem;
		block-size: 28px;
		inline-size: 28px;
		justify-content: center;
	}

	.item-body {
		display: flex;
		flex: 1;
		gap: 8px;
		align-items: baseline;
		min-inline-size: 0;
	}

	.item-label {
		font-size: 0.9rem;
		font-weight: 550;
		flex-shrink: 0;
	}

	.item-detail {
		color: var(--color-text-muted);
		font-size: 0.82rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	time {
		color: var(--color-text-muted);
		font-size: 0.8rem;
		flex-shrink: 0;
		white-space: nowrap;
	}

	/* Attempts */

	.attempts-list {
		display: grid;
		gap: 6px;
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.attempt-card {
		align-items: center;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		display: flex;
		gap: 14px;
		padding: 12px 14px;
	}

	.attempt-score {
		background: color-mix(in srgb, var(--score-color), transparent 88%);
		border-radius: var(--radius-md);
		color: var(--score-color);
		font-size: 0.85rem;
		font-weight: 700;
		padding: 4px 10px;
		white-space: nowrap;
	}

	.attempt-info {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: 2px;
		min-inline-size: 0;
	}

	.attempt-kind {
		font-size: 0.9rem;
		font-weight: 550;
	}

	.attempt-detail {
		color: var(--color-text-muted);
		font-size: 0.82rem;
	}

	@media (max-width: 680px) {
		.top-bar {
			flex-direction: column;
			gap: 12px;
		}

		.item-body {
			flex-direction: column;
			gap: 2px;
		}

		.item-detail {
			white-space: normal;
		}
	}
</style>
