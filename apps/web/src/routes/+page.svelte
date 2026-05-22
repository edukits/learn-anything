<script lang="ts">
	import { Button } from '@learn-anything/ui';
	import { ArrowRight, BookOpen, Trophy } from '@lucide/svelte';
</script>

<main class="home page">
	<section class="hero">
		<div class="hero-copy">
			<p class="eyebrow">Learn Anything v1</p>
			<h1>Literary Devices</h1>
			<p>
				A focused learning path for high-school readers: finish a short intro lesson, unlock a
				15-question mixed practice quiz, and track progress by device.
			</p>
			<div class="button-row">
				<Button href="/sign-in" size="lg">Start learning <ArrowRight size={18} /></Button>
				<Button href="/app" variant="secondary" size="lg" label="Open app" />
			</div>
		</div>
		<div class="path-preview" aria-label="Literary Devices path preview">
			<div class="path-node done"><BookOpen size={24} /> Intro lesson</div>
			<div class="path-line"></div>
			<div class="path-node active"><Trophy size={24} /> Mixed practice</div>
		</div>
	</section>
</main>

<style>
	.home {
		padding-block: 56px;
	}

	.hero {
		align-items: center;
		display: grid;
		gap: 40px;
		grid-template-columns: minmax(0, 1.1fr) minmax(280px, 0.9fr);
		min-block-size: calc(100svh - 112px);
	}

	.hero-copy {
		display: grid;
		gap: 18px;
	}

	h1 {
		font-size: clamp(3rem, 7vw, 6.6rem);
		letter-spacing: 0;
		line-height: 0.92;
		margin: 0;
	}

	p {
		font-size: 1.15rem;
		max-inline-size: 660px;
		margin: 0;
	}

	.path-preview {
		align-content: center;
		background: var(--color-surface-raised);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		display: grid;
		gap: 18px;
		min-block-size: 420px;
		padding: 28px;
	}

	.path-node {
		align-items: center;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		display: flex;
		font-weight: 780;
		gap: 12px;
		min-block-size: 76px;
		padding: 0 20px;
	}

	.path-node.done {
		border-color: var(--color-correct);
	}

	.path-node.active {
		border-color: var(--color-star);
		box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--color-star), transparent 50%);
	}

	.path-line {
		background: var(--color-border);
		block-size: 56px;
		inline-size: 5px;
		margin-inline: 38px;
	}

	@media (max-width: 840px) {
		.hero {
			grid-template-columns: 1fr;
			min-block-size: auto;
		}

		.path-preview {
			min-block-size: 320px;
		}
	}
</style>
