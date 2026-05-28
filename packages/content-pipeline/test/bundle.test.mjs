import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { bundleRun } from '../src/bundle.mjs';

async function tempDir() {
	return mkdtemp(join(tmpdir(), 'content-pipeline-bundle-'));
}

function conceptCheckQuestion(skillSlug, prompt = 'What should you undo first?') {
	return {
		skill_slug: skillSlug,
		question_purpose: 'recognition',
		response_type: 'multiple_choice',
		difficulty: 'easy',
		prompt,
		choices: ['Undo addition', 'Multiply first'],
		correct_index: 0,
		explanation: 'Use the inverse operation that isolates the variable.'
	};
}

function interactiveLesson({
	title,
	summary,
	skillSlug,
	body = 'Core idea.',
	interactionSlug = 'core-check'
}) {
	return {
		type: 'lesson',
		title,
		summary,
		estimated_minutes: 5,
		skill_slugs: [skillSlug],
		body_markdown: `# ${title}\n\n${body}\n\n::concept-check{slug="${interactionSlug}"}`,
		render_blocks: [
			{ type: 'markdown', markdown: `# ${title}\n\n${body}` },
			{ type: 'interaction', slug: interactionSlug, interaction_type: 'concept_check' }
		],
		interactions: [
			{
				slug: interactionSlug,
				type: 'concept_check',
				questions: [conceptCheckQuestion(skillSlug)]
			}
		]
	};
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
				...interactiveLesson({
					title: 'Use Inverse Operations',
					summary: 'Undo operations in order.',
					skillSlug: 'inverse-operations',
					body: 'Undo addition before multiplication.',
					interactionSlug: 'undo-addition-check'
				})
			},
			{
				type: 'quiz',
				title: 'Inverse Operations Check',
				description: 'Solve two-step equations.',
				questions: [
					{
						skill_slug: 'inverse-operations',
						question_purpose: 'application',
						response_type: 'multiple_choice',
						difficulty: 'easy',
						prompt: 'Solve `x + 3 = 7`.',
						choices: ['x = 4', 'x = 10'],
						correct_index: 0,
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
	assert.equal(run.report.counts.questions, 2);

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

	const lessonInteractionLinks = (
		await readFile(join(dir, 'dist', 'lesson-interaction-links.jsonl'), 'utf8')
	)
		.trim()
		.split('\n')
		.map((line) => JSON.parse(line));
	assert.equal(lessonInteractionLinks.length, 1);
	assert.equal(lessonInteractionLinks[0].interaction_slug, 'undo-addition-check');
});

test('bundles indexed answer keys using normalized custom choice ids', async () => {
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

	const run = await bundleRun({
		input,
		syllabus: { summary: 'Learn equations.' },
		runId: 'run_2026_05_22_math_linear_equations_v1',
		outDir: join(dir, 'dist'),
		now: new Date('2026-05-22T12:00:00.000Z'),
		reviewedItems: [
			{
				type: 'quiz',
				title: 'Equation Checks',
				description: 'Choose correct equations.',
				questions: [
					{
						skill_slug: 'inverse-operations',
						question_purpose: 'application',
						response_type: 'multiple_choice',
						difficulty: 'easy',
						prompt: 'Which value solves `x + 3 = 7`?',
						choices: [
							{ id: 'four', label: 'x = 4' },
							{ id: 'ten', label: 'x = 10' }
						],
						correct_index: 0,
						choice_order_strategy: 'fixed',
						explanation: 'Subtract 3 from both sides.'
					},
					{
						skill_slug: 'inverse-operations',
						question_purpose: 'application',
						response_type: 'multiple_select',
						difficulty: 'medium',
						prompt: 'Which equations have `x = 4` as a solution?',
						choices: [
							{ id: 'plus-three', label: 'x + 3 = 7' },
							{ id: 'times-two', label: '2x = 8' },
							{ id: 'plus-two', label: 'x + 2 = 8' }
						],
						correct_indices: [0, 1],
						fixed_choice_indices: [2],
						explanation: 'Substitute 4 into each equation.'
					}
				]
			}
		]
	});

	assert.equal(run.report.valid, true);
	const questions = (await readFile(join(dir, 'dist', 'questions.jsonl'), 'utf8'))
		.trim()
		.split('\n')
		.map((line) => JSON.parse(line));
	assert.equal(questions[0].correct_choice_id, 'four');
	assert.equal(questions[0].choice_order_strategy, 'fixed');
	assert.deepEqual(questions[0].choices, [
		{ id: 'four', label: 'x = 4' },
		{ id: 'ten', label: 'x = 10' }
	]);
	assert.deepEqual(questions[1].correct_choice_ids, ['plus-three', 'times-two']);
	assert.deepEqual(questions[1].fixed_choice_ids, ['plus-two']);
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
				...interactiveLesson({
					title: 'Read Ratios',
					summary: 'Read simple ratios.',
					skillSlug: 'read-ratios',
					body: 'A ratio compares amounts.',
					interactionSlug: 'ratio-check'
				})
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
