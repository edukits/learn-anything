import type { QuizQuestionData, QuizQuestionResult } from '@learn-anything/ui';
import type { QuestionPurpose, ResponseType } from './types';

type BuildLearningQuizQuestionsOptions = {
	instantFeedback?: boolean;
};

export type LearningQuizQuestion = {
	question_id: string;
	skill_label: string;
	question_purpose: QuestionPurpose;
	response_type: ResponseType;
	prompt: string;
	choices: {
		id: string;
		label: string;
	}[];
	correct_choice_id?: string;
	correct_choice_ids?: string[];
	correct_numeric_value?: number | null;
	correct_numeric_tolerance?: number;
	sequence_items?: {
		id: string;
		label: string;
	}[];
	accepted_answers?: string[];
	explanation?: string;
};

export function buildLearningQuizQuestions(
	questions: LearningQuizQuestion[],
	options: BuildLearningQuizQuestionsOptions = {}
): QuizQuestionData[] {
	return questions.map((question) => ({
		id: question.question_id,
		eyebrow: `${question.skill_label} · ${question.question_purpose}`,
		question: question.prompt,
		feedback: getQuestionFeedback(question, options),
		response: buildQuestionResponse(question, options)
	}));
}

export function buildSubmittedAnswersPayload(
	questions: LearningQuizQuestion[],
	results: QuizQuestionResult[]
) {
	const resultByQuestionId = new Map(results.map((result) => [result.questionId, result]));

	return JSON.stringify(
		questions.map((question) => {
			const value = resultByQuestionId.get(question.question_id)?.value;

			return {
				questionId: question.question_id,
				selectedChoiceId: typeof value === 'string' ? value : '',
				answerValue: value
			};
		})
	);
}

function buildQuestionResponse(
	question: LearningQuizQuestion,
	options: BuildLearningQuizQuestionsOptions
): QuizQuestionData['response'] {
	switch (question.response_type) {
		case 'multiple_choice':
			return {
				type: 'multiple-choice',
				options: question.choices.map((choice) => ({
					value: choice.id,
					label: choice.label
				})),
				...(options.instantFeedback ? { correctValue: question.correct_choice_id ?? null } : {})
			};
		case 'multiple_select':
			return {
				type: 'multiple-select',
				options: question.choices.map((choice) => ({
					value: choice.id,
					label: choice.label
				})),
				...(options.instantFeedback ? { correctValues: question.correct_choice_ids ?? [] } : {})
			};
		case 'numeric':
			return {
				type: 'numeric',
				placeholder: 'Type a number',
				...(options.instantFeedback && typeof question.correct_numeric_value === 'number'
					? {
							acceptedValues: [
								{
									value: question.correct_numeric_value,
									tolerance: {
										type: 'absolute' as const,
										value: question.correct_numeric_tolerance ?? 0
									}
								}
							]
						}
					: {})
			};
		case 'sequencing':
			return {
				type: 'sequencing',
				items: (question.sequence_items ?? []).toReversed().map((item) => ({
					value: item.id,
					label: item.label
				})),
				...(options.instantFeedback
					? { correctOrder: (question.sequence_items ?? []).map((item) => item.id) }
					: {})
			};
		case 'short_answer':
			return {
				type: 'short-answer',
				placeholder: 'Type your answer',
				...(options.instantFeedback
					? {
							acceptedAnswers: question.accepted_answers ?? [],
							matchMode: 'normalized' as const
						}
					: {})
			};
		default: {
			const exhaustive: never = question.response_type;
			throw new Error(`Unsupported response type: ${exhaustive}`);
		}
	}
}

function getQuestionFeedback(
	question: LearningQuizQuestion,
	options: BuildLearningQuizQuestionsOptions
) {
	if (!options.instantFeedback) {
		return undefined;
	}

	const explanation = question.explanation?.trim();
	return explanation ? explanation : undefined;
}
