<script lang="ts">
	let { data } = $props();
</script>

<main class="page stack">
	<section class="progress-heading">
		<div>
			<p class="eyebrow">Progress</p>
			<h1>Literary Devices</h1>
			<p class="muted">Based on the latest published release: {data.release.title}</p>
		</div>
	</section>

	<section class="summary-grid">
		<article class="metric">
			<span>Intro lesson</span>
			<strong>{data.progress.intro_lesson_completed ? 'Complete' : 'Open'}</strong>
		</article>
		<article class="metric">
			<span>Quiz</span>
			<strong>{data.progress.quiz_completed ? 'Complete' : 'Not started'}</strong>
		</article>
		<article class="metric">
			<span>Latest score</span>
			<strong>{data.progress.latest_score === null ? '-' : `${Math.round(data.progress.latest_score)}%`}</strong>
		</article>
		<article class="metric">
			<span>Best score</span>
			<strong>{data.progress.best_score === null ? '-' : `${Math.round(data.progress.best_score)}%`}</strong>
		</article>
		<article class="metric">
			<span>Total attempts</span>
			<strong>{data.progress.total_attempts}</strong>
		</article>
	</section>

	<section class="device-panel">
		<h2>Device accuracy</h2>
		{#if data.deviceStats.length}
			<div class="stats">
				{#each data.deviceStats as stat (stat.device)}
					<div class="stat-row">
						<strong>{stat.device}</strong>
						<span>{stat.correct} / {stat.attempted}</span>
						<meter min="0" max={stat.attempted} value={stat.correct}></meter>
					</div>
				{/each}
			</div>
		{:else}
			<p class="muted">No quiz answers yet. Complete the mixed practice quiz to populate this view.</p>
		{/if}
	</section>
</main>

<style>
	h1 {
		font-size: clamp(2.4rem, 5vw, 3rem);
		letter-spacing: 0;
		line-height: 0.95;
		margin: 0.75rem 0;
	}

	.summary-grid {
		display: grid;
		gap: 12px;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
	}

	.metric,
	.device-panel {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		display: grid;
		gap: 10px;
		padding: 18px;
	}

	.metric span,
	.stat-row span {
		color: var(--color-text-muted);
	}

	.metric strong {
		font-size: 1.45rem;
		line-height: 1.1;
	}

	.device-panel {
		padding: clamp(20px, 4vw, 32px);
	}

	.stats {
		display: grid;
		gap: 10px;
	}

	.stat-row {
		align-items: center;
		display: grid;
		gap: 12px;
		grid-template-columns: minmax(120px, 1fr) auto minmax(140px, 0.7fr);
		text-transform: capitalize;
	}

	meter {
		inline-size: 100%;
	}

	@media (max-width: 680px) {
		.stat-row {
			grid-template-columns: 1fr;
		}
	}
</style>
