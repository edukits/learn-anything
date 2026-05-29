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
		math_template: null,
		math_match_mode: 'normalized',
		accepted_math_answers: [{ latex: '(x+1)(x+2)' }],
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
					answered: true,
					responseTimeMs: 1234
				}
			]
		);

		expect(JSON.parse(payload)).toEqual([
			{
				questionId: 'question_1',
				selectedChoiceId: 'c',
				answerValue: 'c',
				responseTimeMs: 1234
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

	test('maps math answers to MathAnswer configuration for instant feedback', () => {
		const [question] = buildLearningQuizQuestions(
			[
				buildQuestion({
					response_type: 'math',
					math_template: '\\begin{bmatrix}\\placeholder[x]{}\\\\\\placeholder[y]{}\\end{bmatrix}',
					accepted_math_answers: [{ prompts: { x: '3', y: '-2' } }]
				})
			],
			{ instantFeedback: true }
		);

		expect(question.response).toEqual({
			type: 'math',
			placeholder: 'Type a math answer',
			value: '\\begin{bmatrix}\\placeholder[x]{}\\\\\\placeholder[y]{}\\end{bmatrix}',
			template: '\\begin{bmatrix}\\placeholder[x]{}\\\\\\placeholder[y]{}\\end{bmatrix}',
			matchMode: 'normalized',
			acceptedValues: [{ prompts: { x: '3', y: '-2' } }]
		});
	});

	test('maps image choice questions to image-choice options and answer keys', () => {
		const [question] = buildLearningQuizQuestions(
			[
				buildQuestion({
					response_type: 'image_choice',
					choices: [
						{
							id: 'positive',
							label: 'Positive slope',
							image_src: '/images/positive-slope.png',
							image_alt: 'A line rising from left to right'
						},
						{
							id: 'negative',
							label: 'Negative slope',
							image_src: '/images/negative-slope.png',
							image_alt: 'A line falling from left to right'
						}
					],
					correct_choice_id: 'positive'
				})
			],
			{ instantFeedback: true }
		);

		expect(question.response).toEqual({
			type: 'image-choice',
			options: [
				{
					value: 'positive',
					imageSrc: '/images/positive-slope.png',
					imageAlt: 'A line rising from left to right',
					label: 'Positive slope'
				},
				{
					value: 'negative',
					imageSrc: '/images/negative-slope.png',
					imageAlt: 'A line falling from left to right',
					label: 'Negative slope'
				}
			],
			correctValue: 'positive'
		});
	});
});
