<script lang="ts">
	import type { PageProps } from './$types';
	import { Button } from '@learn-anything/ui';
	import { ArrowRight, BookOpen, Clock, Layers, Trophy } from '@lucide/svelte';
	import { pluralize } from '$lib/shared/utils/format';

	let { data }: PageProps = $props();

	let ctaHref = $derived(data.isSignedIn ? data.topic.app_path : '/sign-in');
	let ctaLabel = $derived(data.isSignedIn ? 'Open path' : 'Start learning');
</script>

<main class="home page">
	<section class="hero">
		<div class="hero-copy">
			<p class="eyebrow">{data.topic.level_label}</p>
			<h1>{data.topic.name}</h1>
			<p>{data.topic.public_summary}</p>
			<div class="button-row">
				<Button href={ctaHref} size="lg">{ctaLabel} <ArrowRight size={18} /></Button>
				<Button href={`/topics/${data.topic.slug}/preview`} variant="secondary" size="lg" label="Preview" />
			</div>
		</div>
		<div class="path-preview" aria-label={`${data.topic.name} path preview`}>
			<div class="path-node done"><BookOpen size={24} /> {pluralize(data.topic.lesson_count, 'lesson')}</div>
			<div class="path-line"></div>
			<div class="path-node active"><Trophy size={24} /> {pluralize(data.topic.quiz_count, 'quiz', 'quizzes')}</div>
			<div class="metrics">
				<span><Clock size={16} /> {data.topic.estimated_minutes} min</span>
				<span><Layers size={16} /> {data.topic.covered_skill_labels.length} skills</span>
			</div>
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

	.metrics {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}

	.metrics span {
		align-items: center;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		display: inline-flex;
		gap: 6px;
		padding: 8px 10px;
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
		border-color: var(--color-success);
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
