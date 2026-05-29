import type { PracticeQuizQuestion, QuizQuestionVersion, SequenceItem } from '../types';
import type { SubmittedAnswer } from './submissions.server';

export type RpcAnswer = {
	question_id: string;
	question_version?: number;
	skill_id?: string;
	device?: string;
	selected_choice_id: string;
	answer_value: unknown;
	response_time_ms: number;
};

export class AnswerValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'AnswerValidationError';
	}
}

type AnswerableQuestion = PracticeQuizQuestion | QuizQuestionVersion;
type ValidatedAnswer = Omit<RpcAnswer, 'response_time_ms'>;

export function buildValidatedRpcAnswers(
	questions: AnswerableQuestion[],
	answers: SubmittedAnswer[],
	label: string,
	options: { includeQuestionMetadata?: boolean } = {}
): RpcAnswer[] {
	const answersByQuestion = new Map(answers.map((answer) => [answer.questionId, answer]));

	if (answersByQuestion.size !== questions.length) {
		throw new AnswerValidationError(`Answer every question before submitting the ${label}.`);
	}

	return questions.map((question) => {
		const submittedAnswer = answersByQuestion.get(question.question_id);
		if (!submittedAnswer) {
			throw new AnswerValidationError(`Missing answer for ${question.question_id}.`);
		}

		const answer = {
			...validateSubmittedAnswer(question, submittedAnswer),
			response_time_ms: submittedAnswer.responseTimeMs ?? 0
		};
		if (options.includeQuestionMetadata) {
			return {
				...answer,
				question_version: question.version,
				skill_id: question.skill_id,
				device: question.skill_label
			};
		}

		return answer;
	});
}

function validateSubmittedAnswer(
	question: AnswerableQuestion,
	answer: SubmittedAnswer
): ValidatedAnswer {
	switch (question.response_type) {
		case 'multiple_choice':
		case 'image_choice':
			return validateSingleChoice(question, answer);
		case 'multiple_select':
			return validateMultipleSelect(question, answer);
		case 'numeric':
			return validateNumeric(question, answer);
		case 'sequencing':
			return validateSequencing(question, answer);
		case 'short_answer':
			return validateShortAnswer(question, answer);
		case 'math':
			return validateMath(question, answer);
		default: {
			const exhaustive: never = question.response_type;
			throw new AnswerValidationError(`Unsupported response type: ${exhaustive}`);
		}
	}
}

function validateSingleChoice(
	question: AnswerableQuestion,
	answer: SubmittedAnswer
): ValidatedAnswer {
	const choiceIds = new Set(question.choices.map((choice) => choice.id));
	const selectedChoiceId = answer.selectedChoiceId;

	if (!selectedChoiceId || !choiceIds.has(selectedChoiceId)) {
		throw new AnswerValidationError(`Invalid answer for ${question.question_id}.`);
	}

	return {
		question_id: question.question_id,
		selected_choice_id: selectedChoiceId,
		answer_value: selectedChoiceId
	};
}

function validateMultipleSelect(
	question: AnswerableQuestion,
	answer: SubmittedAnswer
): ValidatedAnswer {
	if (!Array.isArray(answer.answerValue) || answer.answerValue.length === 0) {
		throw new AnswerValidationError(`Invalid answer for ${question.question_id}.`);
	}

	const choiceIds = new Set(question.choices.map((choice) => choice.id));
	const selectedIds = answer.answerValue.filter(
		(value): value is string => typeof value === 'string'
	);
	const uniqueIds = new Set(selectedIds);
	if (
		selectedIds.length !== answer.answerValue.length ||
		uniqueIds.size !== selectedIds.length ||
		selectedIds.some((value) => !choiceIds.has(value))
	) {
		throw new AnswerValidationError(`Invalid answer for ${question.question_id}.`);
	}

	return {
		question_id: question.question_id,
		selected_choice_id: '',
		answer_value: selectedIds
	};
}

