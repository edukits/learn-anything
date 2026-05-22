<script lang="ts">
	import { CheckCircle, RotateCcw } from '@lucide/svelte';
	import Button from '../Button.svelte';
	import {
		buildMultipleChoiceAnswers,
		buildMultipleSelectAnswers,
		buildMathAnswers,
		buildNumericAnswers,
		buildPageGroups,
		buildSequenceAnswers,
		buildShortAnswers,
		buildSubmittedState,
		gradeMath,
		getImageChoiceCorrectValue,
		getImageOptionDisplayData,
		getMultipleChoiceCorrectValue,
		getMultipleSelectCorrectValues,
		getOptionDisplayData,
		gradeNumeric,
		gradeShortAnswer,
		hasExactSelection,
		isImageChoiceResponse,
		isMultipleChoiceResponse,
		isMultipleSelectResponse,
		isMathAnswered,
		isMathResponse,
		isNumericAnswered,
		isNumericResponse,
		isSequencingResponse,
		isShortAnswerResponse,
		type QuestionsPerPage
	} from './assessment';
	import ImageChoice from './ImageChoice.svelte';
	import MultipleChoice from './MultipleChoice.svelte';
	import MultipleSelect from './MultipleSelect.svelte';
	import MathAnswer from './MathAnswer.svelte';
	import NumericAnswer from './NumericAnswer.svelte';
	import Question from './Question.svelte';
	import SequencingAnswer from './SequencingAnswer.svelte';
	import ShortAnswer from './ShortAnswer.svelte';
	import type {
		MathAnswerSubmitResult,
		MathAnswerValue,
		NumericAnswerValue,
		QuizPageLayout,
		QuizQuestionData,
		QuizQuestionResult
	} from './types';

	type AssessmentMode = 'quiz' | 'exam';

	type AssessmentProps = {
		mode: AssessmentMode;
		questions: QuizQuestionData[];
		title?: string;
		pages?: QuizPageLayout;
		questionsPerPage?: QuestionsPerPage;
		celebrations?: boolean;
		class?: string;
		onquestionresult?: (result: QuizQuestionResult) => void;
		oncomplete?: (results: QuizQuestionResult[]) => void;
	};

	let {
		mode,
		questions,
		title,
		pages: configuredPages,
		questionsPerPage,
		celebrations = true,
		class: className = '',
		onquestionresult,
		oncomplete
	}: AssessmentProps = $props();

	let currentPageIndex = $state(0);
	let quizComplete = $state(false);
	let examSubmitted = $state(false);
	// svelte-ignore state_referenced_locally
	let questionSubmitted = $state<Record<string, boolean>>(buildSubmittedState(questions, false));
	let results = $state<Record<string, QuizQuestionResult>>({});
	// svelte-ignore state_referenced_locally
	let multipleChoiceAnswers = $state<Record<string, string | null>>(
		buildMultipleChoiceAnswers(questions)
	);
	// svelte-ignore state_referenced_locally
	let multipleSelectAnswers = $state<Record<string, string[]>>(
		buildMultipleSelectAnswers(questions)
	);
	// svelte-ignore state_referenced_locally
	let shortAnswers = $state<Record<string, string>>(buildShortAnswers(questions));
	// svelte-ignore state_referenced_locally
	let numericAnswers = $state<Record<string, NumericAnswerValue>>(buildNumericAnswers(questions));
	// svelte-ignore state_referenced_locally
	let mathAnswers = $state<Record<string, MathAnswerValue>>(buildMathAnswers(questions));
	// svelte-ignore state_referenced_locally
	let sequenceAnswers = $state<Record<string, string[]>>(buildSequenceAnswers(questions));

	let resolvedTitle = $derived(title ?? (mode === 'quiz' ? 'Quiz' : 'Exam'));
	let resolvedQuestionsPerPage = $derived(
		questionsPerPage ?? (mode === 'quiz' ? 1 : ('all' as const))
	);
	let pageGroups = $derived(buildPageGroups(questions, configuredPages, resolvedQuestionsPerPage));
	let currentPage = $derived(pageGroups[currentPageIndex] ?? []);
	let totalQuestions = $derived(questions.length);
	let totalPages = $derived(pageGroups.length);
	let hasMultiplePages = $derived(totalPages > 1);
	let answeredCount = $derived(questions.filter((question) => isQuestionAnswered(question)).length);
	let submittedCount = $derived(
		questions.filter((question) => questionSubmitted[question.id]).length
	);
	let currentPageReady = $derived(
		mode === 'quiz'
			? currentPage.every((question) => questionSubmitted[question.id])
			: currentPage.every((question) => isQuestionAnswered(question))
	);
	let allAnswered = $derived(answeredCount === totalQuestions);
	let resultList = $derived(questions.map((question) => results[question.id]).filter(Boolean));
	let knownResultCount = $derived(resultList.filter((result) => result.correct !== null).length);
	let correctCount = $derived(resultList.filter((result) => result.correct === true).length);
	let progressValue = $derived(
		totalQuestions === 0
			? 0
			: mode === 'quiz'
				? Math.round((submittedCount / totalQuestions) * 100)
				: Math.round((answeredCount / totalQuestions) * 100)
	);

	function isQuestionAnswered(question: QuizQuestionData) {
		const response = question.response;

		if (isMultipleChoiceResponse(response)) {
			return multipleChoiceAnswers[question.id] !== null;
		}

		if (isImageChoiceResponse(response)) {
			return multipleChoiceAnswers[question.id] !== null;
		}

		if (isMultipleSelectResponse(response)) {
			return (multipleSelectAnswers[question.id] ?? []).length > 0;
		}

		if (isShortAnswerResponse(response)) {
			return (shortAnswers[question.id] ?? '').trim().length > 0;
		}

		if (isNumericResponse(response)) {
			return isNumericAnswered(response, numericAnswers[question.id] ?? { value: '', unit: null });
		}

		if (isMathResponse(response)) {
			return isMathAnswered(mathAnswers[question.id] ?? { latex: '', prompts: {} });
		}

		return (sequenceAnswers[question.id] ?? []).length > 0;
	}

	function getQuestionResult(question: QuizQuestionData): QuizQuestionResult {
		const response = question.response;

		if (isMultipleChoiceResponse(response)) {
			const value = multipleChoiceAnswers[question.id] ?? null;
			const correctValue = getMultipleChoiceCorrectValue(response);

			return {
				questionId: question.id,
				value,
				answered: value !== null,
				correct: correctValue === null ? null : value === correctValue
			};
		}

		if (isImageChoiceResponse(response)) {
			const value = multipleChoiceAnswers[question.id] ?? null;
			const correctValue = getImageChoiceCorrectValue(response);

			return {
				questionId: question.id,
				value,
				answered: value !== null,
				correct: correctValue === null ? null : value === correctValue
			};
		}

		if (isMultipleSelectResponse(response)) {
			const value = multipleSelectAnswers[question.id] ?? [];
			const correctValues = getMultipleSelectCorrectValues(response);

			return {
				questionId: question.id,
				value,
				answered: value.length > 0,
				correct: correctValues === null ? null : hasExactSelection(value, correctValues)
			};
		}

		if (isShortAnswerResponse(response)) {
			const value = shortAnswers[question.id] ?? '';

			return {
				questionId: question.id,
				value,
				answered: value.trim().length > 0,
				correct: gradeShortAnswer(response, value).correct
			};
		}

		if (isNumericResponse(response)) {
			const value = numericAnswers[question.id] ?? { value: '', unit: null };
			const result = gradeNumeric(response, value);

			return {
				questionId: question.id,
				value,
				answered: isNumericAnswered(response, value),
				correct: result.correct
			};
		}

		if (isMathResponse(response)) {
			const value = mathAnswers[question.id] ?? { latex: '', prompts: {} };
			const result = gradeMath(response, value);

			return {
				questionId: question.id,
				value,
				answered: isMathAnswered(value),
				correct: result.correct
			};
		}

		if (!isSequencingResponse(response)) {
			return {
				questionId: question.id,
				value: null,
				answered: false,
				correct: null
			};
		}

		const value = sequenceAnswers[question.id] ?? response.items.map((item) => item.value);
		const correct =
			response.correctOrder === null || response.correctOrder === undefined
				? null
				: value.length === response.correctOrder.length &&
					value.every((itemValue, index) => itemValue === response.correctOrder?.[index]);

		return {
			questionId: question.id,
			value,
			answered: value.length > 0,
			correct
		};
	}

	function recordQuestionResult(question: QuizQuestionData) {
		const result = getQuestionResult(question);
		questionSubmitted[question.id] = true;
		results[question.id] = result;
		onquestionresult?.(result);
	}

	function recordMathQuestionResult(question: QuizQuestionData, result: MathAnswerSubmitResult) {
		mathAnswers[question.id] = {
			latex: result.latex,
			prompts: result.prompts
		};
		recordQuestionResult(question);
	}

	function isQuestionFeedbackVisible(question: QuizQuestionData) {
		if (!question.feedback) {
			return false;
		}

		return mode === 'exam' ? examSubmitted : questionSubmitted[question.id];
	}

	function submitExam() {
		if (!allAnswered || examSubmitted) {
			return;
		}

		for (const question of questions) {
			results[question.id] = getQuestionResult(question);
		}

		examSubmitted = true;
		oncomplete?.(questions.map((question) => results[question.id]));
	}

	function goToNextPage() {
		if (currentPageIndex < totalPages - 1) {
			currentPageIndex += 1;
			return;
		}

		if (mode === 'quiz') {
			quizComplete = true;
			oncomplete?.(questions.map((question) => results[question.id]).filter(Boolean));
		}
	}

	function goToPreviousPage() {
		currentPageIndex = Math.max(0, currentPageIndex - 1);
	}

	function resetAssessment() {
		currentPageIndex = 0;
		quizComplete = false;
		examSubmitted = false;
		questionSubmitted = buildSubmittedState(questions, false);
		results = {};
		multipleChoiceAnswers = buildMultipleChoiceAnswers(questions);
		multipleSelectAnswers = buildMultipleSelectAnswers(questions);
		shortAnswers = buildShortAnswers(questions);
		numericAnswers = buildNumericAnswers(questions);
		mathAnswers = buildMathAnswers(questions);
		sequenceAnswers = buildSequenceAnswers(questions);
	}
