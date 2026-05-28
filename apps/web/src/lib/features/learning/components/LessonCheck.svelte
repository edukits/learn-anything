<script lang="ts">
	import {
		Button,
		MultipleChoice,
		MultipleSelect,
		NumericAnswer,
		RichText,
		SequencingAnswer,
		ShortAnswer
	} from '@learn-anything/ui';
	import type { NumericAnswerValue, QuizAnswerValue, QuizQuestionResult } from '@learn-anything/ui';
	import { CheckCircle, ChevronLeft, ChevronRight, RotateCcw } from '@lucide/svelte';
	import type { LessonInteraction, QuizQuestionVersion } from '../types';

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
	let choiceAnswers = $state<Record<string, string | null>>({});
	let multipleSelectAnswers = $state<Record<string, string[]>>({});
	let numericAnswers = $state<Record<string, string>>({});
	let numericUnits = $state<Record<string, string | null>>({});
	let shortAnswers = $state<Record<string, string>>({});
	let sequenceAnswers = $state<Record<string, string[]>>({});
	let questionResults = $state<Record<string, QuizQuestionResult>>({});
	let resetTokens = $state<Record<string, number>>({});

	let activeQuestion = $derived(interaction.questions[questionIndex]);
	let hasMultipleQuestions = $derived(interaction.questions.length > 1);

	function getQuestionTitle() {
		return interaction.title.trim() || 'Check';
	}

	function getAnswerOptions(question: QuizQuestionVersion) {
		return question.choices.map((choice) => ({
			value: choice.id,
			label: choice.label
		}));
	}

	function getSequenceItems(question: QuizQuestionVersion) {
		return (question.sequence_items ?? []).map((item) => ({
			value: item.id,
			label: item.label
		}));
	}

	function getInitialSequenceAnswer(question: QuizQuestionVersion) {
		return (question.sequence_items ?? []).toReversed().map((item) => item.id);
	}

	function getQuestionResult(question: QuizQuestionVersion) {
		return questionResults[question.question_id];
	}

	function isQuestionSubmitted(question: QuizQuestionVersion) {
		return getQuestionResult(question)?.answered === true;
	}

	function getQuestionResetKey(question: QuizQuestionVersion) {
		return `${question.question_id}:${resetTokens[question.question_id] ?? 0}`;
	}

	function getChoiceAnswer(question: QuizQuestionVersion) {
		return choiceAnswers[question.question_id] ?? null;
	}

	function getMultipleSelectAnswer(question: QuizQuestionVersion) {
		return multipleSelectAnswers[question.question_id] ?? [];
	}

	function getNumericAnswer(question: QuizQuestionVersion) {
		return numericAnswers[question.question_id] ?? '';
	}

	function getNumericUnit(question: QuizQuestionVersion) {
		return numericUnits[question.question_id] ?? null;
	}

	function getShortAnswer(question: QuizQuestionVersion) {
		return shortAnswers[question.question_id] ?? '';
	}

	function getSequenceAnswer(question: QuizQuestionVersion) {
		return sequenceAnswers[question.question_id] ?? getInitialSequenceAnswer(question);
	}

	function setChoiceAnswer(question: QuizQuestionVersion, value: string) {
		choiceAnswers = {
			...choiceAnswers,
			[question.question_id]: value
		};
	}

	function setMultipleSelectAnswer(question: QuizQuestionVersion, value: string[]) {
		multipleSelectAnswers = {
			...multipleSelectAnswers,
			[question.question_id]: value
		};
	}

	function setNumericAnswer(question: QuizQuestionVersion, value: NumericAnswerValue) {
		numericAnswers = {
			...numericAnswers,
			[question.question_id]: value.value
		};
		numericUnits = {
			...numericUnits,
			[question.question_id]: value.unit ?? null
		};
	}

	function setShortAnswer(question: QuizQuestionVersion, value: string) {
		shortAnswers = {
			...shortAnswers,
			[question.question_id]: value
		};
	}

	function setSequenceAnswer(question: QuizQuestionVersion, value: string[]) {
		sequenceAnswers = {
			...sequenceAnswers,
			[question.question_id]: value
		};
	}

	function recordQuestionResult(
		question: QuizQuestionVersion,
		value: QuizAnswerValue,
		correct: boolean | null
	) {
		const nextResults = {
			...questionResults,
			[question.question_id]: {
				questionId: question.question_id,
				value,
				correct,
				answered: true
			}
		};

		questionResults = nextResults;

		if (!interaction.questions.every((item) => nextResults[item.question_id]?.answered)) {
			return;
		}

		oncomplete?.(interaction.questions.map((item) => nextResults[item.question_id]));
	}

	function retryQuestion(question: QuizQuestionVersion) {
		const {
			[question.question_id]: _questionResult,
			...remainingResults
		} = questionResults;
		const { [question.question_id]: _choiceAnswer, ...remainingChoiceAnswers } = choiceAnswers;
		const {
			[question.question_id]: _multipleSelectAnswer,
			...remainingMultipleSelectAnswers
		} = multipleSelectAnswers;
		const { [question.question_id]: _numericAnswer, ...remainingNumericAnswers } = numericAnswers;
		const { [question.question_id]: _numericUnit, ...remainingNumericUnits } = numericUnits;
		const { [question.question_id]: _shortAnswer, ...remainingShortAnswers } = shortAnswers;
		const { [question.question_id]: _sequenceAnswer, ...remainingSequenceAnswers } =
			sequenceAnswers;

		questionResults = remainingResults;
		choiceAnswers = remainingChoiceAnswers;
		multipleSelectAnswers = remainingMultipleSelectAnswers;
		numericAnswers = remainingNumericAnswers;
		numericUnits = remainingNumericUnits;
		shortAnswers = remainingShortAnswers;
		sequenceAnswers = remainingSequenceAnswers;
		resetTokens = {
			...resetTokens,
			[question.question_id]: (resetTokens[question.question_id] ?? 0) + 1
		};
	}

	function previousQuestion() {
		questionIndex = Math.max(0, questionIndex - 1);
	}

	function nextQuestion() {
		questionIndex = Math.min(interaction.questions.length - 1, questionIndex + 1);
	}

	function goToQuestion(nextIndex: number) {
		questionIndex = nextIndex;
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
					{#each interaction.questions as question, index (question.question_id)}
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
					disabled={questionIndex === interaction.questions.length - 1}
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
				<RichText content={question.prompt} />
			</div>

			<div class="answer" data-response-type={question.response_type}>
				{#key getQuestionResetKey(question)}
					{#if question.response_type === 'multiple_choice'}
						<MultipleChoice
							options={getAnswerOptions(question)}
							value={getChoiceAnswer(question)}
							name={`lesson-check-${question.question_id}`}
							correctValue={question.correct_choice_id}
							submitted={isQuestionSubmitted(question)}
							interactionMode="instant-submit"
							celebrations={false}
							onselect={(value) => setChoiceAnswer(question, value)}
							onsubmit={(submitResult) =>
								recordQuestionResult(question, submitResult.value, submitResult.correct)}
						/>
					{:else if question.response_type === 'multiple_select'}
						<MultipleSelect
							options={getAnswerOptions(question)}
							value={getMultipleSelectAnswer(question)}
							name={`lesson-check-${question.question_id}`}
							correctValues={question.correct_choice_ids}
							submitted={isQuestionSubmitted(question)}
							showSubmitButton
							submitLabel="Check"
							celebrations={false}
							onselect={(value) => setMultipleSelectAnswer(question, value)}
							onsubmit={(submitResult) =>
								recordQuestionResult(question, submitResult.value, submitResult.correct)}
						/>
					{:else if question.response_type === 'numeric'}
						<NumericAnswer
							value={getNumericAnswer(question)}
							unit={getNumericUnit(question)}
							name={`lesson-check-${question.question_id}`}
							placeholder="Type a number"
							acceptedValues={typeof question.correct_numeric_value === 'number'
								? [
										{
											value: question.correct_numeric_value,
											tolerance: {
												type: 'absolute',
												value: question.correct_numeric_tolerance ?? 0
											}
										}
									]
								: null}
							submitted={isQuestionSubmitted(question)}
							submitLabel="Check"
							celebrations={false}
							oninput={(value) => setNumericAnswer(question, value)}
							onsubmit={(submitResult) => {
								const value = {
									value: submitResult.value,
									unit: submitResult.unit ?? null
								};
								recordQuestionResult(question, value, submitResult.correct);
							}}
						/>
					{:else if question.response_type === 'sequencing'}
						<SequencingAnswer
							items={getSequenceItems(question)}
							value={getSequenceAnswer(question)}
							name={`lesson-check-${question.question_id}`}
							correctOrder={(question.sequence_items ?? []).map((item) => item.id)}
							submitted={isQuestionSubmitted(question)}
							showSubmitButton
							submitLabel="Check"
							celebrations={false}
							onreorder={(value) => setSequenceAnswer(question, value)}
							onsubmit={(submitResult) =>
								recordQuestionResult(question, submitResult.value, submitResult.correct)}
						/>
					{:else if question.response_type === 'short_answer'}
						<ShortAnswer
							value={getShortAnswer(question)}
							name={`lesson-check-${question.question_id}`}
							placeholder="Type your answer"
							acceptedAnswers={question.accepted_answers}
							matchMode="normalized"
							submitted={isQuestionSubmitted(question)}
							submitLabel="Check"
							celebrations={false}
							oninput={(value) => setShortAnswer(question, value)}
							onsubmit={(submitResult) =>
								recordQuestionResult(question, submitResult.value, submitResult.correct)}
						/>
					{/if}
				{/key}
			</div>

			{#if result && question.explanation}
				<div
					class={[
						'feedback',
						result.correct === true && 'correct',
						result.correct === false && 'incorrect'
					]}
				>
					<RichText content={question.explanation} />
				</div>
			{/if}
		</div>

		{#if result || error}
			<footer class="check-footer">
				{#if result}
					<Button variant="ghost" size="sm" onclick={() => retryQuestion(question)}>
						<RotateCcw size={15} strokeWidth={2.4} aria-hidden="true" />
						Try again
					</Button>
				{/if}

				{#if error}
					<p class="submit-error">{error}</p>
				{/if}
			</footer>
		{/if}
	{/if}
</section>

<style>
	.lesson-check {
		background: var(--color-surface-raised);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		box-shadow: 0 1px 0 rgb(255 255 255 / 0.68) inset;
		display: grid;
		gap: var(--space-5);
		margin-block: var(--space-4);
		padding: var(--space-5);
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

	.feedback {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		color: var(--color-text-muted);
		font-size: 0.9375rem;
		line-height: 1.55;
		padding: var(--space-4);
	}

	.feedback.correct {
		background: color-mix(in srgb, var(--color-success), var(--color-surface) 92%);
		border-color: color-mix(in srgb, var(--color-success), var(--color-border) 44%);
	}

	.feedback.incorrect {
		background: color-mix(in srgb, var(--color-danger), var(--color-surface) 94%);
		border-color: color-mix(in srgb, var(--color-danger), var(--color-border) 48%);
	}

	.feedback :global(p) {
		margin-block: 0;
	}

	.check-footer {
		align-items: center;
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		justify-content: space-between;
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
