import { describe, expect, test } from 'vitest';
import { buildLearningQuizQuestions, buildSubmittedAnswersPayload } from './quiz';
import type { LearningQuizQuestion } from './quiz';

function buildQuestion(overrides: Partial<LearningQuizQuestion> = {}): LearningQuizQuestion {
	return {
		question_id: 'question_1',
		version: 1,
		skill_label: 'Metaphor',
		question_purpose: 'recognition',
		response_type: 'multiple_choice',
		prompt: 'Which choice is correct?',
		choices: [
			{ id: 'a', label: 'Choice A' },
			{ id: 'b', label: 'Choice B' }
		],
		correct_choice_id: 'b',
		correct_choice_ids: ['a', 'b'],
		correct_numeric_value: 12,
		correct_numeric_tolerance: 0.5,
		sequence_items: [
			{ id: 'first', label: 'First' },
			{ id: 'second', label: 'Second' }
		],
		accepted_answers: ['accepted answer'],
		explanation: '  Use **retrieval practice**: answer from memory before checking notes.  ',
		...overrides
	};
}

function buildFourChoiceQuestion(overrides: Partial<LearningQuizQuestion> = {}) {
	return buildQuestion({
		choices: [
			{ id: 'a', label: 'Choice A' },
			{ id: 'b', label: 'Choice B' },
			{ id: 'c', label: 'Choice C' },
			{ id: 'd', label: 'Choice D' }
		],
		correct_choice_id: 'c',
		correct_choice_ids: ['b', 'c'],
		...overrides
	});
}

function optionValues(question: ReturnType<typeof buildLearningQuizQuestions>[number]) {
	return 'options' in question.response
		? question.response.options.map((option) => option.value)
		: [];
}

describe('buildLearningQuizQuestions', () => {
	test('omits answer keys and explanations by default', () => {
		const [question] = buildLearningQuizQuestions([buildQuestion()]);

		expect(question.feedback).toBeUndefined();
		expect(question.response).toEqual({
			type: 'multiple-choice',
			options: [
				{ value: 'a', label: 'Choice A' },
				{ value: 'b', label: 'Choice B' }
			]
		});
	});

	test('includes multiple choice keys and explanations for instant feedback', () => {
		const [question] = buildLearningQuizQuestions([buildQuestion()], { instantFeedback: true });

		expect(question.feedback).toBe(
			'Use **retrieval practice**: answer from memory before checking notes.'
		);
		expect(question.response).toMatchObject({
			type: 'multiple-choice',
			correctValue: 'b'
		});
	});

	test('includes multiple select keys for instant feedback', () => {
		const [question] = buildLearningQuizQuestions(
			[
				buildQuestion({
					response_type: 'multiple_select',
					correct_choice_ids: ['a', 'b']
				})
			],
			{ instantFeedback: true }
		);

		expect(question.response).toMatchObject({
			type: 'multiple-select',
			correctValues: ['a', 'b']
		});
	});

	test('shuffles choice options deterministically without changing answer keys', () => {
		const sourceQuestion = buildFourChoiceQuestion();
		const [firstQuestion] = buildLearningQuizQuestions([sourceQuestion], {
			instantFeedback: true,
			shuffleSeed: 'seed-a'
		});
		const [secondQuestion] = buildLearningQuizQuestions([sourceQuestion], {
			instantFeedback: true,
			shuffleSeed: 'seed-a'
		});

		expect(optionValues(firstQuestion)).toEqual(['c', 'a', 'b', 'd']);
		expect(optionValues(secondQuestion)).toEqual(optionValues(firstQuestion));
		expect(firstQuestion.response).toMatchObject({
			type: 'multiple-choice',
			correctValue: 'c'
		});
	});

	test('uses different choice orders for different shuffle seeds', () => {
		const sourceQuestion = buildFourChoiceQuestion();
		const [firstQuestion] = buildLearningQuizQuestions([sourceQuestion], {
			shuffleSeed: 'seed-a'
		});
		const [secondQuestion] = buildLearningQuizQuestions([sourceQuestion], {
			shuffleSeed: 'seed-b'
		});

		expect(optionValues(firstQuestion)).toEqual(['c', 'a', 'b', 'd']);
		expect(optionValues(secondQuestion)).toEqual(['d', 'a', 'c', 'b']);
	});

	test('preserves authored choice order when the strategy is fixed', () => {
		const [question] = buildLearningQuizQuestions(
			[
				buildFourChoiceQuestion({
					choice_order_strategy: 'fixed'
				})
			],
			{ shuffleSeed: 'seed-a' }
		);

		expect(optionValues(question)).toEqual(['a', 'b', 'c', 'd']);
	});

	test('keeps fixed choices in authored positions while shuffling the rest', () => {
		const [question] = buildLearningQuizQuestions(
			[
				buildFourChoiceQuestion({
					fixed_choice_ids: ['d']
				})
			],
			{ shuffleSeed: 'seed-b' }
		);

		expect(optionValues(question)).toEqual(['a', 'c', 'b', 'd']);
	});

	test('serializes submitted choice ids independently of display order', () => {
		const payload = buildSubmittedAnswersPayload(
			[buildFourChoiceQuestion()],
			[
				{
					questionId: 'question_1',
					value: 'c',
					correct: true,
					answered: true
				}
			]
		);

		expect(JSON.parse(payload)).toEqual([
			{
				questionId: 'question_1',
				selectedChoiceId: 'c',
				answerValue: 'c'
			}
		]);
	});

	test('maps numeric answers to absolute accepted values for instant feedback', () => {
		const [question] = buildLearningQuizQuestions(
			[
				buildQuestion({
					response_type: 'numeric',
					correct_numeric_value: 42,
					correct_numeric_tolerance: 0.25
				})
			],
			{ instantFeedback: true }
		);

		expect(question.response).toEqual({
			type: 'numeric',
			placeholder: 'Type a number',
			acceptedValues: [
				{
					value: 42,
					tolerance: {
						type: 'absolute',
						value: 0.25
					}
				}
			]
		});
	});

	test('keeps sequencing display order reversed but grades against original order', () => {
		const [question] = buildLearningQuizQuestions(
			[
				buildQuestion({
					response_type: 'sequencing',
					sequence_items: [
						{ id: 'step_1', label: 'Step 1' },
						{ id: 'step_2', label: 'Step 2' },
						{ id: 'step_3', label: 'Step 3' }
					]
				})
			],
			{ instantFeedback: true }
		);

		expect(question.response).toEqual({
			type: 'sequencing',
			items: [
				{ value: 'step_3', label: 'Step 3' },
				{ value: 'step_2', label: 'Step 2' },
				{ value: 'step_1', label: 'Step 1' }
			],
			correctOrder: ['step_1', 'step_2', 'step_3']
		});
	});

	test('includes normalized short-answer accepted answers for instant feedback', () => {
		const [question] = buildLearningQuizQuestions(
			[
				buildQuestion({
					response_type: 'short_answer',
					accepted_answers: ['A Clean Answer']
				})
			],
			{ instantFeedback: true }
		);

		expect(question.response).toEqual({
			type: 'short-answer',
			placeholder: 'Type your answer',
			acceptedAnswers: ['A Clean Answer'],
			matchMode: 'normalized'
		});
	});
});
