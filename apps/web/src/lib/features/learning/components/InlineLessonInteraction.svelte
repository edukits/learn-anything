<script lang="ts">
	import ActionSubmitter from './ActionSubmitter.svelte';
	import { buildLearningQuizQuestions, buildSubmittedAnswersPayload } from '../quiz';
	import { Quiz } from '@learn-anything/ui';
	import type { QuizQuestionResult } from '@learn-anything/ui';
	import type { ActionResult } from '@sveltejs/kit';
	import { CheckCircle } from '@lucide/svelte';
	import type { LessonInteraction } from '../types';

	type InlineLessonInteractionProps = {
		interaction: LessonInteraction;
		oncompleted?: (slug: string) => void;
	};

	let { interaction, oncompleted }: InlineLessonInteractionProps = $props();

	let answersPayload = $state('[]');
	let error = $state('');
	let locallyCompleted = $state(false);
	let currentSubmissionKey = $state('');
	let submitKey = $state(0);
	let questionIndex = $state(0);
	let completed = $derived(interaction.completed || locallyCompleted);
	let quizQuestions = $derived(
		buildLearningQuizQuestions(interaction.questions, { instantFeedback: true })
	);

	function completeInteraction(results: QuizQuestionResult[]) {
		error = '';
		answersPayload = buildSubmittedAnswersPayload(interaction.questions, results);
		currentSubmissionKey = `${interaction.submissionKey}:${crypto.randomUUID()}`;
		submitKey += 1;
	}

	function handleSubmitResult(result: ActionResult) {
		if (result.type === 'success') {
			locallyCompleted = true;
			error = '';
			oncompleted?.(interaction.slug);
			return;
		}

		if (result.type === 'failure') {
			error =
				typeof result.data?.error === 'string' ? result.data.error : 'Unable to submit this check.';
			return;
		}

		error = 'Unable to submit this check.';
	}
</script>

<section class="inline-interaction" data-completed={completed}>
	<Quiz
		questions={quizQuestions}
		title={interaction.title}
		bind:currentPageIndex={questionIndex}
		questionsPerPage={1}
		celebrations={false}
		class="inline-quiz"
		oncomplete={completeInteraction}
	/>

	{#if locallyCompleted}
		<div class="completed">
			<CheckCircle size={20} strokeWidth={2.4} aria-hidden="true" />
			<p>Saved</p>
		</div>
	{/if}

	{#if error}
		<p class="submit-error">{error}</p>
	{/if}

	<ActionSubmitter
		action="?/submitInteraction"
		background
		{submitKey}
		fields={{
			interactionSlug: interaction.slug,
			answers: answersPayload,
			submissionKey: currentSubmissionKey
		}}
		onresult={handleSubmitResult}
	/>
</section>

<style>
	.inline-interaction {
		display: grid;
		gap: 16px;
		margin-block: 10px;
	}

	.inline-interaction :global(.assessment) {
		max-inline-size: 100%;
	}

	.inline-interaction :global(.assessment-header) {
		gap: 8px;
	}

	.inline-interaction :global(.assessment-header h2) {
		font-size: 1.25rem;
	}

	.inline-interaction :global(.prompt-short) {
		font-size: 1.125rem;
	}

	.inline-interaction :global(.prompt-medium),
	.inline-interaction :global(.prompt-long),
	.inline-interaction :global(.prompt-extra-long) {
		font-size: 1rem;
	}

	.inline-interaction :global(.assessment-actions) {
		justify-content: start;
	}

	.completed {
		align-items: center;
		display: flex;
		gap: 10px;
	}

	.completed :global(svg) {
		color: var(--color-success);
	}

	.completed p {
		color: var(--color-text);
		font-size: 0.95rem;
		font-weight: 700;
		margin: 0;
	}

	.submit-error {
		color: var(--color-danger, #b91c1c);
		font-size: 0.95rem;
		font-weight: 700;
		margin: 0;
	}

	@media (max-width: 560px) {
		.inline-interaction {
			padding: 14px;
		}
	}
</style>
