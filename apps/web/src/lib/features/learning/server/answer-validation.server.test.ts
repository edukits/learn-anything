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
					answerValue: ['second', 'first', 'third']
				}
			],
			'quiz'
		);

		expect(answer.answer_value).toEqual(['second', 'first', 'third']);
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
