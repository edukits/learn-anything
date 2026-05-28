<script lang="ts">
	import { CheckCircle } from '@lucide/svelte';
	import RichText from './RichText.svelte';

	type FeedbackState = 'correct' | 'incorrect' | 'neutral';

	type QuestionFeedbackProps = {
		content: string;
		state?: FeedbackState;
		class?: string;
	};

	let { content, state = 'neutral', class: className = '' }: QuestionFeedbackProps = $props();
</script>

<div class={['question-feedback', `feedback-${state}`, className]}>
	{#if state === 'correct'}
		<CheckCircle size={20} strokeWidth={2.4} aria-hidden="true" />
	{:else}
		<span class="feedback-marker" aria-hidden="true"></span>
	{/if}

	<RichText {content} class="feedback-content" />
</div>

<style>
	.question-feedback {
		--feedback-accent: var(--color-accent);
		align-items: start;
		background: color-mix(in srgb, var(--feedback-accent), transparent 92%);
		border: 1px solid color-mix(in srgb, var(--feedback-accent), transparent 62%);
		border-radius: var(--radius-md);
		color: var(--color-text);
		display: grid;
		gap: var(--space-3);
		grid-template-columns: auto 1fr;
		margin-block-start: var(--space-4);
		padding: var(--space-4);
	}

	.feedback-correct {
		--feedback-accent: var(--color-success);
	}

	.feedback-incorrect {
		--feedback-accent: var(--color-danger);
	}

	.question-feedback :global(svg) {
		color: var(--feedback-accent);
	}

	.question-feedback :global(.feedback-content) {
		min-inline-size: 0;
	}

	.feedback-marker {
		background: var(--feedback-accent);
		border-radius: 999px;
		block-size: 0.75rem;
		inline-size: 0.75rem;
		margin-block-start: 0.35rem;
	}
</style>
