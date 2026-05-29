import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { buildSystemPrompt } from '../src/agent.mjs';

async function skillPrompt(name) {
	return readFile(new URL(`../src/skills/${name}`, import.meta.url), 'utf8');
}

test('quiz generation prompts explain choice ordering metadata', async () => {
	const questionContext = await skillPrompt('QUESTION_CONTEXT.md');

	for (const prompt of [questionContext]) {
		assert.match(prompt, /choice_order_strategy/);
		assert.match(prompt, /fixed_choice_indices/);
		assert.match(prompt, /shuffled by the app|app shuffles|app randomizes/i);
		assert.match(prompt, /All of the above/);
		assert.match(prompt, /None of the above/);
	}
});

test('question prompt context documents shared response types and LaTeX support', async () => {
	const prompt = await skillPrompt('QUESTION_CONTEXT.md');

	for (const responseType of [
		'multiple_choice',
		'multiple_select',
		'numeric',
		'sequencing',
		'short_answer',
		'math',
		'image_choice'
	]) {
		assert.match(prompt, new RegExp(responseType));
	}

	assert.match(prompt, /LaTeX math/);
	assert.match(prompt, /accepted_math_answers/);
	assert.match(prompt, /image_src/);
});

test('question-producing agents append the shared question context', async () => {
	for (const promptName of ['QUIZ.md', 'INTERACTIONS.md', 'REVIEW.md']) {
		const prompt = await buildSystemPrompt(promptName);

		assert.match(prompt, /# Shared Question Context/);
		assert.match(prompt, /accepted_math_answers/);
		assert.match(prompt, /image_choice/);
	}
});
