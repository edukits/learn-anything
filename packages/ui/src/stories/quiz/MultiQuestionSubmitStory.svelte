<script lang="ts">
	import Button from '../../lib/components/Button.svelte';
	import MultipleChoice from '../../lib/components/quiz/MultipleChoice.svelte';
	import Question from '../../lib/components/quiz/Question.svelte';
	import type { MultipleChoiceOptionData } from '../../lib/components/quiz/types';

	type MultiQuestionData = {
		id: 'spacing' | 'http';
		eyebrow: string;
		question: string;
		correctValue: string;
		options: MultipleChoiceOptionData[];
	};

	const questions: MultiQuestionData[] = [
		{
			id: 'spacing',
			eyebrow: 'Learning science',
			question: 'Which strategy best strengthens long-term recall?',
			correctValue: 'retrieval',
			options: [
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
			]
		},
		{
			id: 'http',
			eyebrow: 'Web fundamentals',
			question: 'Which HTTP status code means a resource was not found?',
			correctValue: '404',
			options: [
				{
					value: '200',
					label: '200 OK'
				},
				{
					value: '301',
					label: '301 Moved Permanently'
				},
				{
					value: '404',
					label: '404 Not Found'
				},
				{
					value: '500',
					label: '500 Internal Server Error'
				}
			]
		}
	];

	let answers = $state<Record<MultiQuestionData['id'], string | null>>({
		spacing: 'highlighting',
		http: null
	});
	let submitted = $state(false);

	let answeredCount = $derived(Object.values(answers).filter(Boolean).length);
	let allAnswered = $derived(answeredCount === questions.length);
	let correctCount = $derived(
		questions.filter((question) => answers[question.id] === question.correctValue).length
	);

	function submitQuiz() {
		if (!allAnswered || submitted) {
			return;
		}

		submitted = true;
	}

	function resetQuiz() {
		answers = {
			spacing: 'highlighting',
			http: null
		};
		submitted = false;
	}
</script>

<div class="multi-quiz-story">
	<div class="multi-quiz-story__content">
		<div class="multi-quiz-story__questions">
			{#each questions as quizQuestion (quizQuestion.id)}
				<Question eyebrow={quizQuestion.eyebrow} question={quizQuestion.question}>
					<MultipleChoice
						bind:value={answers[quizQuestion.id]}
						options={quizQuestion.options}
						name={`multi-submit-${quizQuestion.id}`}
						legend={quizQuestion.question}
						correctValue={quizQuestion.correctValue}
						{submitted}
					/>
				</Question>
			{/each}
		</div>

		<div class="multi-quiz-story__actions">
			<Button
				variant="primary"
				label="Submit quiz"
				disabled={!allAnswered || submitted}
				onclick={submitQuiz}
			/>
			<Button variant="ghost" label="Reset" onclick={resetQuiz} />

			<p class="multi-quiz-story__status">
				{#if submitted}
					{correctCount} of {questions.length} correct
				{:else}
					{answeredCount} of {questions.length} answered
				{/if}
			</p>
		</div>
	</div>
</div>

<style>
	.multi-quiz-story {
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

	.multi-quiz-story__content {
		display: grid;
		gap: var(--space-5);
		inline-size: min(100%, 56rem);
	}

	.multi-quiz-story__questions {
		align-items: start;
		display: grid;
		gap: var(--space-5);
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	.multi-quiz-story__questions :global(.la-question) {
		inline-size: 100%;
	}

	.multi-quiz-story__actions {
		align-items: center;
		background: var(--color-surface);
		border: 1px solid color-mix(in srgb, var(--color-border), transparent 12%);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-sm);
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		justify-content: center;
		padding: var(--space-4);
	}

	.multi-quiz-story__status {
		color: var(--color-text-muted);
		font-size: 0.9375rem;
		font-weight: 700;
		margin-block: 0;
	}

	@media (max-width: 760px) {
		.multi-quiz-story {
			padding: var(--space-4);
		}

		.multi-quiz-story__questions {
			grid-template-columns: 1fr;
		}
	}
</style>
