import assert from 'node:assert/strict';
import test from 'node:test';
import { deleteLessonInteractionLinksForLessons } from './import-utils.mjs';

class DeleteQuery {
	error = null;
	filters = [];

	constructor(table, calls) {
		this.table = table;
		this.calls = calls;
	}

	delete() {
		return this;
	}

	eq(column, value) {
		this.filters.push([column, value]);
		if (this.filters.length === 2) {
			this.calls.push({ table: this.table, filters: this.filters });
		}
		return this;
	}
}

test('deleteLessonInteractionLinksForLessons clears links for each imported lesson version', async () => {
	const calls = [];
	const client = {
		from(table) {
			return new DeleteQuery(table, calls);
		}
	};

	await deleteLessonInteractionLinksForLessons(client, [
		{ id: 'lesson-linear-forms', version: 1 },
		{ id: 'lesson-linear-forms', version: 1 },
		{ id: 'lesson-slope', version: 2 }
	]);

	assert.deepEqual(calls, [
		{
			table: 'lesson_interaction_links',
			filters: [
				['lesson_id', 'lesson-linear-forms'],
				['lesson_version', 1]
			]
		},
		{
			table: 'lesson_interaction_links',
			filters: [
				['lesson_id', 'lesson-slope'],
				['lesson_version', 2]
			]
		}
	]);
});
