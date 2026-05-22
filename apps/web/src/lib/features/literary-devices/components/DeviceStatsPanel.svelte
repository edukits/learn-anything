<script lang="ts">
	import type { DeviceStatItem } from '../types';

	type DeviceStatsPanelProps = {
		title: string;
		stats: DeviceStatItem[];
		emptyMessage: string;
		countStyle?: 'ratio' | 'correct-ratio';
		density?: 'compact' | 'roomy';
		class?: string;
	};

	let {
		title,
		stats,
		emptyMessage,
		countStyle = 'ratio',
		density = 'compact',
		class: className = ''
	}: DeviceStatsPanelProps = $props();

	function statCount(stat: DeviceStatItem) {
		const ratio = `${stat.correct} / ${stat.attempted}`;
		return countStyle === 'correct-ratio' ? `${ratio} correct` : ratio;
	}
</script>

<section class={['device-panel', className]} data-density={density}>
	<h2>{title}</h2>
	{#if stats.length}
		<div class="stats">
			{#each stats as stat (stat.device)}
				<div class="stat-row">
					<strong>{stat.device}</strong>
					<span>{statCount(stat)}</span>
					<meter min="0" max={stat.attempted} value={stat.correct}></meter>
				</div>
			{/each}
		</div>
	{:else}
		<p class="muted">{emptyMessage}</p>
	{/if}
</section>

<style>
	h2,
	p {
		margin: 0;
	}

	.device-panel {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		display: grid;
		gap: 10px;
		padding: clamp(20px, 4vw, 32px);
	}

	.device-panel[data-density='roomy'] {
		gap: 18px;
		padding: clamp(20px, 5vw, 40px);
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

	span {
		color: var(--color-text-muted);
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