function validateNumeric(question: AnswerableQuestion, answer: SubmittedAnswer): ValidatedAnswer {
	const value = extractNumericValue(answer.answerValue);
	if (value === null) {
		throw new AnswerValidationError(`Invalid answer for ${question.question_id}.`);
	}

	return {
		question_id: question.question_id,
		selected_choice_id: '',
		answer_value: value
	};
}

function validateSequencing(
	question: AnswerableQuestion,
	answer: SubmittedAnswer
): ValidatedAnswer {
	if (!Array.isArray(answer.answerValue) || answer.answerValue.length === 0) {
		throw new AnswerValidationError(`Invalid answer for ${question.question_id}.`);
	}

	const submittedIds = answer.answerValue.filter(
		(value): value is string => typeof value === 'string'
	);
	const expectedIds = (question.sequence_items ?? []).map((item: SequenceItem) => item.id);
	const expectedSet = new Set(expectedIds);
	const normalizedSubmittedIds = submittedIds.filter(
		(itemId, index) => submittedIds.indexOf(itemId) === index
	);
	if (
		submittedIds.length !== answer.answerValue.length ||
		normalizedSubmittedIds.length !== expectedIds.length ||
		expectedSet.size !== expectedIds.length ||
		submittedIds.some((value) => !expectedSet.has(value)) ||
		expectedIds.some((value) => !normalizedSubmittedIds.includes(value))
	) {
		throw new AnswerValidationError(`Invalid answer for ${question.question_id}.`);
	}

	return {
		question_id: question.question_id,
		selected_choice_id: '',
		answer_value: normalizedSubmittedIds
	};
}

function validateShortAnswer(
	question: AnswerableQuestion,
	answer: SubmittedAnswer
): ValidatedAnswer {
	if (typeof answer.answerValue !== 'string' || answer.answerValue.trim().length === 0) {
		throw new AnswerValidationError(`Invalid answer for ${question.question_id}.`);
	}

	return {
		question_id: question.question_id,
		selected_choice_id: '',
		answer_value: answer.answerValue
	};
}

function validateMath(question: AnswerableQuestion, answer: SubmittedAnswer): ValidatedAnswer {
	const value = extractMathAnswerValue(answer.answerValue);
	if (!value) {
		throw new AnswerValidationError(`Invalid answer for ${question.question_id}.`);
	}

	return {
		question_id: question.question_id,
		selected_choice_id: '',
		answer_value: value
	};
}

function extractNumericValue(value: unknown): string | null {
	const rawValue =
		typeof value === 'object' && value !== null && 'value' in value
			? (value as { value?: unknown }).value
			: value;

	if (typeof rawValue !== 'string' && typeof rawValue !== 'number') {
		return null;
	}

	const normalized = String(rawValue).trim();
	return /^-?(?:\d+|\d*\.\d+)$/.test(normalized) ? normalized : null;
}

function extractMathAnswerValue(
	value: unknown
): { latex: string; prompts: Record<string, string> } | null {
	if (typeof value !== 'object' || value === null) {
		return null;
	}

	const raw = value as { latex?: unknown; prompts?: unknown };
	const latex = typeof raw.latex === 'string' ? raw.latex : '';
	if (
		raw.prompts !== undefined &&
		(typeof raw.prompts !== 'object' || raw.prompts === null || Array.isArray(raw.prompts))
	) {
		return null;
	}

	const rawPrompts = raw.prompts as Record<string, unknown> | undefined;
	const prompts = rawPrompts
		? Object.fromEntries(
				Object.entries(rawPrompts).filter(
					(entry): entry is [string, string] =>
						typeof entry[0] === 'string' && typeof entry[1] === 'string'
				)
			)
		: {};

	if (Object.keys(prompts).length !== (rawPrompts ? Object.keys(rawPrompts).length : 0)) {
		return null;
	}

	const hasLatex = latex.trim().length > 0;
	const hasPrompts = Object.values(prompts).some((promptValue) => promptValue.trim().length > 0);
	return hasLatex || hasPrompts ? { latex, prompts } : null;
}
