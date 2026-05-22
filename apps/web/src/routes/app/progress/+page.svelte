<script lang="ts">
	import { DeviceStatsPanel, MetricGrid, PageHeader } from '$lib/features/literary-devices';
	import type { MetricItem } from '$lib/features/literary-devices';

	let { data } = $props();

	let progressMetrics: MetricItem[] = $derived([
		{
			id: 'intro-lesson',
			label: 'Intro lesson',
			value: data.progress.intro_lesson_completed ? 'Complete' : 'Open'
		},
		{
			id: 'quiz',
			label: 'Quiz',
			value: data.progress.quiz_completed ? 'Complete' : 'Not started'
		},
		{
			id: 'latest-score',
			label: 'Latest score',
			value: data.progress.latest_score === null ? '-' : `${Math.round(data.progress.latest_score)}%`
		},
		{
			id: 'best-score',
			label: 'Best score',
			value: data.progress.best_score === null ? '-' : `${Math.round(data.progress.best_score)}%`
		},
		{
			id: 'total-attempts',
			label: 'Total attempts',
			value: data.progress.total_attempts
		}
	]);
</script>

<main class="page stack">
	<PageHeader
		eyebrow="Progress"
		title="Literary Devices"
		description={`Based on the latest published release: ${data.release.title}`}
	/>

	<MetricGrid metrics={progressMetrics} />

	<DeviceStatsPanel
		title="Device accuracy"
		stats={data.deviceStats}
		emptyMessage="No quiz answers yet. Complete the mixed practice quiz to populate this view."
	/>
</main>
