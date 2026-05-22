<script lang="ts">
	import type { PageProps } from './$types';
	import { Button } from '@learn-anything/ui';
	import { ArrowRight, BookOpen, Clock, Eye, Layers } from '@lucide/svelte';
	import { pluralize } from '$lib/shared/utils/format';

	let { data }: PageProps = $props();

	let topicHref = $derived(`/topics/${data.topic.slug}`);
</script>

<main class="topic-page">
	<section class="hero page">
		<div class="copy">
			<p class="eyebrow">{data.topic.level_label}</p>
			<h1>{data.topic.name}</h1>
			<p>{data.topic.public_summary}</p>
			<div class="button-row">
				{#if data.isSignedIn}
					<form method="POST" action="?/enroll">
						<input type="hidden" name="topicSlug" value={data.topic.slug} />
						<Button type="submit" size="lg">Start or continue <ArrowRight size={18} /></Button>
					</form>
				{:else}
					<Button href="/sign-in" size="lg">Sign in to start <ArrowRight size={18} /></Button>
				{/if}
				<Button href={`${topicHref}/preview`} variant="secondary" size="lg">
					Preview lesson <Eye size={18} />
				</Button>
			</div>
		</div>

		<div class="summary" aria-label="Topic summary">
			<span><BookOpen size={18} /> {pluralize(data.topic.lesson_count, 'lesson')}</span>
			<span><Layers size={18} /> {pluralize(data.topic.quiz_count, 'quiz', 'quizzes')}</span>
			<span><Clock size={18} /> {data.topic.estimated_minutes} min</span>
		</div>
	</section>

	<section class="skills page" aria-label="Skills covered">
		<h2>Skills covered</h2>
		<div class="skill-grid">
			{#each data.topic.covered_skill_labels as skill (skill)}
				<span>{skill}</span>
			{/each}
		</div>
	</section>
</main>

<style>
	.topic-page {
		padding-block: 48px 64px;
	}

	.hero {
		align-items: end;
		display: grid;
		gap: 28px;
		grid-template-columns: minmax(0, 1fr) minmax(240px, 340px);
		min-block-size: min(620px, calc(100svh - 96px));
	}

	.copy {
		display: grid;
		gap: 18px;
	}

	h1,
	h2,
	p {
		margin: 0;
	}

	h1 {
		font-size: clamp(3rem, 7vw, 6.4rem);
		letter-spacing: 0;
		line-height: 0.95;
		max-inline-size: 840px;
	}

	.copy > p:not(.eyebrow) {
		color: var(--color-text-muted);
		font-size: 1.12rem;
		max-inline-size: 680px;
	}

	.summary {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		display: grid;
		gap: 10px;
		padding: 18px;
	}

	.summary span {
		align-items: center;
		display: inline-flex;
		font-weight: 740;
		gap: 8px;
	}

	form {
		display: contents;
	}

	.skills {
		border-block-start: 1px solid var(--color-border);
		display: grid;
		gap: 18px;
		margin-block-start: 36px;
		padding-block-start: 28px;
	}

	h2 {
		font-size: 1.4rem;
		letter-spacing: 0;
	}

	.skill-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}

	.skill-grid span {
		background: var(--color-surface-raised);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		font-weight: 720;
		padding: 8px 10px;
	}

	@media (max-width: 780px) {
		.hero {
			grid-template-columns: 1fr;
			min-block-size: auto;
		}
	}
</style>
