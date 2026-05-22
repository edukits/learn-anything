<script lang="ts">
	import type { MetricItem } from '../types';

	type MetricGridProps = {
		metrics: MetricItem[];
		variant?: 'card' | 'inset';
		columns?: 'auto' | 'fixed';
		class?: string;
	};

	let {
		metrics,
		variant = 'card',
		columns = 'auto',
		class: className = ''
	}: MetricGridProps = $props();
</script>

<section class={['metric-grid', className]} data-variant={variant} data-columns={columns}>
	{#each metrics as metric (metric.id)}
		<article class="metric">
			<span>{metric.label}</span>
			<strong>{metric.value}</strong>
		</article>
	{/each}
</section>

<style>
	.metric-grid {
		display: grid;
		gap: 12px;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
	}

	.metric-grid[data-columns='fixed'] {
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}

	.metric {
		border-radius: var(--radius-md);
		display: grid;
		gap: 10px;
		padding: 18px;
	}

	.metric-grid[data-variant='card'] .metric {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
	}

	.metric-grid[data-variant='inset'] .metric {
		background: var(--color-surface-raised);
		gap: 4px;
		padding: 16px;
	}

	span {
		color: var(--color-text-muted);
	}

	strong {
		font-size: 1.45rem;
		line-height: 1.1;
	}

	.metric-grid[data-variant='inset'] strong {
		font-size: 1.8rem;
		line-height: 1;
	}

	@media (max-width: 680px) {
		.metric-grid[data-columns='fixed'] {
			grid-template-columns: 1fr;
		}
	}
</style>
