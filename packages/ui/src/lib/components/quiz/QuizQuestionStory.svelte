<script lang="ts">
	import MultipleChoice from './MultipleChoice.svelte';
	import Question from './Question.svelte';
	import type { MultipleChoiceOptionData } from './types';

	type QuizQuestionStoryProps = {
		eyebrow?: string;
		question: string;
		description?: string;
		options: MultipleChoiceOptionData[];
		value?: string | null;
		name?: string;
		disabled?: boolean;
	};

	let {
		eyebrow,
		question,
		description,
		options,
		value = $bindable<string | null>(null),
		name = 'quiz-question',
		disabled = false
	}: QuizQuestionStoryProps = $props();

</script>

<div class="quiz-story">
	<Question {eyebrow} {question} {description}>
		<MultipleChoice bind:value {options} {name} {disabled} legend={question} />
	</Question>
</div>

<style>
	.quiz-story {
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
		.quiz-story {
			padding: var(--space-4);
		}
	}
</style>
