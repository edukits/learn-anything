import { describe, expect, test } from 'vitest';
import { AnswerValidationError, buildValidatedRpcAnswers } from './answer-validation.server';
import type { QuizQuestionVersion } from '../types';

function buildSequencingQuestion(): QuizQuestionVersion {
	return {
		question_id: 'question_sequence_1',
		version: 1,
		skill_id: 'skill_1',
		skill_label: 'Sequencing',
		question_purpose: 'application',
		response_type: 'sequencing',
		difficulty: 'medium',
		prompt: 'Put the steps in order.',
		choices: [],
		choice_order_strategy: 'shuffle',
		fixed_choice_ids: [],
		correct_choice_id: '',
		correct_choice_ids: [],
		correct_numeric_value: null,
		correct_numeric_tolerance: 0,
		sequence_items: [
			{ id: 'first', label: 'First' },
			{ id: 'second', label: 'Second' },
			{ id: 'third', label: 'Third' }
		],
		accepted_answers: [],
		math_template: null,
		math_match_mode: 'normalized',
		accepted_math_answers: [],
		explanation: 'The listed order is the expected order.',
		ordering: 1
	};
}

function buildChoiceQuestion(
	responseType: 'multiple_choice' | 'image_choice'
): QuizQuestionVersion {
	return {
		...buildSequencingQuestion(),
		question_id: `question_${responseType}_1`,
		skill_label: 'Choice',
		response_type: responseType,
		choices: [
			{ id: 'positive', label: 'Positive', image_src: '/positive.png', image_alt: 'Positive' },
			{ id: 'negative', label: 'Negative', image_src: '/negative.png', image_alt: 'Negative' }
		],
		correct_choice_id: 'positive',
		sequence_items: []
	};
}

function buildMathQuestion(): QuizQuestionVersion {
	return {
		...buildSequencingQuestion(),
		question_id: 'question_math_1',
		skill_label: 'Math',
		response_type: 'math',
		sequence_items: [],
		math_template: null,
		accepted_math_answers: [{ latex: '(x+1)(x+2)' }]
	};
}

describe('buildValidatedRpcAnswers', () => {
	test('accepts a sequencing answer that is a complete permutation', () => {
		const [answer] = buildValidatedRpcAnswers(
			[buildSequencingQuestion()],
			[
				{
					questionId: 'question_sequence_1',
					selectedChoiceId: '',
					answerValue: ['second', 'first', 'third'],
					responseTimeMs: 3210
				}
			],
			'quiz'
		);

		expect(answer.answer_value).toEqual(['second', 'first', 'third']);
		expect(answer.response_time_ms).toBe(3210);
	});

	test('normalizes duplicate sequencing ids from drag-sort payloads', () => {
		const [answer] = buildValidatedRpcAnswers(
			[buildSequencingQuestion()],
			[
				{
					questionId: 'question_sequence_1',
					selectedChoiceId: '',
					answerValue: ['second', 'first', 'second', 'third']
				}
			],
			'quiz'
		);

		expect(answer.answer_value).toEqual(['second', 'first', 'third']);
	});

	test('includes question metadata for RPCs that require versioned question joins', () => {
		const [answer] = buildValidatedRpcAnswers(
			[buildSequencingQuestion()],
			[
				{
					questionId: 'question_sequence_1',
					selectedChoiceId: '',
					answerValue: ['first', 'second', 'third']
				}
			],
			'lesson interaction',
			{ includeQuestionMetadata: true }
		);

		expect(answer.question_version).toBe(1);
		expect(answer.skill_id).toBe('skill_1');
		expect(answer.device).toBe('Sequencing');
	});

	test('rejects a sequencing answer that is missing an expected id', () => {
		expect(() =>
			buildValidatedRpcAnswers(
				[buildSequencingQuestion()],
				[
					{
						questionId: 'question_sequence_1',
						selectedChoiceId: '',
						answerValue: ['second', 'first', 'second']
					}
				],
				'quiz'
			)
		).toThrow(AnswerValidationError);
	});

	test('accepts image choice answers as selected choice ids', () => {
		const [answer] = buildValidatedRpcAnswers(
			[buildChoiceQuestion('image_choice')],
			[
				{
					questionId: 'question_image_choice_1',
					selectedChoiceId: 'positive',
					answerValue: 'positive'
				}
			],
			'quiz'
		);

		expect(answer.selected_choice_id).toBe('positive');
		expect(answer.answer_value).toBe('positive');
	});

	test('accepts math answers with latex and prompt values', () => {
		const [answer] = buildValidatedRpcAnswers(
			[buildMathQuestion()],
			[
				{
					questionId: 'question_math_1',
					selectedChoiceId: '',
					answerValue: { latex: '(x+1)(x+2)', prompts: { x: '3' } }
				}
			],
			'quiz'
		);

		expect(answer.answer_value).toEqual({
			latex: '(x+1)(x+2)',
			prompts: { x: '3' }
		});
	});

	test('rejects empty math answers', () => {
		expect(() =>
			buildValidatedRpcAnswers(
				[buildMathQuestion()],
				[
					{
						questionId: 'question_math_1',
						selectedChoiceId: '',
						answerValue: { latex: '', prompts: {} }
					}
				],
				'quiz'
			)
		).toThrow(AnswerValidationError);
	});
});
