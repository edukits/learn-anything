<script lang="ts">
	import {
		gradeMath,
		gradeNumeric,
		gradeShortAnswer,
		getImageChoiceCorrectValue,
		getImageOptionDisplayData,
		getMultipleChoiceCorrectValue,
		getMultipleSelectCorrectValues,
		getOptionDisplayData,
		hasExactSelection,
		isImageChoiceResponse,
		isMathAnswered,
		isMultipleChoiceResponse,
		isMultipleSelectResponse,
		isNumericAnswered,
		isSequencingResponse,
		isShortAnswerResponse
	} from './assessment';
	import ImageChoice from './ImageChoice.svelte';
	import MathAnswer from './MathAnswer.svelte';
	import MultipleChoice from './MultipleChoice.svelte';
	import MultipleSelect from './MultipleSelect.svelte';
	import NumericAnswer from './NumericAnswer.svelte';
	import SequencingAnswer from './SequencingAnswer.svelte';
	import ShortAnswer from './ShortAnswer.svelte';
	import type {
		MathAnswerSubmitResult,
		MathAnswerValue,
		NumericAnswerValue,
		QuizQuestionData,
		QuizQuestionResult,
		SequencingSubmitResult
	} from './types';

	type QuestionResponseProps = {
		question: QuizQuestionData;
		submitted?: boolean;
		disabled?: boolean;
		name?: string;
		interactionMode?: 'instant-submit' | 'submit';
		showSubmitButton?: boolean;
		submitLabel?: string;
		celebrations?: boolean;
		multipleChoiceValue?: string | null;
		multipleSelectValue?: string[];
		shortAnswerValue?: string;
		numericAnswerValue?: NumericAnswerValue;
		mathAnswerValue?: MathAnswerValue;
		sequenceValue?: string[];
		onsubmit?: (result: QuizQuestionResult) => void;
	};

	let {
		question,
		submitted = false,
		disabled = false,
		name = `question-${question.id}`,
		interactionMode = 'instant-submit',
		showSubmitButton = true,
		submitLabel = 'Submit answer',
		celebrations = true,
		multipleChoiceValue = $bindable<string | null>(null),
		multipleSelectValue = $bindable<string[]>([]),
		shortAnswerValue = $bindable(''),
		numericAnswerValue = $bindable<NumericAnswerValue>({ value: '', unit: null }),
		mathAnswerValue = $bindable<MathAnswerValue>({ latex: '', prompts: {} }),
		sequenceValue = $bindable<string[]>([]),
		onsubmit
	}: QuestionResponseProps = $props();

	let response = $derived(question.response);
	let answerLabel = $derived(question.question);
	let isMultipleChoiceSubmitButtonVisible = $derived(
		showSubmitButton && interactionMode === 'submit'
	);

	function getCurrentResult(): QuizQuestionResult {
		if (isMultipleChoiceResponse(response)) {
			const correctValue = getMultipleChoiceCorrectValue(response);

			return {
				questionId: question.id,
				value: multipleChoiceValue,
				answered: multipleChoiceValue !== null,
				correct: correctValue === null ? null : multipleChoiceValue === correctValue
			};
		}

		if (isImageChoiceResponse(response)) {
			const correctValue = getImageChoiceCorrectValue(response);

			return {
				questionId: question.id,
				value: multipleChoiceValue,
				answered: multipleChoiceValue !== null,
				correct: correctValue === null ? null : multipleChoiceValue === correctValue
			};
		}

		if (isMultipleSelectResponse(response)) {
			const correctValues = getMultipleSelectCorrectValues(response);

			return {
				questionId: question.id,
				value: multipleSelectValue,
				answered: multipleSelectValue.length > 0,
				correct: correctValues === null ? null : hasExactSelection(multipleSelectValue, correctValues)
			};
		}

		if (isShortAnswerResponse(response)) {
			return {
				questionId: question.id,
				value: shortAnswerValue,
				answered: shortAnswerValue.trim().length > 0,
				correct: gradeShortAnswer(response, shortAnswerValue).correct
			};
		}

		if (isSequencingResponse(response)) {
			const correct =
				response.correctOrder === null || response.correctOrder === undefined
					? null
					: sequenceValue.length === response.correctOrder.length &&
						sequenceValue.every((itemValue, index) => itemValue === response.correctOrder?.[index]);

			return {
				questionId: question.id,
				value: sequenceValue,
				answered: sequenceValue.length > 0,
				correct
			};
		}

		if (response.type === 'math') {
			return {
				questionId: question.id,
				value: mathAnswerValue,
				answered: isMathAnswered(mathAnswerValue),
				correct: gradeMath(response, mathAnswerValue).correct
			};
		}

		return {
			questionId: question.id,
			value: numericAnswerValue,
			answered: isNumericAnswered(response, numericAnswerValue),
			correct: gradeNumeric(response, numericAnswerValue).correct
		};
	}

	function submitCurrentResult() {
		onsubmit?.(getCurrentResult());
	}

	function submitMathResult(result: MathAnswerSubmitResult) {
		mathAnswerValue = {
			latex: result.latex,
			prompts: result.prompts
		};
		submitCurrentResult();
	}

	function submitSequencingResult(result: SequencingSubmitResult) {
		sequenceValue = result.value;
		submitCurrentResult();
	}