</script>

<div class={['assessment', className]} data-mode={mode}>
	<header class="assessment-header">
		<div class="title-group">
			<p class="kicker">{mode === 'quiz' ? 'Quiz' : 'Exam'}</p>
			<h2>{resolvedTitle}</h2>
		</div>

		<div class="progress-summary" aria-live="polite">
			{#if mode === 'quiz'}
				{submittedCount} of {totalQuestions} submitted
			{:else if examSubmitted}
				Submitted
			{:else}
				{answeredCount} of {totalQuestions} answered
			{/if}
		</div>

		<div
			class="progress-track"
			role="progressbar"
			aria-label={mode === 'quiz' ? 'Quiz progress' : 'Exam completion'}
			aria-valuemin="0"
			aria-valuemax="100"
			aria-valuenow={progressValue}
		>
			<span class="progress-value" style:--progress={`${progressValue}%`}></span>
		</div>
	</header>

	{#if totalQuestions === 0}
		<div class="empty-state">
			<p>No questions are available.</p>
		</div>
	{:else if mode === 'quiz' && quizComplete}
		<section class="metrics" aria-live="polite">
			<CheckCircle size={32} strokeWidth={2.4} />
			<h3>Quiz complete</h3>
			<p class="score">
				{correctCount} of {knownResultCount} auto-graded questions correct
			</p>
			{#if knownResultCount < totalQuestions}
				<p class="muted">{totalQuestions - knownResultCount} question results need review.</p>
			{/if}
			<Button variant="secondary" onclick={resetAssessment}>
				<span class="button-content">
					<RotateCcw size={16} strokeWidth={2.4} />
					Retake quiz
				</span>
			</Button>
		</section>
	{:else}
		<div class="page-meta">
			<p>
				Page {Math.min(currentPageIndex + 1, totalPages)} of {totalPages}
			</p>
			{#if mode === 'exam' && !examSubmitted}
				<p>{allAnswered ? 'Ready to submit' : 'Complete every question before submitting'}</p>
			{/if}
		</div>

		<div class="question-list">
			{#each currentPage as question, index (question.id)}
				<Question
					eyebrow={question.eyebrow ?? `Question ${currentPageIndex + index + 1}`}
					question={question.question}
					description={question.description}
					class="assessment-question"
				>
					{#if question.response.type === 'numeric'}
						<NumericAnswer
							bind:value={numericAnswers[question.id].value}
							bind:unit={numericAnswers[question.id].unit}
							submitted={mode === 'exam' ? examSubmitted : questionSubmitted[question.id]}
							name={`${mode}-${question.id}`}
							label={question.question}
							placeholder={question.response.placeholder}
							disabled={examSubmitted}
							unitConfig={question.response.unitConfig}
							acceptedValues={question.response.acceptedValues ?? null}
							grader={question.response.grader}
							showSubmitButton={mode === 'quiz'}
							submitLabel="Submit answer"
							celebrations={question.response.celebrations ?? celebrations}
							onsubmit={() => recordQuestionResult(question)}
						/>
					{:else if question.response.type === 'math'}
						<MathAnswer
							bind:value={mathAnswers[question.id].latex}
							submitted={mode === 'exam' ? examSubmitted : questionSubmitted[question.id]}
							name={`${mode}-${question.id}`}
							label={question.question}
							placeholder={question.response.placeholder}
							mathPlaceholder={question.response.mathPlaceholder}
							disabled={examSubmitted}
							template={question.response.template}
							acceptedValues={question.response.acceptedValues ?? null}
							matchMode={question.response.matchMode ?? 'normalized'}
							grader={question.response.grader}
							showSubmitButton={mode === 'quiz'}
							submitLabel="Submit answer"
							celebrations={question.response.celebrations ?? celebrations}
							oninput={(answer) => {
								mathAnswers[question.id] = answer;
							}}
							onsubmit={(result) => recordMathQuestionResult(question, result)}
						/>
					{:else if question.response.type === 'short-answer'}
						<ShortAnswer
							bind:value={shortAnswers[question.id]}
							submitted={mode === 'exam' ? examSubmitted : questionSubmitted[question.id]}
							name={`${mode}-${question.id}`}
							label={question.question}
							placeholder={question.response.placeholder}
							disabled={examSubmitted}
							acceptedAnswers={question.response.acceptedAnswers ?? null}
							matchMode={question.response.matchMode ?? 'normalized'}
							normalizer={question.response.normalizer}
							grader={question.response.grader}
							showSubmitButton={mode === 'quiz'}
							submitLabel="Submit answer"
							celebrations={question.response.celebrations ?? celebrations}
							onsubmit={() => recordQuestionResult(question)}
						/>
					{:else if question.response.type === 'sequencing'}
						<SequencingAnswer
							bind:value={sequenceAnswers[question.id]}
							submitted={mode === 'exam' ? examSubmitted : questionSubmitted[question.id]}
							items={question.response.items}
							name={`${mode}-${question.id}`}
							disabled={examSubmitted}
							correctOrder={question.response.correctOrder ?? null}
							showSubmitButton={mode === 'quiz'}
							submitLabel="Submit answer"
							celebrations={question.response.celebrations ?? celebrations}
							legend={question.question}
							onsubmit={() => recordQuestionResult(question)}
						/>
					{:else if question.response.type === 'multiple-select'}
						<MultipleSelect
							bind:value={multipleSelectAnswers[question.id]}
							submitted={mode === 'exam' ? examSubmitted : questionSubmitted[question.id]}
							options={getMultipleSelectCorrectValues(question.response) === null
								? question.response.options
								: getOptionDisplayData(question.response.options)}
							name={`${mode}-${question.id}`}
							disabled={examSubmitted}
							correctValues={getMultipleSelectCorrectValues(question.response)}
							showSubmitButton={mode === 'quiz'}
							submitLabel="Submit answer"
							celebrations={question.response.celebrations ?? celebrations}
							legend={question.question}
							onsubmit={() => recordQuestionResult(question)}
						/>
					{:else if question.response.type === 'image-choice'}
						<ImageChoice
							bind:value={multipleChoiceAnswers[question.id]}
							submitted={mode === 'exam' ? examSubmitted : questionSubmitted[question.id]}
							options={getImageChoiceCorrectValue(question.response) === null
								? question.response.options
								: getImageOptionDisplayData(question.response.options)}
							name={`${mode}-${question.id}`}
							disabled={examSubmitted}
							interactionMode={mode === 'quiz'
								? (question.response.interactionMode ?? 'instant-submit')
								: 'submit'}
							correctValue={getImageChoiceCorrectValue(question.response)}
							showSubmitButton={mode === 'quiz' && question.response.interactionMode === 'submit'}
							submitLabel="Submit answer"
							celebrations={question.response.celebrations ?? celebrations}
							legend={question.question}
							maxColumns={question.response.maxColumns ?? 4}
							minColumnWidth={question.response.minColumnWidth ?? '9rem'}
							onsubmit={() => recordQuestionResult(question)}
						/>
					{:else}
						<MultipleChoice
							bind:value={multipleChoiceAnswers[question.id]}
							submitted={mode === 'exam' ? examSubmitted : questionSubmitted[question.id]}
							options={getMultipleChoiceCorrectValue(question.response) === null
								? question.response.options
								: getOptionDisplayData(question.response.options)}
							name={`${mode}-${question.id}`}
							disabled={examSubmitted}
							interactionMode={mode === 'quiz' ? 'instant-submit' : 'submit'}
							correctValue={getMultipleChoiceCorrectValue(question.response)}
							showSubmitButton={false}
							celebrations={question.response.celebrations ?? celebrations}
							legend={question.question}
							onsubmit={() => recordQuestionResult(question)}
						/>
					{/if}

					{#if isQuestionFeedbackVisible(question)}
						<div class="question-feedback">
							<CheckCircle size={20} strokeWidth={2.4} />
							<p>{question.feedback}</p>
						</div>
					{/if}
				</Question>
			{/each}
		</div>

		<footer class="assessment-actions">
			{#if hasMultiplePages}
				<Button
					variant="ghost"
					label="Previous"
					disabled={currentPageIndex === 0}
					onclick={goToPreviousPage}
				/>
			{/if}

			{#if mode === 'exam' && currentPageIndex === totalPages - 1}
				<Button
					variant="primary"
					label={examSubmitted ? `${correctCount} of ${knownResultCount} correct` : 'Submit exam'}
					disabled={!allAnswered || examSubmitted}
					onclick={submitExam}
				/>
			{:else}
				<Button
					variant="primary"
					label={mode === 'quiz' && currentPageIndex === totalPages - 1 ? 'View results' : 'Next'}
					disabled={!currentPageReady}
					onclick={goToNextPage}
				/>
			{/if}

			<Button
				variant="secondary"
				label={mode === 'quiz' ? 'Reset quiz' : 'Reset exam'}
				onclick={resetAssessment}
			/>
		</footer>
	{/if}
</div>

<style>
	.assessment {
		display: grid;
		gap: var(--space-5);
		inline-size: min(100%, 52rem);
	}

	.assessment-header {
		display: grid;
		gap: var(--space-3);
	}

	.title-group {
		display: grid;
		gap: var(--space-1);
	}

	.kicker,
	h2,
	.progress-summary,
	.page-meta p,
	.empty-state p,
	.metrics h3,
	.metrics p {
		margin-block: 0;
	}

	.kicker {
		color: var(--color-accent);
		font-size: 0.8125rem;
		font-weight: 700;
		letter-spacing: 0;
		text-transform: uppercase;
	}

	h2 {
		color: var(--color-text);
		font-size: 1.75rem;
	}

	.progress-summary {
		color: var(--color-text-muted);
		font-size: 0.9375rem;
		font-weight: 700;
	}

	.progress-track {
		background: color-mix(in srgb, var(--color-border), transparent 58%);
		border-radius: var(--radius-sm);
		block-size: 0.5rem;
		overflow: hidden;
	}

	.progress-value {
		background: linear-gradient(90deg, var(--color-accent), var(--color-success));
		block-size: 100%;
		display: block;
		inline-size: var(--progress);
		transition: inline-size 180ms ease-out;
	}

	.empty-state,
	.metrics {
		background: var(--color-surface);
		border: 1px solid color-mix(in srgb, var(--color-border), transparent 12%);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-sm);
		display: grid;
		gap: var(--space-4);
		justify-items: start;
		padding: var(--space-6);
	}

	.metrics :global(svg) {
		color: var(--color-success);
	}

	.metrics h3 {
		font-size: 1.375rem;
	}

	.score {
		color: var(--color-text);
		font-size: 1.125rem;
		font-weight: 700;
	}

	.muted,
	.empty-state p {
		color: var(--color-text-muted);
	}

	.page-meta {
		align-items: center;
		color: var(--color-text-muted);
		display: flex;
		flex-wrap: wrap;
		font-size: 0.875rem;
		font-weight: 700;
		gap: var(--space-2) var(--space-4);
		justify-content: space-between;
	}

	.question-list {
		display: grid;
		gap: 0;
	}

	.assessment[data-mode='quiz'] .question-list {
		background: var(--color-surface);
		border: 1px solid color-mix(in srgb, var(--color-border), transparent 12%);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-md);
		padding: var(--space-6);
	}

	.question-list :global(.assessment-question + .assessment-question) {
		border-block-start: 1px solid color-mix(in srgb, var(--color-border), transparent 16%);
		margin-block-start: var(--space-6);
		padding-block-start: var(--space-6);
	}

	.question-feedback {
		align-items: start;
		background: color-mix(in srgb, var(--color-success), transparent 90%);
		border: 1px solid color-mix(in srgb, var(--color-success), transparent 55%);
		border-radius: var(--radius-md);
		color: var(--color-text);
		display: grid;
		gap: var(--space-3);
		grid-template-columns: auto 1fr;
		margin-block-start: var(--space-4);
		padding: var(--space-4);
	}

	.question-feedback :global(svg) {
		color: var(--color-success);
	}

	.question-feedback p {
		margin: 0;
	}

	.assessment-actions {
		align-items: center;
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		justify-content: end;
	}

	.button-content {
		align-items: center;
		display: inline-flex;
		gap: var(--space-2);
	}

	@media (max-width: 560px) {
		.assessment {
			gap: var(--space-4);
		}

		h2 {
			font-size: 1.5rem;
		}

		.assessment-actions {
			align-items: stretch;
			flex-direction: column;
		}

		.assessment[data-mode='quiz'] .question-list {
			border-radius: var(--radius-md);
			padding: var(--space-5);
		}
	}
</style>
