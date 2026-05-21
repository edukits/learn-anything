<script lang="ts">
	import MultipleChoice from '../../lib/components/quiz/MultipleChoice.svelte';
	import Question from '../../lib/components/quiz/Question.svelte';
	import type {
		MultipleChoiceInteractionMode,
		MultipleChoiceOptionData
	} from '../../lib/components/quiz/types';

	type QuizQuestionStoryProps = {
		eyebrow?: string;
		question: string;
		description?: string;
		options: MultipleChoiceOptionData[];
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
		options,
		value = $bindable<string | null>(null),
		name = 'quiz-question',
		disabled = false,
		interactionMode = 'submit',
		correctValue = null,
		submitted = $bindable(false),
		showSubmitButton = false,
		submitLabel = 'Submit answer'
	}: QuizQuestionStoryProps = $props();

	let resolvedCorrectValue = $derived(
		correctValue ?? options.find((option) => option.state === 'correct')?.value ?? null
	);
	let displayOptions = $derived(
		resolvedCorrectValue === null
			? options
			: options.map((option) => ({
					value: option.value,
					label: option.label,
					description: option.description,
					disabled: option.disabled
				}))
	);
</script>

<div class="story">
	<Question {eyebrow} {question} {description}>
		<MultipleChoice
			bind:value
			bind:submitted
			options={displayOptions}
			{name}
			{disabled}
			{interactionMode}
			correctValue={resolvedCorrectValue}
			{showSubmitButton}
			{submitLabel}
			legend={question}
		/>
	</Question>
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

	@media (max-width: 560px) {
		.story {
			padding: var(--space-4);
		}
	}
</style>
