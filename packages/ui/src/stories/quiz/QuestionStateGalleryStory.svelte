<script lang="ts">
	import MultipleChoice from '../../lib/components/quiz/MultipleChoice.svelte';
	import Question from '../../lib/components/quiz/Question.svelte';
	import type {
		MultipleChoiceInteractionMode,
		MultipleChoiceOptionData
	} from '../../lib/components/quiz/types';

	type StateExample = {
		id: string;
		eyebrow: string;
		value: string | null;
		submitted: boolean;
		showSubmitButton?: boolean;
		interactionMode?: MultipleChoiceInteractionMode;
	};

	const question = 'Which strategy best strengthens long-term recall?';
	const correctValue = 'retrieval';
	const options: MultipleChoiceOptionData[] = [
		{
			value: 'retrieval',
			label: 'Retrieval practice',
			description: 'Trying to answer from memory before checking notes.'
		},
		{
			value: 'highlighting',
			label: 'Highlighting',
			description: 'Marking sentences while reading a chapter.'
		},
		{
			value: 'rereading',
			label: 'Rereading',
			description: 'Reading the same passage several times in a row.'
		}
	];

	const examples: StateExample[] = [
		{
			id: 'empty',
			eyebrow: 'Submit based - unanswered',
			value: null,
			submitted: false,
			showSubmitButton: true
		},
		{
			id: 'selected',
			eyebrow: 'Submit based - selected',
			value: 'highlighting',
			submitted: false,
			showSubmitButton: true
		},
		{
			id: 'correct',
			eyebrow: 'Reviewed - correct',
			value: 'retrieval',
			submitted: true
		},
		{
			id: 'incorrect',
			eyebrow: 'Reviewed - incorrect',
			value: 'highlighting',
			submitted: true
		},
		{
			id: 'instant',
			eyebrow: 'Instant submit',
			value: null,
			submitted: false,
			interactionMode: 'instant-submit'
		}
	];
</script>

<div class="story">
	<div class="grid">
		{#each examples as example (example.id)}
			<Question eyebrow={example.eyebrow} {question} style="inline-size: 100%;">
				<MultipleChoice
					{options}
					value={example.value}
					name={`question-state-${example.id}`}
					legend={question}
					{correctValue}
					submitted={example.submitted}
					showSubmitButton={example.showSubmitButton}
					interactionMode={example.interactionMode ?? 'submit'}
				/>
			</Question>
		{/each}
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
		min-block-size: 42rem;
		padding: var(--space-8);
		place-items: center;
	}

	.grid {
		align-items: start;
		display: grid;
		gap: var(--space-5);
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr));
		inline-size: min(100%, 72rem);
	}

	@media (max-width: 560px) {
		.story {
			padding: var(--space-4);
		}
	}
</style>