</script>

{#if response.type === 'numeric'}
	<NumericAnswer
		bind:value={numericAnswerValue.value}
		bind:unit={numericAnswerValue.unit}
		{submitted}
		{name}
		label={answerLabel}
		placeholder={response.placeholder}
		{disabled}
		unitConfig={response.unitConfig}
		acceptedValues={response.acceptedValues ?? null}
		grader={response.grader}
		{showSubmitButton}
		{submitLabel}
		celebrations={response.celebrations ?? celebrations}
		onsubmit={submitCurrentResult}
	/>
{:else if response.type === 'math'}
	<MathAnswer
		bind:value={mathAnswerValue.latex}
		{submitted}
		{name}
		label={answerLabel}
		placeholder={response.placeholder}
		mathPlaceholder={response.mathPlaceholder}
		{disabled}
		template={response.template}
		acceptedValues={response.acceptedValues ?? null}
		matchMode={response.matchMode ?? 'normalized'}
		grader={response.grader}
		{showSubmitButton}
		{submitLabel}
		celebrations={response.celebrations ?? celebrations}
		oninput={(answer) => {
			mathAnswerValue = answer;
		}}
		onsubmit={submitMathResult}
	/>
{:else if response.type === 'short-answer'}
	<ShortAnswer
		bind:value={shortAnswerValue}
		{submitted}
		{name}
		label={answerLabel}
		placeholder={response.placeholder}
		{disabled}
		acceptedAnswers={response.acceptedAnswers ?? null}
		matchMode={response.matchMode ?? 'normalized'}
		normalizer={response.normalizer}
		grader={response.grader}
		{showSubmitButton}
		{submitLabel}
		celebrations={response.celebrations ?? celebrations}
		onsubmit={submitCurrentResult}
	/>
{:else if response.type === 'sequencing'}
	<SequencingAnswer
		bind:value={sequenceValue}
		{submitted}
		items={response.items}
		{name}
		{disabled}
		correctOrder={response.correctOrder ?? null}
		{showSubmitButton}
		{submitLabel}
		celebrations={response.celebrations ?? celebrations}
		legend={answerLabel}
		onsubmit={submitSequencingResult}
	/>
{:else if response.type === 'multiple-select'}
	<MultipleSelect
		bind:value={multipleSelectValue}
		{submitted}
		options={getMultipleSelectCorrectValues(response) === null
			? response.options
			: getOptionDisplayData(response.options)}
		{name}
		{disabled}
		correctValues={getMultipleSelectCorrectValues(response)}
		{showSubmitButton}
		{submitLabel}
		celebrations={response.celebrations ?? celebrations}
		legend={answerLabel}
		onsubmit={submitCurrentResult}
	/>
{:else if response.type === 'image-choice'}
	<ImageChoice
		bind:value={multipleChoiceValue}
		{submitted}
		options={getImageChoiceCorrectValue(response) === null
			? response.options
			: getImageOptionDisplayData(response.options)}
		{name}
		{disabled}
		{interactionMode}
		correctValue={getImageChoiceCorrectValue(response)}
		showSubmitButton={isMultipleChoiceSubmitButtonVisible}
		{submitLabel}
		celebrations={response.celebrations ?? celebrations}
		legend={answerLabel}
		maxColumns={response.maxColumns ?? 4}
		minColumnWidth={response.minColumnWidth ?? '9rem'}
		onsubmit={submitCurrentResult}
	/>
{:else}
	<MultipleChoice
		bind:value={multipleChoiceValue}
		{submitted}
		options={getMultipleChoiceCorrectValue(response) === null
			? response.options
			: getOptionDisplayData(response.options)}
		{name}
		{disabled}
		{interactionMode}
		correctValue={getMultipleChoiceCorrectValue(response)}
		showSubmitButton={isMultipleChoiceSubmitButtonVisible}
		{submitLabel}
		celebrations={response.celebrations ?? celebrations}
		legend={answerLabel}
		onsubmit={submitCurrentResult}
	/>
{/if}
