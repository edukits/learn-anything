import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { bundleRun } from '../src/bundle.mjs';

async function tempDir() {
	return mkdtemp(join(tmpdir(), 'content-pipeline-bundle-'));
}

test('bundles reviewed items into valid v1 artifacts', async () => {
	const dir = await tempDir();
	const input = {
		topicDir: dir,
		sourceRefs: [{ source_id: 'source_test', path: 'sources/source.md' }],
		topic: {
			subject: {
				id: 'subject_math',
				slug: 'math',
				name: 'Math',
				summary: 'Math topics'
			},
			topic: {
				id: 'topic_linear_equations',
				slug: 'linear-equations',
				name: 'Linear Equations',
				summary: 'Solve linear equations',
				public_summary: 'Practice linear equations.',
				preview_markdown: 'A short path for solving equations.',
				app_path: '/app/topics/linear-equations',
				level_label: 'Algebra'
			},
			release: {},
			learning_path: {}
		}
	};
	const skill = {
		slug: 'inverse-operations',
		name: 'Inverse Operations',
		device: 'Inverse Operations',
		summary: 'Undo operations to solve.'
	};

	const run = await bundleRun({
		input,
		modules: {
			summary: 'Two equation modules.',
			modules: [
				{
					slug: 'inverse-operations',
					title: 'Inverse Operations',
					description: 'Undo operations to solve equations.',
					content_responsibility: 'Teach and practice inverse operations.'
				}
			]
		},
		syllabus: {
			summary: 'Learn equations.',
			syllabus: [
				{
					type: 'lesson',
					module_slug: 'inverse-operations',
					focus: 'Inverse operations',
					goals: 'Use inverse operations.'
				},
				{
					type: 'quiz',
					module_slug: 'inverse-operations',
					focus: 'Inverse checks',
					goals: 'Check inverse operation skill.'
				}
			]
		},
		runId: 'run_2026_05_22_math_linear_equations_v1',
		outDir: join(dir, 'dist'),
		now: new Date('2026-05-22T12:00:00.000Z'),
		reviewedItems: [
			{
				type: 'lesson',
				slug: 'inverse-operations',
				title: 'Use Inverse Operations',
				summary: 'Undo operations in order.',
				estimated_minutes: 5,
				skills: [skill],
				body_markdown: '# Use Inverse Operations\n\nUndo addition before multiplication.'
			},
			{
				type: 'quiz',
				slug: 'inverse-operations-check',
				title: 'Inverse Operations Check',
				description: 'Solve two-step equations.',
				kind: 'practice',
				skills: [skill],
				questions: [
					{
						skill,
						question_purpose: 'application',
						response_type: 'multiple_choice',
						difficulty: 'easy',
						prompt: 'Solve `x + 3 = 7`.',
						choices: [
							{ id: 'a', label: 'x = 4' },
							{ id: 'b', label: 'x = 10' }
						],
						correct_choice_id: 'a',
						explanation: 'Subtract 3 from both sides.'
					}
				]
			}
		]
	});

	assert.equal(run.report.valid, true);
	assert.equal(run.report.counts.topic_modules, 1);
	assert.equal(run.report.counts.lessons, 1);
	assert.equal(run.report.counts.quizzes, 1);
	assert.equal(run.report.counts.questions, 1);

	const manifest = JSON.parse(await readFile(join(dir, 'dist', 'manifest.json'), 'utf8'));
	assert.equal(manifest.subject_area_id, 'subject_math');
	assert.equal(manifest.topic_area_id, 'topic_linear_equations');

	const path = JSON.parse(
		(await readFile(join(dir, 'dist', 'learning-paths.jsonl'), 'utf8')).trim()
	);
	assert.deepEqual(
		path.items.map((item) => item.item_type),
		['lesson', 'quiz']
	);
	assert.deepEqual(
		path.items.map((item) => item.module_id),
		['module_linear_equations_inverse_operations', 'module_linear_equations_inverse_operations']
	);

	const topicModule = JSON.parse(
		(await readFile(join(dir, 'dist', 'topic-modules.jsonl'), 'utf8')).trim()
	);
	assert.equal(topicModule.slug, 'inverse-operations');

	const release = JSON.parse((await readFile(join(dir, 'dist', 'releases.jsonl'), 'utf8')).trim());
	assert.equal(
		release.items.some((item) => item.content_type === 'topic_module'),
		true
	);
});

test('bundles legacy reviewed items with a default module', async () => {
	const dir = await tempDir();
	const input = {
		topicDir: dir,
		sourceRefs: [{ source_id: 'source_test', path: 'sources/source.md' }],
		topic: {
			subject: {
				id: 'subject_math',
				slug: 'math',
				name: 'Math',
				summary: 'Math topics'
			},
			topic: {
				id: 'topic_ratios',
				slug: 'ratios',
				name: 'Ratios',
				summary: 'Practice ratios',
				public_summary: 'Practice ratios.',
				preview_markdown: 'A short path for ratios.',
				app_path: '/app/topics/ratios',
				level_label: 'Math'
			},
			release: {},
			learning_path: {}
		}
	};
	const skill = {
		slug: 'read-ratios',
		name: 'Read Ratios',
		device: 'Read Ratios',
		summary: 'Read ratio notation.'
	};

	const run = await bundleRun({
		input,
		syllabus: { summary: 'Learn ratios.' },
		runId: 'run_2026_05_22_math_ratios_v1',
		outDir: join(dir, 'dist'),
		now: new Date('2026-05-22T12:00:00.000Z'),
		reviewedItems: [
			{
				type: 'lesson',
				slug: 'read-ratios',
				title: 'Read Ratios',
				summary: 'Read simple ratios.',
				estimated_minutes: 5,
				skills: [skill],
				body_markdown: '# Read Ratios\n\nA ratio compares amounts.'
			}
		]
	});

	assert.equal(run.report.valid, true);
	assert.equal(run.report.counts.topic_modules, 1);

	const path = JSON.parse(
		(await readFile(join(dir, 'dist', 'learning-paths.jsonl'), 'utf8')).trim()
	);
	assert.equal(path.items[0].module_id, 'module_ratios_ratios_module');
});
