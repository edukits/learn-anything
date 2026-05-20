<script lang="ts">
	import '@learn-anything/tokens/theme.css';
	import { Button } from '$lib';
</script>

<main>
	<section>
		<p class="eyebrow">Design system package</p>
		<h1>Shared UI starts here.</h1>
		<p>
			This package can host component demos while Storybook handles isolated documentation and
			states.
		</p>
		<div class="actions">
			<Button label="Primary action" />
			<Button label="Secondary action" variant="secondary" />
			<Button label="Quiet action" variant="ghost" />
		</div>
	</section>
</main>

<style>
	main {
		min-block-size: 100vh;
		padding: var(--la-space-10);
	}

	section {
		max-inline-size: 46rem;
	}

	.eyebrow {
		color: var(--la-color-accent);
		font-size: 0.875rem;
		font-weight: 700;
		margin-block: 0 var(--la-space-3);
		text-transform: uppercase;
	}

	h1 {
		font-size: clamp(2.25rem, 7vw, 4.5rem);
		line-height: 0.95;
		margin-block: 0 var(--la-space-5);
		max-inline-size: 11ch;
	}

	p {
		color: var(--la-color-text-muted);
		font-size: 1.125rem;
		line-height: 1.6;
		margin-block: 0;
		max-inline-size: 38rem;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--la-space-3);
		margin-block-start: var(--la-space-8);
	}
</style>
