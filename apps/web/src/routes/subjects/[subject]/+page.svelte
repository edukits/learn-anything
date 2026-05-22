<script lang="ts">
	import type { PageProps } from './$types';
	import { Button } from '@learn-anything/ui';
	import { ArrowRight, BookOpen, Clock, Layers } from '@lucide/svelte';
	import { pluralize } from '$lib/shared/utils/format';

	let { data }: PageProps = $props();
</script>

<main class="page subject-page stack">
	<header class="page-heading">
		<p class="eyebrow">Subject</p>
		<h1>{data.subject.name}</h1>
		<p class="muted">{data.subject.summary}</p>
	</header>

	<section class="topic-list" aria-label={`${data.subject.name} topics`}>
		{#each data.topics as topic (topic.topic_area_id)}
			<article class="topic">
				<div>
					<p class="eyebrow">{topic.level_label}</p>
					<h2>{topic.name}</h2>
					<p>{topic.public_summary}</p>
				</div>
				<div class="facts">
					<span><BookOpen size={16} /> {pluralize(topic.lesson_count, 'lesson')}</span>
					<span><Layers size={16} /> {pluralize(topic.quiz_count, 'quiz', 'quizzes')}</span>
					<span><Clock size={16} /> {topic.estimated_minutes} min</span>
				</div>
				<div class="button-row">
					<Button href={`/topics/${topic.slug}`} label="View topic" />
					<Button href={data.isSignedIn ? topic.app_path : '/sign-in'} variant="secondary">
						{data.isSignedIn ? 'Open path' : 'Sign in'} <ArrowRight size={16} />
					</Button>
				</div>
			</article>
		{/each}
	</section>
</main>

<style>
	.subject-page {
		padding-block: 48px 72px;
	}

	h1,
	h2,
	p {
		margin: 0;
	}

	h1 {
		font-size: clamp(2.6rem, 5vw, 5rem);
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

	.topic p:not(.eyebrow) {
		color: var(--color-text-muted);
		margin-block-start: 8px;
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
