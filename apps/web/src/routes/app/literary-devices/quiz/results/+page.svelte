<script lang="ts">
	import { Button } from '@learn-anything/ui';

	let { data } = $props();
</script>

<main class="page stack">
	<section class="results">
		<p class="eyebrow">Quiz results</p>
		{#if data.attempt}
			<h1>{Math.round(data.attempt.score)}%</h1>
			<p class="muted">
				{data.attempt.correct_count} correct out of {data.attempt.question_count} · Completed
				{new Date(data.attempt.completed_at).toLocaleString()}
			</p>

			<div class="summary-grid">
				<div>
					<span>Latest</span>
					<strong>{Math.round(data.progress.latest_score ?? data.attempt.score)}%</strong>
				</div>
				<div>
					<span>Best</span>
					<strong>{Math.round(data.progress.best_score ?? data.attempt.score)}%</strong>
				</div>
				<div>
					<span>Attempts</span>
					<strong>{data.progress.total_attempts}</strong>
				</div>
			</div>

			<div class="button-row">
				<Button href="/app/literary-devices/quiz" label="Practice again" />
				<Button href="/app/literary-devices" variant="secondary" label="Return to map" />
			</div>
		{:else}
			<h1>No attempts yet</h1>
			<p class="muted">Finish the mixed practice quiz to see results here.</p>
			<Button href="/app/literary-devices/quiz" label="Start quiz" />
		{/if}
	</section>

	<section class="breakdown">
		<h2>Device breakdown</h2>
		{#if data.deviceStats.length}
			<div class="stats">
				{#each data.deviceStats as stat (stat.device)}
					<div class="stat-row">
						<strong>{stat.device}</strong>
						<span>{stat.correct} / {stat.attempted} correct</span>
						<meter min="0" max={stat.attempted} value={stat.correct}></meter>
					</div>
				{/each}
			</div>
		{:else}
			<p class="muted">No device-level answers have been recorded yet.</p>
		{/if}
	</section>
</main>

<style>
	h1,
	h2,
	p {
		margin: 0;
	}

	.results,
	.breakdown {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		display: grid;
		gap: 18px;
		padding: clamp(20px, 5vw, 40px);
	}

	h1 {
		font-size: clamp(3.2rem, 8vw, 7rem);
		letter-spacing: 0;
		line-height: 0.9;
	}

	.summary-grid {
		display: grid;
		gap: 12px;
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}

	.summary-grid div {
		background: var(--color-surface-raised);
		border-radius: var(--radius-md);
		display: grid;
		gap: 4px;
		padding: 16px;
	}

	.summary-grid span,
	.stat-row span {
		color: var(--color-text-muted);
	}

	.summary-grid strong {
		font-size: 1.8rem;
		line-height: 1;
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
		.summary-grid,
		.stat-row {
			grid-template-columns: 1fr;
		}
	}
</style>
