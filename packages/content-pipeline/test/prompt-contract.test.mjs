import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function skillPrompt(name) {
	return readFile(new URL(`../src/skills/${name}`, import.meta.url), 'utf8');
}

test('quiz generation prompts explain choice ordering metadata', async () => {
	for (const promptName of ['QUIZ.md', 'INTERACTIONS.md', 'REVIEW.md']) {
		const prompt = await skillPrompt(promptName);

		assert.match(prompt, /choice_order_strategy/);
		assert.match(prompt, /fixed_choice_indices/);
		assert.match(prompt, /shuffled by the app|app shuffles|app randomizes/i);
		assert.match(prompt, /All of the above/);
		assert.match(prompt, /None of the above/);
	}
});
