<script lang="ts">
	import type { PageProps } from './$types';
	import { getTopicRenderer } from '$lib/features/topic-renderers';
	import { Button } from '@learn-anything/ui';
	import { ArrowRight, LockKeyhole } from '@lucide/svelte';

	let { data }: PageProps = $props();

	let appHref = $derived(data.isSignedIn ? data.topic.app_path : '/sign-in');
	let appLabel = $derived(data.isSignedIn ? 'Continue in app' : 'Sign in to practice');
	let RichTextRenderer = $derived(getTopicRenderer(data.topic.slug).RichTextRenderer);
</script>

<main class="page preview-page">
	<article class="preview">
		<div class="heading">
			<p class="eyebrow">Safe preview</p>
			<h1>{data.topic.name}</h1>
		</div>

		<RichTextRenderer content={data.topic.preview_markdown} />

		<div class="locked-note">
			<LockKeyhole size={20} />
			<p>
				Full lessons, quizzes, answer keys, explanations, progress, XP, streaks, and review sessions
				require sign-in.
			</p>
		</div>

		<div class="button-row">
			<Button href={appHref}>{appLabel} <ArrowRight size={16} /></Button>
			<Button href={`/topics/${data.topic.slug}`} variant="secondary" label="Back to topic" />
		</div>
	</article>
</main>

<style>
	.preview-page {
		display: grid;
		max-inline-size: 760px;
		padding-block: 48px 72px;
	}

	.preview {
		display: grid;
		gap: 22px;
	}

	.heading {
		display: grid;
		gap: 8px;
	}

	h1,
	p {
		margin: 0;
	}

	h1 {
		font-size: clamp(2.4rem, 6vw, 4.8rem);
		letter-spacing: 0;
		line-height: 1;
	}

	.locked-note {
		align-items: start;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		display: grid;
		gap: 10px;
		grid-template-columns: auto 1fr;
		padding: 14px;
	}

	.locked-note p {
		color: var(--color-text-muted);
	}
</style>
