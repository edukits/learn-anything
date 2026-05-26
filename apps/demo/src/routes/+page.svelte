<script lang="ts">
	import { Button } from '@learn-anything/ui';
</script>

<svelte:head>
	<title>Clarifyst Demo</title>
</svelte:head>

<main>
	<section class="hero">
		<div class="copy">
			<p class="eyebrow">Demo app</p>
			<h1>One design system, many SvelteKit apps.</h1>
			<p class="summary">
				This site consumes shared tokens and components from workspace packages, the same way future
				apps can.
			</p>
			<div class="actions">
				<Button label="Use shared button" />
				<Button label="View secondary state" variant="secondary" />
			</div>
		</div>

		<div class="panel" aria-label="Design system package status">
			<div>
				<span>Tokens</span>
				<strong>@learn-anything/tokens</strong>
			</div>
			<div>
				<span>Components</span>
				<strong>@learn-anything/ui</strong>
			</div>
			<div>
				<span>Config</span>
				<strong>@learn-anything/config</strong>
			</div>
		</div>
	</section>
</main>

<style>
	main {
		min-block-size: 100vh;
		padding: var(--space-8);
	}

	.hero {
		align-items: center;
		display: grid;
		gap: var(--space-10);
		grid-template-columns: minmax(0, 1fr) minmax(18rem, 26rem);
		margin-inline: auto;
		max-inline-size: 72rem;
		min-block-size: calc(100vh - var(--space-8) * 2);
	}

	.copy {
		max-inline-size: 46rem;
	}

	.eyebrow {
		color: var(--color-accent);
		font-size: 0.875rem;
		font-weight: 700;
		margin-block: 0 var(--space-3);
		text-transform: uppercase;
	}

	h1 {
		font-size: clamp(2.5rem, 7vw, 5.5rem);
		line-height: 0.94;
		margin-block: 0 var(--space-5);
		max-inline-size: 12ch;
	}

	.summary {
		color: var(--color-text-muted);
		font-size: 1.125rem;
		line-height: 1.65;
		margin-block: 0;
		max-inline-size: 38rem;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		margin-block-start: var(--space-8);
	}

	.panel {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-md);
		display: grid;
		gap: var(--space-4);
		padding: var(--space-5);
	}

	.panel div {
		background: var(--color-surface-raised);
		border-radius: var(--radius-md);
		display: grid;
		gap: var(--space-1);
		padding: var(--space-4);
	}

	.panel span {
		color: var(--color-text-muted);
		font-size: 0.8125rem;
		font-weight: 700;
		text-transform: uppercase;
	}

	.panel strong {
		font-family: var(--font-mono);
		font-size: 0.9375rem;
	}

	@media (max-width: 760px) {
		main {
			padding: var(--space-5);
		}

		.hero {
			grid-template-columns: 1fr;
			min-block-size: auto;
		}
	}
</style>
