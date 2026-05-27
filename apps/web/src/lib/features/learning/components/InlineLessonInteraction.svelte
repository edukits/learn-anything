<script lang="ts">
	import ActionSubmitter from './ActionSubmitter.svelte';
	import { buildLearningQuizQuestions, buildSubmittedAnswersPayload } from '../quiz';
	import { Quiz } from '@learn-anything/ui';
	import type { QuizQuestionResult } from '@learn-anything/ui';
	import { CheckCircle } from '@lucide/svelte';
	import type { LessonInteraction } from '../types';

	type InlineLessonInteractionProps = {
		interaction: LessonInteraction;
	};

	let { interaction }: InlineLessonInteractionProps = $props();

	let answersPayload = $state('[]');
	let submitKey = $state(0);
	let questionIndex = $state(0);
	let quizQuestions = $derived(
		buildLearningQuizQuestions(interaction.questions, { instantFeedback: true })
	);

	function completeInteraction(results: QuizQuestionResult[]) {
		answersPayload = buildSubmittedAnswersPayload(interaction.questions, results);
		submitKey += 1;
	}
</script>

<section class="inline-interaction" data-completed={interaction.completed}>
	{#if interaction.completed}
		<div class="completed">
			<CheckCircle size={20} strokeWidth={2.4} aria-hidden="true" />
			<p>{interaction.title} completed</p>
		</div>
	{:else}
		<Quiz
			questions={quizQuestions}
			title={interaction.title}
			bind:currentPageIndex={questionIndex}
			questionsPerPage={1}
			celebrations={false}
			class="inline-quiz"
			oncomplete={completeInteraction}
		/>

		<ActionSubmitter
			action="?/submitInteraction"
			{submitKey}
			fields={{
				interactionSlug: interaction.slug,
				answers: answersPayload,
				submissionKey: interaction.submissionKey
			}}
		/>
	{/if}
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

	@media (max-width: 560px) {
		.inline-interaction {
			padding: 14px;
		}
	}
</style>
