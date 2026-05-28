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
		explanation: 'The listed order is the expected order.',
		ordering: 1
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
});
