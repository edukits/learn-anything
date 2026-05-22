<script lang="ts">
	import type { PageProps } from './$types';
	import { Button } from '@learn-anything/ui';
	import { ArrowRight, BookOpen, Clock, Layers } from '@lucide/svelte';
	import { pluralize } from '$lib/shared/utils/format';

	let { data }: PageProps = $props();
</script>

<main class="page topics-page stack">
	<header class="page-heading">
		<p class="eyebrow">Topics</p>
		<h1>Explore learning paths</h1>
		<p class="muted">Preview available topics before signing in to practice and track progress.</p>
	</header>

	<section class="topic-list" aria-label="Available topics">
		{#if data.topics.length === 0}
			<div class="empty-state">
				<p>No public topics are available yet.</p>
			</div>
		{/if}

		{#each data.topics as topic (topic.topic_area_id)}
			<article class="topic">
				<div>
					<p class="eyebrow">{topic.level_label}</p>
					<h2>{topic.name}</h2>
					<p>{topic.public_summary}</p>
				</div>

				<div class="facts" aria-label={`${topic.name} summary`}>
					<span><BookOpen size={16} /> {pluralize(topic.lesson_count, 'lesson')}</span>
					<span><Layers size={16} /> {pluralize(topic.quiz_count, 'quiz', 'quizzes')}</span>
					<span><Clock size={16} /> {topic.estimated_minutes} min</span>
				</div>

				<div class="button-row">
					<Button href={`/topics/${topic.slug}`} label="View topic" />
					<Button
						href={data.isSignedIn ? topic.app_path : '/sign-in'}
						variant="secondary"
					>
						{data.isSignedIn ? 'Open path' : 'Sign in'} <ArrowRight size={16} />
					</Button>
				</div>
			</article>
		{/each}
	</section>
</main>

<style>
	.topics-page {
		padding-block: 48px;
	}

	.page-heading {
		display: grid;
		gap: 10px;
	}

	h1,
	h2,
	p {
		margin: 0;
	}

	h1 {
		font-size: clamp(2.4rem, 5vw, 4.8rem);
		letter-spacing: 0;
		line-height: 1;
	}

	.topic-list {
		display: grid;
		gap: 18px;
	}

	.topic {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		display: grid;
		gap: 18px;
		padding: clamp(18px, 4vw, 28px);
	}

	.empty-state {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: 20px;
	}

	.empty-state p {
		color: var(--color-text-muted);
		margin: 0;
	}

	h2 {
		font-size: clamp(1.5rem, 3vw, 2.2rem);
		letter-spacing: 0;
		line-height: 1.1;
	}

	.topic p:not(.eyebrow) {
		color: var(--color-text-muted);
		margin-block-start: 8px;
		max-inline-size: 720px;
	}

	.facts {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}

	.facts span {
		align-items: center;
		background: var(--color-surface-raised);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		display: inline-flex;
		gap: 6px;
		padding: 8px 10px;
	}
</style>
