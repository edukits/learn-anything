<script lang="ts">
	import {
		Button,
		createQuestionResultSoundPlayer,
		initQuizSounds,
		QuestionFeedback,
		QuestionResponse,
		RichText,
		type MathAnswerValue,
		type NumericAnswerValue,
		type QuizQuestionData,
		type QuizQuestionResult
	} from '@learn-anything/ui';
	import { ArrowRight, CheckCircle, ChevronLeft, ChevronRight, RotateCcw } from '@lucide/svelte';
	import { buildLearningQuizQuestions } from '../quiz';
	import type { LessonInteraction } from '../types';

	type LessonCheckProps = {
		interaction: LessonInteraction;
		saved?: boolean;
		saving?: boolean;
		error?: string;
		oncomplete?: (results: QuizQuestionResult[]) => void;
	};

	let {
		interaction,
		saved = false,
		saving = false,
		error = '',
		oncomplete
	}: LessonCheckProps = $props();

	let questionIndex = $state(0);
	let choiceAnswers = $state<Record<string, string | null>>(buildDefaultAnswers(null));
	let multipleSelectAnswers = $state<Record<string, string[]>>(buildDefaultAnswers([]));
	let numericAnswers = $state<Record<string, NumericAnswerValue>>(
		buildDefaultAnswers({ value: '', unit: null })
	);
	let mathAnswers = $state<Record<string, MathAnswerValue>>(
		buildDefaultAnswers({ latex: '', prompts: {} })
	);
	let shortAnswers = $state<Record<string, string>>(buildDefaultAnswers(''));
	let sequenceAnswers = $state<Record<string, string[]>>(buildDefaultAnswers([]));
	let questionResults = $state<Record<string, QuizQuestionResult>>({});
	let questionStartedAt = $state<Record<string, number>>({});
	let resetTokens = $state<Record<string, number>>({});

	const playQuestionResultSound = createQuestionResultSoundPlayer();

	let questions = $derived(
		buildLearningQuizQuestions(interaction.questions, {
			instantFeedback: true,
			shuffleSeed: interaction.choiceShuffleSeed
		})
	);
	let activeQuestion = $derived(questions[questionIndex]);
	let hasMultipleQuestions = $derived(questions.length > 1);

	initQuizSounds();

	$effect(() => {
		if (!activeQuestion) return;
		questionStartedAt[activeQuestion.id] ??= Date.now();
	});

	function buildDefaultAnswers<T>(value: T): Record<string, T> {
		return Object.fromEntries(
			interaction.questions.map((question) => [question.question_id, structuredClone(value)])
		);
	}

	function resetQuestionAnswers(question: QuizQuestionData) {
		choiceAnswers = {
			...choiceAnswers,
			[question.id]: null
		};
		multipleSelectAnswers = {
			...multipleSelectAnswers,
			[question.id]: []
		};
		numericAnswers = {
			...numericAnswers,
			[question.id]: { value: '', unit: null }
		};
		mathAnswers = {
			...mathAnswers,
			[question.id]: { latex: '', prompts: {} }
		};
		shortAnswers = {
			...shortAnswers,
			[question.id]: ''
		};
		sequenceAnswers = {
			...sequenceAnswers,
			[question.id]: []
		};
	}

	function getQuestionTitle() {
		return interaction.title.trim() || 'Check';
	}

	function getQuestionResult(question: QuizQuestionData) {
		return questionResults[question.id];
	}

	function isQuestionSubmitted(question: QuizQuestionData) {
		return getQuestionResult(question)?.answered === true;
	}

	function getQuestionResetKey(question: QuizQuestionData) {
		return `${question.id}:${resetTokens[question.id] ?? 0}`;
	}

	function recordQuestionResult(result: QuizQuestionResult) {
		const startedAt = questionStartedAt[result.questionId] ?? Date.now();
		const timedResult = {
			...result,
			responseTimeMs: Math.max(0, Math.round(Date.now() - startedAt))
		};
		const nextResults = {
			...questionResults,
			[result.questionId]: timedResult
		};

		questionResults = nextResults;
		playQuestionResultSound(timedResult);

		if (!questions.every((question) => nextResults[question.id]?.answered)) {
			return;
		}

		oncomplete?.(questions.map((question) => nextResults[question.id]));
	}

	function retryQuestion(question: QuizQuestionData) {
		const { [question.id]: _questionResult, ...remainingResults } = questionResults;
		const { [question.id]: _startedAt, ...remainingStartedAt } = questionStartedAt;

		questionResults = remainingResults;
		questionStartedAt = remainingStartedAt;
		resetQuestionAnswers(question);
		resetTokens = {
			...resetTokens,
			[question.id]: (resetTokens[question.id] ?? 0) + 1
		};
	}

	function previousQuestion() {
		questionIndex = Math.max(0, questionIndex - 1);
	}

	function nextQuestion() {
		questionIndex = Math.min(questions.length - 1, questionIndex + 1);
	}

	function continueAfterQuestion() {
		nextQuestion();
	}

	function goToQuestion(nextIndex: number) {
		questionIndex = nextIndex;
	}

	function getFeedbackState(result: QuizQuestionResult) {
		if (result.correct === true) return 'correct';
		if (result.correct === false) return 'incorrect';
		return 'neutral';
	}
