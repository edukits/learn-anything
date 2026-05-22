<script lang="ts">
	import { DeviceStatsPanel, MetricGrid } from '$lib/features/literary-devices';
	import type { MetricItem } from '$lib/features/literary-devices';
	import { Button } from '@learn-anything/ui';

	let { data } = $props();

	let resultMetrics: MetricItem[] = $derived(
		data.attempt
			? [
					{
						id: 'latest',
						label: 'Latest',
						value: `${Math.round(data.progress.latest_score ?? data.attempt.score)}%`
					},
					{
						id: 'best',
						label: 'Best',
						value: `${Math.round(data.progress.best_score ?? data.attempt.score)}%`
					},
					{
						id: 'attempts',
						label: 'Attempts',
						value: data.progress.total_attempts
					}
				]
			: []
	);
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

			<MetricGrid metrics={resultMetrics} variant="inset" columns="fixed" />

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

	<DeviceStatsPanel
		title="Device breakdown"
		stats={data.deviceStats}
		emptyMessage="No device-level answers have been recorded yet."
		countStyle="correct-ratio"
		density="roomy"
	/>
</main>

<style>
	h1,
	p {
		margin: 0;
	}

	.results {
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
</style>
