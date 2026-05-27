import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, test } from 'vitest';
import { getReleaseItems } from './content.server';
import type { ReleaseItem } from '../types';

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
