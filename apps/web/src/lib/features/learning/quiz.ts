import type { QuizQuestionData, QuizQuestionResult } from '@learn-anything/ui';
import type { QuestionType } from './types';

export type LearningQuizQuestion = {
	question_id: string;
	skill_label: string;
	question_type: QuestionType;
	prompt: string;
	choices: {
		id: string;
		label: string;
	}[];
	sequence_items?: {
		id: string;
		label: string;
	}[];
};

export function buildLearningQuizQuestions(questions: LearningQuizQuestion[]): QuizQuestionData[] {
	return questions.map((question) => ({
		id: question.question_id,
		eyebrow: `${question.skill_label} · ${question.question_type}`,
		question: question.prompt,
		response: buildQuestionResponse(question)
	}));
}

export function buildSubmittedAnswersPayload(questions: LearningQuizQuestion[], results: QuizQuestionResult[]) {
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

function buildQuestionResponse(question: LearningQuizQuestion): QuizQuestionData['response'] {
	switch (question.question_type) {
		case 'recognition':
		case 'application':
			return {
				type: 'multiple-choice',
				options: question.choices.map((choice) => ({
					value: choice.id,
					label: choice.label
				}))
			};
		case 'multiple_select':
			return {
				type: 'multiple-select',
				options: question.choices.map((choice) => ({
					value: choice.id,
					label: choice.label
				}))
			};
		case 'numeric_answer':
			return {
				type: 'numeric',
				placeholder: 'Type a number'
			};
		case 'sequencing':
			return {
				type: 'sequencing',
				items: (question.sequence_items ?? []).toReversed().map((item) => ({
					value: item.id,
					label: item.label
				})),
				correctOrder: null
			};
		case 'short_answer':
			return {
				type: 'short-answer',
				placeholder: 'Type your answer'
			};
		default: {
			const exhaustive: never = question.question_type;
			throw new Error(`Unsupported question type: ${exhaustive}`);
		}
	}
}
