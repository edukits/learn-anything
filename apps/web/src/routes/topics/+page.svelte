<script lang="ts">
	import type { PageProps } from './$types';
	import { ArrowRight, BookOpen, Clock, Layers } from '@lucide/svelte';
	import { pluralize } from '$lib/shared/utils/format';

	let { data }: PageProps = $props();
</script>

<main class="page topics-page">
	<header class="page-heading">
		<p class="eyebrow">Catalogue</p>
		<h1>Learning paths</h1>
		<p class="muted">Preview any path before signing in to practice and track progress.</p>
	</header>

	<section class="topic-list" aria-label="Available topics">
		{#if data.topics.length === 0}
			<p class="empty muted">No public topics are available yet.</p>
		{/if}

		{#each data.topics as topic (topic.topic_area_id)}
			<a class="catalogue-row topic" href={`/topics/${topic.slug}`}>
				<div class="topic-body">
					<p class="eyebrow">{topic.level_label}</p>
					<h2>{topic.name}</h2>
					<p class="summary muted">{topic.public_summary}</p>
					<div class="fact-inline">
						<span><BookOpen size={14} /> {pluralize(topic.lesson_count, 'lesson')}</span>
						<span><Layers size={14} /> {pluralize(topic.quiz_count, 'quiz', 'quizzes')}</span>
						<span><Clock size={14} /> {topic.estimated_minutes} min</span>
					</div>
				</div>
				<span class="row-arrow" aria-hidden="true">
					<ArrowRight size={16} strokeWidth={2.5} />
				</span>
			</a>
		{/each}
	</section>
</main>

<style>
	.topics-page {
		display: grid;
		gap: 32px;
		padding-block: 48px 72px;
	}

	.page-heading {
		display: grid;
		gap: 8px;
	}

	h1,
	h2,
	p {
		margin: 0;
	}

	h1 {
		font-size: clamp(2.4rem, 5vw, 4.2rem);
		letter-spacing: -0.02em;
		line-height: 1;
	}

	.topic-list {
		display: grid;
		gap: 10px;
	}

	.topic {
		align-items: center;
		gap: 16px;
		grid-template-columns: 1fr auto;
	}

	.topic-body {
		display: grid;
		gap: 6px;
		min-inline-size: 0;
	}

	h2 {
		font-size: 1.2rem;
		letter-spacing: -0.005em;
	}

	.summary {
		font-size: 0.95rem;
		line-height: 1.45;
		max-inline-size: 65ch;
	}

	.row-arrow {
		color: var(--color-text-muted);
		opacity: 0;
		transition:
			opacity var(--transition-ease),
			transform var(--transition-ease),
			color var(--transition-ease);
		transform: translateX(-3px);
	}

	.topic:hover .row-arrow,
	.topic:focus-visible .row-arrow {
		color: var(--color-accent);
		opacity: 1;
		transform: none;
	}

	.empty {
		padding: 20px 0;
	}

	@media (max-width: 640px) {
		.row-arrow {
			display: none;
		}
	}
</style>
