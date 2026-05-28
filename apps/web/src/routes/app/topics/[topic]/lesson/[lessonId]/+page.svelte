<script lang="ts">
	import type { PageProps } from './$types';
	import { getTopicRenderer } from '$lib/features/topic-renderers';
	import { ContentIssueReportForm, InteractiveLessonRenderer } from '$lib/features/learning';
	import { Popover } from 'bits-ui';
	import { Button } from '@learn-anything/ui';
	import { ArrowLeft, Check, Flag, Lock } from '@lucide/svelte';
	import { SvelteSet } from 'svelte/reactivity';

	let { data, form }: PageProps = $props();
	let topicBaseHref = $derived(`/app/topics/${data.topic.slug}`);
	let RichTextRenderer = $derived(getTopicRenderer(data.topic.slug).RichTextRenderer);
	let submittedInteractionSlugs = new SvelteSet<string>();
	let allInteractionsCompleted = $derived(
		data.lessonInteractions.every(
			(interaction) => interaction.completed || submittedInteractionSlugs.has(interaction.slug)
		)
	);

	function markInteractionCompleted(slug: string) {
		submittedInteractionSlugs.add(slug);
	}
</script>

<main class="page lesson-page">
	{#if data.locked || !data.lesson}
		<section class="locked">
			<Lock size={32} />
			<h1>Lesson locked</h1>
			<p>Complete the previous path item first.</p>
			<Button href={topicBaseHref} variant="secondary">
				<ArrowLeft size={16} strokeWidth={2.25} aria-hidden="true" />
				Back to map
			</Button>
		</section>
	{:else}
		<article class="lesson">
			<p class="eyebrow">Lesson</p>
			<InteractiveLessonRenderer
				blocks={data.lesson.render_blocks}
				interactions={data.lessonInteractions}
				oninteractioncompleted={markInteractionCompleted}
				{RichTextRenderer}
			/>

			{#if form?.error}
				<p class="message error">{form.error}</p>
			{:else if form?.issueReported}
				<p class="message">Issue report sent.</p>
			{/if}

			<div class="lesson-actions">
				<div class="lesson-actions-left">
					<Button href={topicBaseHref} variant="secondary">
						<ArrowLeft size={16} strokeWidth={2.25} aria-hidden="true" />
						Back to map
					</Button>

					<Popover.Root>
						<Popover.Trigger class="report-trigger" aria-label="Report an issue">
							<Flag size={16} strokeWidth={2.25} aria-hidden="true" />
						</Popover.Trigger>
						<Popover.Portal>
							<Popover.Content class="report-popover" sideOffset={8} side="top" align="start">
								<ContentIssueReportForm
									contentType="lesson"
									contentId={data.lesson.lesson_id}
									contentVersion={data.lesson.version}
									compact
								/>
							</Popover.Content>
						</Popover.Portal>
					</Popover.Root>
				</div>

				<form method="POST" action="?/complete">
					<Button type="submit" disabled={!allInteractionsCompleted}>
						<Check size={16} strokeWidth={2.5} aria-hidden="true" />
						{data.itemProgress?.state === 'completed' ? 'Continue to map' : 'Mark complete'}
					</Button>
				</form>
			</div>
		</article>
	{/if}
</main>

<style>
	.lesson-page {
		display: grid;
		gap: 20px;
		max-width: 700px;
	}

	.lesson,
	.locked {
		display: grid;
		gap: 18px;
		padding: 30px;
	}

	.locked {
		align-items: start;
	}

	.locked h1,
	.locked p {
		margin: 0;
	}

	.lesson :global(h1:not(.inline-interaction *)) {
		font-size: 2.8125rem;
		line-height: 1.2;
		margin: 0 0 4px 0;
	}

	.lesson :global(h2:not(.inline-interaction *)) {
		font-size: 2.109375rem;
		line-height: 1.3;
		margin: 1em 0 4px 0;
	}

	.lesson :global(h3:not(.inline-interaction *)) {
		font-size: 1.6875rem;
		line-height: 1.3;
		margin: 1em 0 1px 0;
	}

	.lesson :global(h4:not(.inline-interaction *)) {
		font-size: 1.40625rem;
		line-height: 1.3;
		margin: 1em 0 1px 0;
	}

	.lesson :global(p:not(.inline-interaction *)),
	.lesson :global(li:not(.inline-interaction *)) {
		font-size: 1.125rem;
		line-height: 1.5;
		margin: 1px 0;
		padding: 3px 2px;
	}

	.lesson-actions {
		align-items: center;
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		justify-content: space-between;
		width: 100%;
	}

	.lesson-actions-left {
		align-items: center;
		display: flex;
		gap: 8px;
	}

	:global(.report-trigger) {
		align-items: center;
		appearance: none;
		background: transparent;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		color: var(--color-text-muted);
		cursor: pointer;
		display: inline-flex;
		justify-content: center;
		min-block-size: 2.5rem;
		min-inline-size: 2.5rem;
		transition:
			color 120ms ease-out,
			border-color 120ms ease-out;
	}

	:global(.report-trigger:hover) {
		border-color: var(--color-text-muted);
		color: var(--color-text);
	}

	:global(.report-trigger:focus-visible) {
		outline: 3px solid color-mix(in srgb, var(--color-focus), transparent 40%);
		outline-offset: 2px;
	}

	:global(.report-popover) {
		background: var(--color-surface-raised);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		box-shadow: 0 8px 24px hsl(0 0% 0% / 0.12);
		padding: 4px;
		width: min(360px, 90vw);
		z-index: 50;
	}
</style>
