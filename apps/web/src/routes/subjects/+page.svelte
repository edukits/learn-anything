<script lang="ts">
	import type { PageProps } from './$types';
	import { Button } from '@learn-anything/ui';
	import { ArrowRight, Library } from '@lucide/svelte';
	import { pluralize } from '$lib/shared/utils/format';

	let { data }: PageProps = $props();
</script>

<main class="page subjects-page stack">
	<header class="page-heading">
		<p class="eyebrow">Subjects</p>
		<h1>Browse the catalog</h1>
		<p class="muted">Choose a subject, then pick a topic path to preview or start.</p>
	</header>

	<section class="subject-list" aria-label="Available subjects">
		{#if data.subjects.length === 0}
			<div class="empty-state">
				<p>No public subjects are available yet.</p>
			</div>
		{/if}

		{#each data.subjects as subject (subject.id)}
			<article class="subject">
				<Library size={28} />
				<div>
					<h2>{subject.name}</h2>
					<p>{subject.summary}</p>
					<span>{pluralize(subject.topicCount, 'topic')}</span>
				</div>
				<Button href={`/subjects/${subject.slug}`} variant="secondary">
					View subject <ArrowRight size={16} />
				</Button>
			</article>
		{/each}
	</section>
</main>

<style>
	.subjects-page {
		padding-block: 48px 72px;
	}

	h1,
	h2,
	p {
		margin: 0;
	}

	h1 {
		font-size: clamp(2.5rem, 5vw, 4.8rem);
		letter-spacing: 0;
		line-height: 1;
	}

	.subject-list {
		display: grid;
		gap: 16px;
	}

	.subject,
	.empty-state {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: clamp(18px, 4vw, 28px);
	}

	.subject {
		align-items: center;
		display: grid;
		gap: 18px;
		grid-template-columns: auto 1fr auto;
	}

	.subject p,
	.empty-state p {
		color: var(--color-text-muted);
	}

	.subject span {
		color: var(--color-text-muted);
		display: inline-block;
		font-size: 0.92rem;
		margin-block-start: 8px;
	}

	@media (max-width: 720px) {
		.subject {
			align-items: start;
			grid-template-columns: 1fr;
		}
	}
</style>
