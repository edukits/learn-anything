import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, test } from 'vitest';
import { getReleaseItems, toPracticeQuizQuestion } from './content.server';
import type { QuizQuestionVersion, ReleaseItem } from '../types';

class ReleaseItemsQuery {
	constructor(
		private readonly rows: ReleaseItem[],
		private readonly releaseId: string
	) {}

	select() {
		return this;
	}

	eq(column: string, value: string) {
		expect(column).toBe('release_id');
		expect(value).toBe(this.releaseId);
		return this;
	}

	order() {
		return this;
	}

	range(from: number, to: number) {
		return {
			data: this.rows.slice(from, to + 1),
			count: this.rows.length,
			error: null
		};
	}
}

function releaseItem(index: number): ReleaseItem {
	return {
		content_type: 'quiz_question',
		content_id: `question_${index}`,
		content_version: 1
	};
}

function mockClient(rows: ReleaseItem[], releaseId: string) {
	return {
		from(table: string) {
			expect(table).toBe('content_release_items');
			return new ReleaseItemsQuery(rows, releaseId);
		}
	} as unknown as SupabaseClient;
}

const mathTemplate = '\\begin{bmatrix}\\placeholder[x]{}\\\\\\placeholder[y]{}\\end{bmatrix}';

function question(overrides: Partial<QuizQuestionVersion> = {}): QuizQuestionVersion {
	return {
		question_id: 'question_math',
		version: 1,
		skill_id: 'skill_math',
		skill_label: 'Linear systems',
		question_purpose: 'application',
		response_type: 'math',
		difficulty: 'medium',
		prompt: 'Solve the system.',
		choices: [],
		choice_order_strategy: 'shuffle',
		fixed_choice_ids: [],
		correct_choice_id: '',
		correct_choice_ids: [],
		correct_numeric_value: null,
		correct_numeric_tolerance: 0,
		sequence_items: [],
		accepted_answers: [],
		math_template: mathTemplate,
		math_match_mode: 'normalized',
		accepted_math_answers: [{ prompts: { x: '3', y: '-2' } }],
		explanation: 'Substitute and solve.',
		ordering: 1,
		...overrides
	};
}

describe('getReleaseItems', () => {
	test('fetches release items beyond the first PostgREST page', async () => {
		const releaseId = 'release_large';
		const pathItem: ReleaseItem = {
			content_type: 'learning_path',
			content_id: 'path_large',
			content_version: 1
		};
		const rows = [...Array.from({ length: 1_000 }, (_, index) => releaseItem(index)), pathItem];

		await expect(getReleaseItems(mockClient(rows, releaseId), releaseId)).resolves.toEqual(rows);
	});
});

describe('toPracticeQuizQuestion', () => {
	test('keeps math templates but omits answer keys', () => {
		const payload = toPracticeQuizQuestion(question());

		expect(payload.math_template).toBe(mathTemplate);
		expect(payload).not.toHaveProperty('accepted_math_answers');
		expect(payload).not.toHaveProperty('correct_numeric_value');
		expect(payload).not.toHaveProperty('explanation');
	});
});
