import type { QuizQuestionData, QuizQuestionResult } from '@learn-anything/ui';

export type LiteraryDeviceQuizQuestion = {
	question_id: string;
	device: string;
	question_type: string;
	prompt: string;
	choices: {
		id: string;
		label: string;
	}[];
	correct_choice_id: string;
	explanation: string;
};

export function buildLiteraryDeviceQuizQuestions(
	questions: LiteraryDeviceQuizQuestion[]
): QuizQuestionData[] {
	return questions.map((question) => ({
		id: question.question_id,
		eyebrow: `${question.device} · ${question.question_type}`,
		question: question.prompt,
		feedback: question.explanation,
		response: {
			type: 'multiple-choice',
			correctValue: question.correct_choice_id,
			options: question.choices.map((choice) => ({
				value: choice.id,
				label: choice.label
			}))
		}
	}));
}

export function buildSubmittedAnswersPayload(
	questions: LiteraryDeviceQuizQuestion[],
	results: QuizQuestionResult[]
) {
	const resultByQuestionId = new Map(results.map((result) => [result.questionId, result]));

	return JSON.stringify(
		questions.map((question) => {
			const value = resultByQuestionId.get(question.question_id)?.value;

			return {
				questionId: question.question_id,
				selectedChoiceId: typeof value === 'string' ? value : ''
			};
		})
	);
}
