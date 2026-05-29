import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadAndValidateRun } from './content-run.mjs';

const sourceRefs = [{ source_id: 'source_math' }];

function buildMathQuestion(overrides = {}) {
	return {
		id: 'question_math_prompt_guard',
		version: 1,
		content_run_id: 'run_math_prompt_guard',
		schema_version: 1,
		source_refs: sourceRefs,
		topic_area_id: 'topic_math',
		skill_id: 'skill_linear_equations',
		device: 'Linear equations',
		question_purpose: 'application',
		response_type: 'math',
		difficulty: 'easy',
		prompt: 'Fill in the values.',
		accepted_math_answers: [{ prompts: { x: '3' } }],
		explanation: 'Substitute the value.',
		...overrides
	};
}

async function writeRunWithQuestion(question) {
	const dir = await mkdtemp(join(tmpdir(), 'content-run-'));
	const manifestPath = join(dir, 'manifest.json');
	await writeFile(join(dir, 'questions.jsonl'), `${JSON.stringify(question)}\n`);
	await writeFile(
		manifestPath,
		`${JSON.stringify({
			run_id: 'run_math_prompt_guard',
			title: 'Math Prompt Guard',
			schema_version: 1,
			authoring_mode: 'hand-authored',
			subject_area_id: 'subject_math',
			topic_area_id: 'topic_math',
			source_refs: sourceRefs,
			artifacts: {
				questions: 'questions.jsonl'
			}
		})}\n`
	);

	return { dir, manifestPath };
}

test('content run validation rejects math accepted answers with empty prompts', async () => {
	const { dir, manifestPath } = await writeRunWithQuestion(
		buildMathQuestion({ accepted_math_answers: [{ prompts: {} }] })
	);

	try {
		const run = await loadAndValidateRun(manifestPath);

		assert.equal(run.report.valid, false);
		assert.ok(
			run.report.failures.some((failure) => failure.includes('at least one prompt')),
			run.report.failures.join('\n')
		);
	} finally {
		await rm(dir, { recursive: true, force: true });
	}
});

test('content run validation accepts prompt-only math accepted answers with values', async () => {
	const { dir, manifestPath } = await writeRunWithQuestion(buildMathQuestion());

	try {
		const run = await loadAndValidateRun(manifestPath);

		assert.equal(
			run.report.failures.some((failure) => failure.includes('accepted_math_answers')),
			false,
			run.report.failures.join('\n')
		);
	} finally {
		await rm(dir, { recursive: true, force: true });
	}
});
