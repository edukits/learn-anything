<script lang="ts">
	import Question from '../../lib/components/quiz/Question.svelte';
	import type {
		MultipleChoiceInteractionMode,
		MultipleChoiceOptionData
	} from '../../lib/components/quiz/types';
	import QuestionResponseStory from './QuestionResponseStory.svelte';
	import type { MultipleChoiceQuestionResponse, QuestionResponse } from './questionResponse';

	type QuizQuestionStoryProps = {
		eyebrow?: string;
		question: string;
		description?: string;
		response?: QuestionResponse;
		options?: MultipleChoiceOptionData[];
		value?: string | null;
		name?: string;
		disabled?: boolean;
		interactionMode?: MultipleChoiceInteractionMode;
		correctValue?: string | null;
		submitted?: boolean;
		showSubmitButton?: boolean;
		submitLabel?: string;
	};

	let {
		eyebrow,
		question,
		description,
		response,
		options = [],
		value = $bindable<string | null>(null),
		name = 'quiz-question',
		disabled = false,
		interactionMode = 'submit',
		correctValue = null,
		submitted = $bindable(false),
		showSubmitButton = false,
		submitLabel = 'Submit answer'
	}: QuizQuestionStoryProps = $props();

	let responseConfig = $derived(
		response ??
			({
				type: 'multiple-choice',
				options,
				value,
				correctValue,
				interactionMode
			} satisfies MultipleChoiceQuestionResponse)
	);
</script>

<div class="story">
	<div class="question-panel">
		<Question {eyebrow} {question} {description}>
			<QuestionResponseStory
				response={responseConfig}
				bind:submitted
				{name}
				{disabled}
				{showSubmitButton}
				{submitLabel}
				legend={question}
			/>
		</Question>
	</div>
</div>

<style>
	.story {
		background:
			linear-gradient(
				90deg,
				color-mix(in srgb, var(--color-border), transparent 72%) 1px,
				transparent 1px
			),
			linear-gradient(
				color-mix(in srgb, var(--color-border), transparent 78%) 1px,
				transparent 1px
			),
			var(--color-surface-raised);
		background-size: 2rem 2rem;
		display: grid;
		min-block-size: 34rem;
		padding: var(--space-8);
		place-items: center;
	}

	.question-panel {
		background: var(--color-surface);
		border: 1px solid color-mix(in srgb, var(--color-border), transparent 12%);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-md);
		inline-size: min(100%, 28rem);
		padding: var(--space-6);
	}

	@media (max-width: 560px) {
		.story {
			padding: var(--space-4);
		}

		.question-panel {
			border-radius: var(--radius-md);
			padding: var(--space-5);
		}
	}
</style>
