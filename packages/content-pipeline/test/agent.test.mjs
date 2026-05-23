import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { readValidatedJson } from '../src/agent.mjs';
import { schemaForItemType, validateWithSchema } from '../src/schemas.mjs';

async function tempDir() {
	return mkdtemp(join(tmpdir(), 'content-pipeline-agent-'));
}

function invalidQuiz() {
	return {
		type: 'quiz',
		slug: 'analysis-chain-builder',
		title: 'Analysis Chain Builder',
		description: 'Practice sequencing analysis components.',
		kind: 'practice',
		questions: [
			{
				question_purpose: 'sequencing',
				response_type: 'sequencing',
				difficulty: 'easy',
				prompt: 'Put the analysis parts in order.',
				sequence_items: [
					{ id: 'claim', label: 'Claim' },
					{ id: 'evidence', label: 'Evidence' }
				],
				explanation: 'The claim frames the evidence.'
			}
		]
	};
}

function validQuiz() {
	const quiz = invalidQuiz();
	quiz.questions[0].question_purpose = 'application';
	return quiz;
}

test('readValidatedJson asks the agent to repair schema-invalid JSON', async () => {
	const dir = await tempDir();
	const path = join(dir, 'quiz.json');
	await writeFile(path, `${JSON.stringify(invalidQuiz(), null, 2)}\n`);
	const prompts = [];
	const session = {
		async prompt(prompt) {
			prompts.push(prompt);
			await writeFile(path, `${JSON.stringify(validQuiz(), null, 2)}\n`);
		}
	};

	const result = await readValidatedJson({
		absoluteJsonPath: path,
		expectedJsonPath: 'quiz.json',
		label: 'quiz 1',
		session,
		validate: validateWithSchema(schemaForItemType('quiz')),
		log: () => {}
	});

	assert.equal(prompts.length, 1);
	assert.match(prompts[0], /question_purpose/);
	assert.match(prompts[0], /recognition/);
	assert.match(prompts[0], /application/);
	assert.equal(result.questions[0].question_purpose, 'application');
});

test('readValidatedJson fails after the repair limit', async () => {
	const dir = await tempDir();
	const path = join(dir, 'quiz.json');
	await writeFile(path, `${JSON.stringify(invalidQuiz(), null, 2)}\n`);
	let promptCount = 0;
	const session = {
		async prompt() {
			promptCount += 1;
		}
	};

	await assert.rejects(
		() =>
			readValidatedJson({
				absoluteJsonPath: path,
				expectedJsonPath: 'quiz.json',
				label: 'quiz 1',
				session,
				validate: validateWithSchema(schemaForItemType('quiz')),
				maxRepairAttempts: 3,
				log: () => {}
			}),
		/did not match the required schema after 3 repair attempts/
	);
	assert.equal(promptCount, 3);
});
