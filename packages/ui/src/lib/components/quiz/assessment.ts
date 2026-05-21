import {
	buildNumericSubmitResult,
	coerceNumericEvaluation,
	gradeNumericAnswer,
	parseNumericInput
} from './numeric';
import type {
	MultipleChoiceOptionData,
	NumericAnswerSubmitResult,
	NumericAnswerValue,
	NumericUnitOption,
	QuizPageLayout,
	QuizQuestionData,
	QuizQuestionResponse,
	ShortAnswerEvaluation,
	ShortAnswerMatchMode,
	ShortAnswerSubmitResult
} from './types';

export type QuestionsPerPage = number | 'all';
export type MultipleChoiceQuizResponse = Extract<
	QuizQuestionResponse,
	{ type?: 'multiple-choice' }
>;
export type MultipleSelectQuizResponse = Extract<QuizQuestionResponse, { type: 'multiple-select' }>;
export type NumericQuizResponse = Extract<QuizQuestionResponse, { type: 'numeric' }>;
export type SequencingQuizResponse = Extract<QuizQuestionResponse, { type: 'sequencing' }>;
export type ShortAnswerQuizResponse = Extract<QuizQuestionResponse, { type: 'short-answer' }>;

export function buildSubmittedState(questionData: QuizQuestionData[], submitted: boolean) {
	return Object.fromEntries(questionData.map((question) => [question.id, submitted]));
}

export function isMultipleChoiceResponse(
	response: QuizQuestionResponse
): response is MultipleChoiceQuizResponse {
	return response.type === undefined || response.type === 'multiple-choice';
}

export function isMultipleSelectResponse(
	response: QuizQuestionResponse
): response is MultipleSelectQuizResponse {
	return response.type === 'multiple-select';
}

export function isNumericResponse(response: QuizQuestionResponse): response is NumericQuizResponse {
	return response.type === 'numeric';
}

export function isSequencingResponse(
	response: QuizQuestionResponse
): response is SequencingQuizResponse {
	return response.type === 'sequencing';
}

export function isShortAnswerResponse(
	response: QuizQuestionResponse
): response is ShortAnswerQuizResponse {
	return response.type === 'short-answer';
}

export function buildMultipleChoiceAnswers(
	questionData: QuizQuestionData[]
): Record<string, string | null> {
	const answers: Record<string, string | null> = {};

	for (const question of questionData) {
		if (isMultipleChoiceResponse(question.response)) {
			answers[question.id] = question.response.value ?? null;
		}
	}

	return answers;
}

export function buildMultipleSelectAnswers(
	questionData: QuizQuestionData[]
): Record<string, string[]> {
	const answers: Record<string, string[]> = {};

	for (const question of questionData) {
		if (isMultipleSelectResponse(question.response)) {
			answers[question.id] = question.response.value ?? [];
		}
	}

	return answers;
}

export function buildShortAnswers(questionData: QuizQuestionData[]): Record<string, string> {
	const answers: Record<string, string> = {};

	for (const question of questionData) {
		if (isShortAnswerResponse(question.response)) {
			answers[question.id] = question.response.value ?? '';
		}
	}

	return answers;
}

export function buildNumericAnswers(
	questionData: QuizQuestionData[]
): Record<string, NumericAnswerValue> {
	const answers: Record<string, NumericAnswerValue> = {};

	for (const question of questionData) {
		if (isNumericResponse(question.response)) {
			answers[question.id] = {
				value: question.response.value ?? '',
				unit: getInitialNumericUnit(question.response)
			};
		}
	}

	return answers;
}

export function buildSequenceAnswers(questionData: QuizQuestionData[]): Record<string, string[]> {
	const answers: Record<string, string[]> = {};

	for (const question of questionData) {
		if (isSequencingResponse(question.response)) {
			answers[question.id] =
				question.response.value ?? question.response.items.map((item) => item.value);
		}
	}

	return answers;
}

export function buildPageGroups(
	questionData: QuizQuestionData[],
	customPages: QuizPageLayout | undefined,
	pageSize: QuestionsPerPage
) {
	if (questionData.length === 0) {
		return [];
	}

	if (customPages && customPages.length > 0) {
		const questionById = new Map(questionData.map((question) => [question.id, question]));
		const assignedQuestionIds = new Set(customPages.flat());
		const customGroups = customPages
			.map((page) =>
				page
					.map((questionId) => questionById.get(questionId))
					.filter((question): question is QuizQuestionData => question !== undefined)
			)
			.filter((page) => page.length > 0);
		const unassignedQuestions = questionData.filter(
			(question) => !assignedQuestionIds.has(question.id)
		);

		if (unassignedQuestions.length > 0) {
			customGroups.push(unassignedQuestions);
		}

		return customGroups.length > 0 ? customGroups : [questionData];
	}

	if (pageSize === 'all') {
		return [questionData];
	}

	const normalizedPageSize = Math.max(1, Math.floor(pageSize));
	const groups: QuizQuestionData[][] = [];

	for (let index = 0; index < questionData.length; index += normalizedPageSize) {
		groups.push(questionData.slice(index, index + normalizedPageSize));
	}

	return groups;
}