</script>

<section class="lesson-check" aria-label={getQuestionTitle()}>
	<header class="check-header">
		<div class="title-row">
			<p class="check-title">{getQuestionTitle()}</p>

			{#if error}
				<span class="save-state error">Not saved</span>
			{:else if saving}
				<span class="save-state saving">Saving...</span>
			{:else if saved}
				<span class="save-state saved">
					<CheckCircle size={14} strokeWidth={2.6} aria-hidden="true" />
					Saved
				</span>
			{/if}
		</div>

		{#if hasMultipleQuestions}
			<nav class="question-nav" aria-label="Check questions">
				<button
					type="button"
					class="nav-button"
					disabled={questionIndex === 0}
					aria-label="Previous question"
					onclick={previousQuestion}
				>
					<ChevronLeft size={18} strokeWidth={2.4} aria-hidden="true" />
				</button>

				<div class="question-dots">
					{#each questions as question, index (question.id)}
						<button
							type="button"
							class={[
								'dot',
								index === questionIndex && 'active',
								isQuestionSubmitted(question) && 'answered'
							]}
							aria-label={`Question ${index + 1}`}
							aria-current={index === questionIndex ? 'step' : undefined}
							onclick={() => goToQuestion(index)}
						></button>
					{/each}
				</div>

				<button
					type="button"
					class="nav-button"
					disabled={questionIndex === questions.length - 1}
					aria-label="Next question"
					onclick={nextQuestion}
				>
					<ChevronRight size={18} strokeWidth={2.4} aria-hidden="true" />
				</button>
			</nav>
		{/if}
	</header>

	{#if activeQuestion}
		{@const question = activeQuestion}
		{@const result = getQuestionResult(question)}

		<div class="question-body">
			<div class="prompt">
				<RichText content={question.question} />
			</div>

			<div class="answer" data-response-type={question.response.type ?? 'multiple-choice'}>
				{#key getQuestionResetKey(question)}
					<QuestionResponse
						{question}
						bind:multipleChoiceValue={choiceAnswers[question.id]}
						bind:multipleSelectValue={multipleSelectAnswers[question.id]}
						bind:shortAnswerValue={shortAnswers[question.id]}
						bind:numericAnswerValue={numericAnswers[question.id]}
						bind:mathAnswerValue={mathAnswers[question.id]}
						bind:sequenceValue={sequenceAnswers[question.id]}
						submitted={isQuestionSubmitted(question)}
						name={`lesson-check-${question.id}`}
						interactionMode="instant-submit"
						showSubmitButton
						submitLabel="Check"
						onsubmit={recordQuestionResult}
					/>
				{/key}
			</div>

			{#if result && question.feedback}
				<QuestionFeedback content={question.feedback} state={getFeedbackState(result)} />
			{/if}
		</div>

		{#if result || error}
			<footer class="check-footer">
				<div class="check-footer-left">
					{#if result}
						<Button
							variant={result.correct === false ? 'primary' : 'ghost'}
							size="sm"
							onclick={() => retryQuestion(question)}
						>
							<RotateCcw size={15} strokeWidth={2.4} aria-hidden="true" />
							Try again
						</Button>
					{/if}

					{#if error}
						<p class="submit-error">{error}</p>
					{/if}
				</div>

				{#if result && result.correct === true && questionIndex < questions.length - 1}
					<Button size="sm" onclick={continueAfterQuestion}>
						Continue
						<ArrowRight size={15} strokeWidth={2.4} aria-hidden="true" />
					</Button>
				{/if}
			</footer>
		{/if}
	{/if}
</section>

<style>
	.lesson-check {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		display: grid;
		gap: var(--space-4);
		margin-block: var(--space-4);
		margin-inline: calc(-1 * var(--space-6));
		padding: var(--space-6);
	}

	.check-header {
		align-items: center;
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		justify-content: space-between;
	}

	.title-row {
		align-items: center;
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		min-inline-size: 0;
	}

	.check-title {
		color: var(--color-text-muted);
		font-size: 0.8125rem;
		font-weight: 800;
		letter-spacing: 0;
		line-height: 1.2;
		margin: 0;
		text-transform: uppercase;
	}

	.save-state {
		align-items: center;
		border-radius: 999px;
		display: inline-flex;
		font-size: 0.8125rem;
		font-weight: 700;
		gap: 0.25rem;
		line-height: 1;
		padding: 0.25rem 0.5rem;
	}

	.save-state.saved {
		background: color-mix(in srgb, var(--color-success), transparent 88%);
		color: var(--color-success);
	}

	.save-state.saving {
		background: color-mix(in srgb, var(--color-accent), transparent 90%);
		color: var(--color-accent);
	}

	.save-state.error {
		background: color-mix(in srgb, var(--color-danger), transparent 90%);
		color: var(--color-danger);
	}

	.question-nav {
		align-items: center;
		display: flex;
		gap: var(--space-2);
	}

	.nav-button,
	.dot {
		appearance: none;
		background: transparent;
		border: 0;
		cursor: pointer;
		padding: 0;
	}

	.nav-button {
		align-items: center;
		block-size: 2rem;
		border-radius: var(--radius-sm);
		color: var(--color-text-muted);
		display: inline-flex;
		inline-size: 2rem;
		justify-content: center;
	}

	.nav-button:hover:not(:disabled) {
		background: color-mix(in srgb, var(--color-accent), transparent 92%);
		color: var(--color-accent);
	}

	.nav-button:disabled {
		cursor: not-allowed;
		opacity: 0.42;
	}

	.question-dots {
		align-items: center;
		display: flex;
		gap: 0.4rem;
	}

	.dot {
		background: color-mix(in srgb, var(--color-text-muted), transparent 68%);
		block-size: 0.55rem;
		border-radius: 999px;
		inline-size: 0.55rem;
	}

	.dot.answered {
		background: var(--color-success);
	}

	.dot.active {
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-focus), transparent 52%);
	}

	.nav-button:focus-visible,
	.dot:focus-visible {
		outline: 3px solid color-mix(in srgb, var(--color-focus), transparent 42%);
		outline-offset: 2px;
	}

	.question-body {
		display: grid;
		gap: var(--space-5);
	}

	.prompt {
		color: var(--color-text);
		font-size: 1.0625rem;
		font-weight: 700;
		line-height: 1.45;
		max-inline-size: 44rem;
	}

	.prompt :global(p) {
		margin-block: 0;
	}

	.answer {
		display: grid;
		gap: var(--space-4);
	}

	.check-footer {
		align-items: center;
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		justify-content: space-between;
	}

	.check-footer-left {
		align-items: center;
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
	}

	.submit-error {
		color: var(--color-danger);
		font-size: 0.875rem;
		font-weight: 700;
		margin: 0;
	}

	@media (max-width: 560px) {
		.lesson-check {
			padding: var(--space-4);
		}

		.check-header {
			align-items: stretch;
			display: grid;
		}

		.question-nav {
			justify-content: space-between;
		}
	}
</style>
