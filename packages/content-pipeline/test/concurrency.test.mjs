import assert from 'node:assert/strict';
import test from 'node:test';
import { runLimited } from '../src/concurrency.mjs';

test('runLimited respects max concurrency', async () => {
	let active = 0;
	let maxActive = 0;
	const results = await runLimited([1, 2, 3, 4, 5], 2, async (value) => {
		active += 1;
		maxActive = Math.max(maxActive, active);
		await new Promise((resolve) => setTimeout(resolve, 5));
		active -= 1;
		return value * 2;
	});

	assert.equal(maxActive, 2);
	assert.deepEqual(results, [2, 4, 6, 8, 10]);
});