export function getOptionDisplayData(optionData: MultipleChoiceOptionData[]) {
	return optionData.map((option) => ({
		value: option.value,
		label: option.label,
		description: option.description,
		disabled: option.disabled
	}));
}

export function getMultipleChoiceCorrectValue(response: MultipleChoiceQuizResponse) {
	return (
		response.correctValue ??
		response.options.find((option) => option.state === 'correct')?.value ??
		null
	);
}

export function getMultipleSelectCorrectValues(response: MultipleSelectQuizResponse) {
	if (response.correctValues !== undefined) {
		return response.correctValues;
	}

	const values = response.options
		.filter((option) => option.state === 'correct')
		.map((option) => option.value);

	return values.length > 0 ? values : null;
}

export function gradeShortAnswer(
	response: ShortAnswerQuizResponse,
	value: string
): Pick<ShortAnswerSubmitResult, 'correct' | 'feedback'> {
	if (response.grader) {
		return coerceShortEvaluation(response.grader(value));
	}

	if (!response.acceptedAnswers || response.acceptedAnswers.length === 0) {
		return { correct: null };
	}

	const matchMode = response.matchMode ?? 'normalized';
	const answerValue = getShortComparableValue(value, matchMode, response.normalizer);

	return {
		correct: response.acceptedAnswers.some((acceptedAnswer) => {
			const acceptedValue = getShortComparableValue(acceptedAnswer, matchMode, response.normalizer);

			return matchMode === 'contains'
				? answerValue.includes(acceptedValue)
				: answerValue === acceptedValue;
		})
	};
}

export function gradeNumeric(
	response: NumericQuizResponse,
	answer: NumericAnswerValue
): NumericAnswerSubmitResult {
	if (response.grader) {
		return buildNumericSubmitResult(answer, coerceNumericEvaluation(response.grader(answer)));
	}

	const unitOptions: NumericUnitOption[] =
		response.unitConfig?.mode === 'select' ? response.unitConfig.options : [];

	return buildNumericSubmitResult(
		answer,
		gradeNumericAnswer(answer, response.acceptedValues ?? null, unitOptions)
	);
}

export function hasExactSelection(value: string[], correctValues: string[]) {
	const selectedValues = new Set(value);
	const correctValueSet = new Set(correctValues);

	if (selectedValues.size !== value.length || selectedValues.size !== correctValueSet.size) {
		return false;
	}

	return Array.from(selectedValues).every((selectedValue) => correctValueSet.has(selectedValue));
}

export function isNumericAnswered(response: NumericQuizResponse, answer: NumericAnswerValue) {
	const unitMode = response.unitConfig?.mode ?? 'none';
	const hasRequiredUnit =
		unitMode === 'none' || unitMode === 'fixed' || (answer.unit ?? '').trim().length > 0;

	return parseNumericInput(answer.value) !== null && hasRequiredUnit;
}

function getInitialNumericUnit(response: NumericQuizResponse) {
	if (response.unitConfig?.mode === 'fixed') {
		return response.unitConfig.value;
	}

	if (response.unit !== undefined) {
		return response.unit;
	}

	return response.unitConfig && 'value' in response.unitConfig
		? (response.unitConfig.value ?? '')
		: null;
}

function getShortComparableValue(
	value: string,
	matchMode: ShortAnswerMatchMode,
	normalizer: ((value: string) => string) | undefined
) {
	if (matchMode === 'exact') {
		return value;
	}

	const normalized = normalizer?.(value) ?? value.trim().replace(/\s+/g, ' ');

	return matchMode === 'case-insensitive' || matchMode === 'normalized' || matchMode === 'contains'
		? normalized.toLocaleLowerCase()
		: normalized;
}

function coerceShortEvaluation(
	evaluation: ShortAnswerEvaluation
): Pick<ShortAnswerSubmitResult, 'correct' | 'feedback'> {
	if (typeof evaluation === 'object' && evaluation !== null) {
		return {
			correct: evaluation.correct,
			feedback: evaluation.feedback
		};
	}

	return { correct: evaluation };
}
