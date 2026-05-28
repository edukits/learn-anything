import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { defaultGenerationConfig } from '../src/config.mjs';
import { generateContent } from '../src/generator.mjs';

async function tempTopic() {
	const dir = await mkdtemp(join(tmpdir(), 'content-pipeline-generator-'));
	await writeFile(join(dir, 'README.md'), '# Brief\n');
	return dir;
}

function fakeInput(topicDir) {
	return {
		topicDir,
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
				summary: 'Solve equations'
			},
			release: {},
			learning_path: {}
		},
		sourceRefs: [],
		sourceFiles: [],
		readmePath: join(topicDir, 'README.md'),
		legacy: false,
		warnings: ['test warning']
	};
}

function lessonMarkdown(title = 'Balance') {
	return `# ${title}\n\nKeep both sides equal.\n\n::concept-check{slug="balance-check"}\n`;
}

function interactionSidecar(skillSlug = 'balance') {
	return {
		interactions: [
			{
				slug: 'balance-check',
				type: 'concept_check',
				questions: [
					{
						skill_slug: skillSlug,
						question_purpose: 'recognition',
						response_type: 'multiple_choice',
						difficulty: 'easy',
						prompt: 'What must stay equal when solving?',
						choices: ['Both sides', 'Only the left side'],
						correct_index: 0,
						explanation: 'Equation solving preserves equality.'
					}
				]
			}
		]
	};
}

function lessonFile({ title, summary, skillSlug, body = lessonMarkdown(title) }) {
	return [
		'---',
		`title: ${title}`,
		`summary: ${summary}`,
		'estimated_minutes: 5',
		'skill_slugs:',
		`  - ${skillSlug}`,
		'---',
		'',
		body
	].join('\n');
}

class FakeRunner {
	async run({ label, systemPromptName, emit, taskId }) {
		emit({ type: 'task_tool_start', taskId, label, toolName: 'fake-write' });
		if (systemPromptName === 'MODULES.md') {
			return {
				summary: 'One module',
				modules: [
					{
						slug: 'basics',
						title: 'Basics',
						description: 'Equation basics',
						content_responsibility: 'Teach basics'
					}
				]
			};
		}
		if (systemPromptName === 'SYLLABUS.md') {
			return {
				summary: 'Two items',
				syllabus: [
					{
						type: 'lesson',
						module_slug: 'basics',
						focus: 'Balance equations',
						goals: 'Balance',
						skills: [{ slug: 'balance', name: 'Balance', device: 'Balance', summary: 'Balance.' }]
					},
					{
						type: 'quiz',
						module_slug: 'basics',
						focus: 'Equation checks',
						goals: 'Check',
						question_count: 1,
						skills: [{ slug: 'balance', name: 'Balance', device: 'Balance', summary: 'Balance.' }]
					}
				]
			};
		}
		if (systemPromptName === 'LESSON.md') {
			return {
				type: 'lesson',
				title: 'Balance Equations',
				summary: 'Balance equations.',
				estimated_minutes: 5,
				skill_slugs: ['balance'],
				body_markdown: lessonMarkdown()
			};
		}
		if (systemPromptName === 'INTERACTIONS.md') {
			return interactionSidecar();
		}
		if (systemPromptName === 'QUIZ.md') {
			return {
				type: 'quiz',
				title: 'Equation Checks',
				description: 'Check equations.',
				kind: 'practice',
				questions: [
					{
						skill_slug: 'balance',
						question_purpose: 'application',
						response_type: 'multiple_choice',
						difficulty: 'easy',
						prompt: 'Solve `x + 3 = 7`.',
						choices: ['x = 4', 'x = 10'],
						correct_index: 0,
						explanation: 'Subtract 3 from both sides.'
					}
				]
			};
		}
		return {
			type: label.includes('1') ? 'lesson' : 'quiz',
			title: label,
			summary: 'Reviewed.',
			estimated_minutes: 5,
			skill_slugs: ['balance'],
			body_markdown: lessonMarkdown('Reviewed'),
			description: 'Reviewed.',
			kind: 'practice',
			questions: label.includes('1')
				? undefined
				: [
						{
							skill_slug: 'balance',
							question_purpose: 'application',
							response_type: 'multiple_choice',
							difficulty: 'easy',
							prompt: 'Solve `x + 3 = 7`.',
							choices: ['x = 4', 'x = 10'],
							correct_index: 0,
							explanation: 'Subtract 3 from both sides.'
						}
					]
		};
	}
}

test('generateContent emits structured progress and artifact events', async () => {
	const topicDir = await tempTopic();
	const events = [];
	const result = await generateContent(
		{
			command: 'generate',
			topicDir,
			concurrency: 2,
			model: defaultGenerationConfig.model,
			thinkingLevels: defaultGenerationConfig.thinkingLevels
		},
		{
			emit: (event) => events.push(event),
			loadTopicInput: async () => fakeInput(topicDir),
			AgentRunner: FakeRunner,
			bundleRun: async () => ({
				report: {
					valid: true,
					counts: { lessons: 1, quizzes: 1, questions: 0 },
					failures: []
				}
			}),
			now: () => new Date('2026-05-26T12:00:00.000Z')
		}
	);

	assert.equal(result.run.report.valid, true);
	assert.equal(events[0].type, 'pipeline_start');
	assert.equal(events.some((event) => event.type === 'warning' && event.message === 'test warning'), true);
	assert.equal(events.some((event) => event.type === 'stage_start' && event.stage === 'generate'), true);
	assert.equal(events.filter((event) => event.type === 'task_complete').length, 8);
	assert.equal(events.some((event) => event.type === 'artifact' && event.kind === 'manifest'), true);
	assert.equal(events.some((event) => event.type === 'validation' && event.valid), true);
	assert.equal(events.at(-1).type, 'pipeline_end');
});

test('generateContent formats quiz drafts for review without derived fields', async () => {
	const topicDir = await tempTopic();
	let reviewPrompt = '';

	await generateContent(
		{
			command: 'generate',
			topicDir,
			concurrency: 1,
			model: defaultGenerationConfig.model,
			thinkingLevels: defaultGenerationConfig.thinkingLevels
		},
		{
			loadTopicInput: async () => fakeInput(topicDir),
			AgentRunner: class {
				async run({ systemPromptName, prompt }) {
					if (systemPromptName === 'MODULES.md') {
						return {
							summary: 'One module',
							modules: [
								{
									slug: 'basics',
									title: 'Basics',
									description: 'Equation basics',
									content_responsibility: 'Teach basics'
								}
							]
						};
					}
					if (systemPromptName === 'SYLLABUS.md') {
						return {
							summary: 'One quiz',
							syllabus: [
								{
									type: 'quiz',
									module_slug: 'basics',
									focus: 'Equation checks',
									goals: 'Check',
									question_count: 1,
									skills: [{ slug: 'balance', name: 'Balance', device: 'Balance', summary: 'Balance.' }]
								}
							]
						};
					}
					if (systemPromptName === 'QUIZ.md') {
						return {
							type: 'quiz',
							kind: 'practice',
							title: 'Equation Checks',
							description: 'Check equations.',
							questions: [
								{
									skill_slug: 'balance',
									question_purpose: 'application',
									response_type: 'multiple_choice',
									difficulty: 'easy',
									prompt: 'Solve `x + 3 = 7`.',
									choices: ['x = 4', 'x = 10'],
									correct_index: 0,
									explanation: 'Subtract 3 from both sides.'
								}
							]
						};
					}
					reviewPrompt = prompt;
					return {
						type: 'quiz',
						kind: 'practice',
						title: 'Equation Checks',
						description: 'Check equations.',
						questions: [
							{
								skill_slug: 'balance',
								question_purpose: 'application',
								response_type: 'multiple_choice',
								difficulty: 'easy',
								prompt: 'Solve `x + 3 = 7`.',
								choices: ['x = 4', 'x = 10'],
								correct_index: 0,
								explanation: 'Subtract 3 from both sides.'
							}
						]
					};
				}
			},
			bundleRun: async () => ({
				report: {
					valid: true,
					counts: { lessons: 0, quizzes: 1, questions: 1 },
					failures: []
				}
			}),
			now: () => new Date('2026-05-26T12:00:00.000Z')
		}
	);

	const draftMatch = reviewPrompt.match(/Draft item:\n([\s\S]*?)\n\nTopic directory:/);
	assert.ok(draftMatch);
	const draft = JSON.parse(draftMatch[1]);
	assert.deepEqual(Object.keys(draft), ['title', 'description', 'questions']);
	assert.equal(draft.title, 'Equation Checks');
	assert.equal(draft.questions.length, 1);
});

test('generateContent resumes valid cached artifacts without calling agents', async () => {
	const topicDir = await tempTopic();
	const modulePlan = {
		summary: 'One module',
		modules: [
			{
				slug: 'basics',
				title: 'Basics',
				description: 'Equation basics',
				content_responsibility: 'Teach basics'
			}
		]
	};
	const syllabus = {
		summary: 'One item',
		syllabus: [
			{
				type: 'lesson',
				module_slug: 'basics',
				focus: 'Balance equations',
				goals: 'Balance equations',
				skills: [{ slug: 'balance', name: 'Balance', device: 'Balance', summary: 'Balance.' }]
			}
		]
	};
	const lesson = {
		type: 'lesson',
		title: 'Balance Equations',
		summary: 'Balance equations.',
		estimated_minutes: 5,
		skill_slugs: ['balance'],
		body_markdown: lessonMarkdown()
	};
	await mkdir(join(topicDir, '.content-pipeline', 'modules', '001-basics'), { recursive: true });
	await mkdir(join(topicDir, '.content-pipeline', 'items'), { recursive: true });
	await mkdir(join(topicDir, '.content-pipeline', 'reviewed'), { recursive: true });
	await writeFile(
		join(topicDir, '.content-pipeline', 'TOPIC_MODULES.json'),
		`${JSON.stringify(modulePlan, null, 2)}\n`
	);
	await writeFile(
		join(topicDir, '.content-pipeline', 'modules', '001-basics', 'SYLLABUS.json'),
		`${JSON.stringify(syllabus, null, 2)}\n`
	);
	await writeFile(
		join(topicDir, '.content-pipeline', 'items', '001-lesson-balance-equations.lesson.md'),
		lessonFile({
			title: lesson.title,
			summary: lesson.summary,
			skillSlug: 'balance',
			body: lesson.body_markdown
		})
	);
	await writeFile(
		join(topicDir, '.content-pipeline', 'items', '001-lesson-balance-equations.lesson-interactions.json'),
		`${JSON.stringify(interactionSidecar(), null, 2)}\n`
	);
	await writeFile(
		join(topicDir, '.content-pipeline', 'reviewed', '001-lesson-balance-equations.lesson.md'),
		lessonFile({
			title: lesson.title,
			summary: lesson.summary,
			skillSlug: 'balance',
			body: lesson.body_markdown
		})
	);
	await writeFile(
		join(topicDir, '.content-pipeline', 'reviewed', '001-lesson-balance-equations.lesson-interactions.json'),
		`${JSON.stringify(interactionSidecar(), null, 2)}\n`
	);

	const events = [];
	await generateContent(
		{
			command: 'generate',
			topicDir,
			concurrency: 2,
			model: defaultGenerationConfig.model,
			thinkingLevels: defaultGenerationConfig.thinkingLevels
		},
		{
			emit: (event) => events.push(event),
			loadTopicInput: async () => fakeInput(topicDir),
			AgentRunner: class {
				async run() {
					throw new Error('agent should not run for cached artifacts');
				}
			},
			bundleRun: async () => ({
				report: {
					valid: true,
					counts: { lessons: 1, quizzes: 0, questions: 0 },
					failures: []
				}
			}),
			now: () => new Date('2026-05-26T12:00:00.000Z')
		}
	);

	assert.equal(events.some((event) => event.type === 'resume_miss'), false);
	assert.equal(events.filter((event) => event.type === 'task_complete' && event.resumed).length, 6);
});

test('generateContent promotes valid draft lesson interactions when reviewed cache is invalid', async () => {
	const topicDir = await tempTopic();
	const modulePlan = {
		summary: 'One module',
		modules: [
			{
				slug: 'basics',
				title: 'Basics',
				description: 'Equation basics',
				content_responsibility: 'Teach basics'
			}
		]
	};
	const syllabus = {
		summary: 'One item',
		syllabus: [
			{
				type: 'lesson',
				module_slug: 'basics',
				focus: 'Balance equations',
				goals: 'Balance equations',
				skills: [{ slug: 'balance', name: 'Balance', device: 'Balance', summary: 'Balance.' }]
			}
		]
	};
	const lesson = {
		type: 'lesson',
		title: 'Balance Equations',
		summary: 'Balance equations.',
		estimated_minutes: 5,
		skill_slugs: ['balance'],
		body_markdown: lessonMarkdown()
	};
	await mkdir(join(topicDir, '.content-pipeline', 'modules', '001-basics'), { recursive: true });
	await mkdir(join(topicDir, '.content-pipeline', 'items'), { recursive: true });
	await mkdir(join(topicDir, '.content-pipeline', 'reviewed'), { recursive: true });
	await writeFile(
		join(topicDir, '.content-pipeline', 'TOPIC_MODULES.json'),
		`${JSON.stringify(modulePlan, null, 2)}\n`
	);
	await writeFile(
		join(topicDir, '.content-pipeline', 'modules', '001-basics', 'SYLLABUS.json'),
		`${JSON.stringify(syllabus, null, 2)}\n`
	);
	await writeFile(
		join(topicDir, '.content-pipeline', 'items', '001-lesson-balance-equations.lesson.md'),
		lessonFile({
			title: lesson.title,
			summary: lesson.summary,
			skillSlug: 'balance',
			body: lesson.body_markdown
		})
	);
	await writeFile(
		join(topicDir, '.content-pipeline', 'items', '001-lesson-balance-equations.lesson-interactions.json'),
		`${JSON.stringify(interactionSidecar(), null, 2)}\n`
	);
	await writeFile(
		join(topicDir, '.content-pipeline', 'reviewed', '001-lesson-balance-equations.lesson.md'),
		lessonFile({
			title: lesson.title,
			summary: lesson.summary,
			skillSlug: 'balance',
			body: lesson.body_markdown
		})
	);
	await writeFile(
		join(
			topicDir,
			'.content-pipeline',
			'reviewed',
			'001-lesson-balance-equations.lesson-interactions.json'
		),
		`${JSON.stringify({ interactions: [] }, null, 2)}\n`
	);

	let bundledItems = null;
	const events = [];
	await generateContent(
		{
			command: 'generate',
			topicDir,
			concurrency: 2,
			model: defaultGenerationConfig.model,
			thinkingLevels: defaultGenerationConfig.thinkingLevels
		},
		{
			emit: (event) => events.push(event),
			loadTopicInput: async () => fakeInput(topicDir),
			AgentRunner: class {
				async run() {
					throw new Error('agent should not run when draft interactions are valid');
				}
			},
			bundleRun: async ({ reviewedItems }) => {
				bundledItems = reviewedItems;
				return {
					report: {
						valid: true,
						counts: { lessons: 1, quizzes: 0, questions: 0 },
						failures: []
					}
				};
			},
			now: () => new Date('2026-05-26T12:00:00.000Z')
		}
	);

	const reviewedSidecar = JSON.parse(
		await readFile(
			join(
				topicDir,
				'.content-pipeline',
				'reviewed',
				'001-lesson-balance-equations.lesson-interactions.json'
			),
			'utf8'
		)
	);
	assert.deepEqual(reviewedSidecar, interactionSidecar());
	assert.equal(bundledItems[0].type, 'lesson');
	assert.equal(bundledItems[0].interactions.length, 1);
	assert.equal(
		events.some((event) => event.type === 'resume_miss' && event.label === 'review interactions 1'),
		true
	);
});

test('generateContent promotes draft lesson when reviewed cache drops interaction directives', async () => {
	const topicDir = await tempTopic();
	const modulePlan = {
		summary: 'One module',
		modules: [
			{
				slug: 'basics',
				title: 'Basics',
				description: 'Equation basics',
				content_responsibility: 'Teach basics'
			}
		]
	};
	const syllabus = {
		summary: 'One item',
		syllabus: [
			{
				type: 'lesson',
				module_slug: 'basics',
				focus: 'Balance equations',
				goals: 'Balance equations',
				skills: [{ slug: 'balance', name: 'Balance', device: 'Balance', summary: 'Balance.' }]
			}
		]
	};
	const lesson = {
		type: 'lesson',
		title: 'Balance Equations',
		summary: 'Balance equations.',
		estimated_minutes: 5,
		skill_slugs: ['balance'],
		body_markdown: lessonMarkdown()
	};
	await mkdir(join(topicDir, '.content-pipeline', 'modules', '001-basics'), { recursive: true });
	await mkdir(join(topicDir, '.content-pipeline', 'items'), { recursive: true });
	await mkdir(join(topicDir, '.content-pipeline', 'reviewed'), { recursive: true });
	await writeFile(
		join(topicDir, '.content-pipeline', 'TOPIC_MODULES.json'),
		`${JSON.stringify(modulePlan, null, 2)}\n`
	);
	await writeFile(
		join(topicDir, '.content-pipeline', 'modules', '001-basics', 'SYLLABUS.json'),
		`${JSON.stringify(syllabus, null, 2)}\n`
	);
	await writeFile(
		join(topicDir, '.content-pipeline', 'items', '001-lesson-balance-equations.lesson.md'),
		lessonFile({
			title: lesson.title,
			summary: lesson.summary,
			skillSlug: 'balance',
			body: lesson.body_markdown
		})
	);
	await writeFile(
		join(topicDir, '.content-pipeline', 'items', '001-lesson-balance-equations.lesson-interactions.json'),
		`${JSON.stringify(interactionSidecar(), null, 2)}\n`
	);
	await writeFile(
		join(topicDir, '.content-pipeline', 'reviewed', '001-lesson-balance-equations.lesson.md'),
		lessonFile({
			title: lesson.title,
			summary: lesson.summary,
			skillSlug: 'balance',
			body: '# Balance Equations\n\nKeep both sides equal.\n'
		})
	);

	let bundledItems = null;
	await generateContent(
		{
			command: 'generate',
			topicDir,
			concurrency: 2,
			model: defaultGenerationConfig.model,
			thinkingLevels: defaultGenerationConfig.thinkingLevels
		},
		{
			loadTopicInput: async () => fakeInput(topicDir),
			AgentRunner: class {
				async run() {
					throw new Error('agent should not run when the draft lesson is structurally valid');
				}
			},
			bundleRun: async ({ reviewedItems }) => {
				bundledItems = reviewedItems;
				return {
					report: {
						valid: true,
						counts: { lessons: 1, quizzes: 0, questions: 0 },
						failures: []
					}
				};
			},
			now: () => new Date('2026-05-26T12:00:00.000Z')
		}
	);

	const reviewedLesson = await readFile(
		join(topicDir, '.content-pipeline', 'reviewed', '001-lesson-balance-equations.lesson.md'),
		'utf8'
	);
	assert.equal(reviewedLesson.includes('::concept-check{slug="balance-check"}'), true);
	assert.equal(bundledItems[0].type, 'lesson');
	assert.equal(bundledItems[0].interactions.length, 1);
});

test('generateContent matches cached items to later modules by slug when module ids are absent', async () => {
	const topicDir = await tempTopic();
	const modulePlan = {
		summary: 'Two modules',
		modules: [
			{
				slug: 'basics',
				title: 'Basics',
				description: 'Equation basics',
				content_responsibility: 'Teach basics'
			},
			{
				slug: 'graphs',
				title: 'Graphs',
				description: 'Graphing equations',
				content_responsibility: 'Teach graphing'
			}
		]
	};
	const basicsSyllabus = {
		summary: 'Basics items',
		syllabus: [
			{
				type: 'lesson',
				module_slug: 'basics',
				focus: 'Balance equations',
				goals: 'Balance equations',
				skills: [{ slug: 'balance', name: 'Balance', device: 'Balance', summary: 'Balance.' }]
			}
		]
	};
	const graphsSyllabus = {
		summary: 'Graph items',
		syllabus: [
			{
				type: 'lesson',
				module_slug: 'graphs',
				focus: 'Graph equations',
				goals: 'Graph equations',
				skills: [{ slug: 'graph', name: 'Graph', device: 'Graph', summary: 'Graph.' }]
			}
		]
	};
	const balanceLesson = lessonFile({
		title: 'Balance Equations',
		summary: 'Balance equations.',
		skillSlug: 'balance',
		body: lessonMarkdown()
	});
	const graphLesson = lessonFile({
		title: 'Graph Equations',
		summary: 'Graph equations.',
		skillSlug: 'graph',
		body: lessonMarkdown('Graph')
	});
	await mkdir(join(topicDir, '.content-pipeline', 'modules', '001-basics'), { recursive: true });
	await mkdir(join(topicDir, '.content-pipeline', 'modules', '002-graphs'), { recursive: true });
	await mkdir(join(topicDir, '.content-pipeline', 'items'), { recursive: true });
	await mkdir(join(topicDir, '.content-pipeline', 'reviewed'), { recursive: true });
	await writeFile(
		join(topicDir, '.content-pipeline', 'TOPIC_MODULES.json'),
		`${JSON.stringify(modulePlan, null, 2)}\n`
	);
	await writeFile(
		join(topicDir, '.content-pipeline', 'modules', '001-basics', 'SYLLABUS.json'),
		`${JSON.stringify(basicsSyllabus, null, 2)}\n`
	);
	await writeFile(
		join(topicDir, '.content-pipeline', 'modules', '002-graphs', 'SYLLABUS.json'),
		`${JSON.stringify(graphsSyllabus, null, 2)}\n`
	);
	await writeFile(
		join(topicDir, '.content-pipeline', 'items', '001-lesson-balance-equations.lesson.md'),
		balanceLesson
	);
	await writeFile(
		join(topicDir, '.content-pipeline', 'items', '001-lesson-balance-equations.lesson-interactions.json'),
		`${JSON.stringify(interactionSidecar(), null, 2)}\n`
	);
	await writeFile(
		join(topicDir, '.content-pipeline', 'items', '002-lesson-graph-equations.lesson.md'),
		graphLesson
	);
	await writeFile(
		join(topicDir, '.content-pipeline', 'items', '002-lesson-graph-equations.lesson-interactions.json'),
		`${JSON.stringify(interactionSidecar('graph'), null, 2)}\n`
	);
	await writeFile(
		join(topicDir, '.content-pipeline', 'reviewed', '001-lesson-balance-equations.lesson.md'),
		balanceLesson
	);
	await writeFile(
		join(topicDir, '.content-pipeline', 'reviewed', '001-lesson-balance-equations.lesson-interactions.json'),
		`${JSON.stringify(interactionSidecar(), null, 2)}\n`
	);
	await writeFile(
		join(topicDir, '.content-pipeline', 'reviewed', '002-lesson-graph-equations.lesson.md'),
		graphLesson
	);
	await writeFile(
		join(topicDir, '.content-pipeline', 'reviewed', '002-lesson-graph-equations.lesson-interactions.json'),
		`${JSON.stringify(interactionSidecar('graph'), null, 2)}\n`
	);

	const events = [];
	await generateContent(
		{
			command: 'generate',
			topicDir,
			concurrency: 2,
			model: defaultGenerationConfig.model,
			thinkingLevels: defaultGenerationConfig.thinkingLevels
		},
		{
			emit: (event) => events.push(event),
			loadTopicInput: async () => fakeInput(topicDir),
			AgentRunner: class {
				async run() {
					throw new Error('agent should not run for cached artifacts');
				}
			},
			bundleRun: async () => ({
				report: {
					valid: true,
					counts: { lessons: 2, quizzes: 0, questions: 0 },
					failures: []
				}
			}),
			now: () => new Date('2026-05-26T12:00:00.000Z')
		}
	);

	assert.equal(events.some((event) => event.type === 'resume_miss'), false);
	assert.equal(events.filter((event) => event.type === 'task_complete' && event.resumed).length, 11);
});

test('generateContent ignores legacy item JSON caches after authoring format migration', async () => {
	const topicDir = await tempTopic();
	const modulePlan = {
		summary: 'One module',
		modules: [
			{
				slug: 'basics',
				title: 'Basics',
				description: 'Equation basics',
				content_responsibility: 'Teach basics'
			}
		]
	};
	const syllabus = {
		summary: 'One item',
		syllabus: [
			{
				type: 'lesson',
				module_slug: 'basics',
				focus: 'Balance equations',
				goals: 'Balance equations',
				skills: [{ slug: 'balance', name: 'Balance', device: 'Balance', summary: 'Balance.' }]
			}
		]
	};
	const legacyLesson = {
		type: 'lesson',
		slug: 'balance-equations',
		title: 'Balance Equations',
		summary: 'Balance equations.',
		estimated_minutes: 5,
		skills: [{ slug: 'balance', name: 'Balance', device: 'Balance', summary: 'Balance.' }],
		body_markdown: '# Legacy Balance\n'
	};
	await mkdir(join(topicDir, '.content-pipeline', 'modules', '001-basics'), { recursive: true });
	await mkdir(join(topicDir, '.content-pipeline', 'items'), { recursive: true });
	await mkdir(join(topicDir, '.content-pipeline', 'reviewed'), { recursive: true });
	await writeFile(
		join(topicDir, '.content-pipeline', 'TOPIC_MODULES.json'),
		`${JSON.stringify(modulePlan, null, 2)}\n`
	);
	await writeFile(
		join(topicDir, '.content-pipeline', 'modules', '001-basics', 'SYLLABUS.json'),
		`${JSON.stringify(syllabus, null, 2)}\n`
	);
	await writeFile(
		join(topicDir, '.content-pipeline', 'items', '001-lesson-balance-equations.json'),
		`${JSON.stringify(legacyLesson, null, 2)}\n`
	);
	await writeFile(
		join(topicDir, '.content-pipeline', 'reviewed', '001-lesson-balance-equations.json'),
		`${JSON.stringify(legacyLesson, null, 2)}\n`
	);

	let agentCalls = 0;
	const events = [];
	await generateContent(
		{
			command: 'generate',
			topicDir,
			concurrency: 2,
			model: defaultGenerationConfig.model,
			thinkingLevels: defaultGenerationConfig.thinkingLevels
		},
		{
			emit: (event) => events.push(event),
			loadTopicInput: async () => fakeInput(topicDir),
			AgentRunner: class {
				async run() {
					agentCalls += 1;
					if (agentCalls === 2 || agentCalls === 4) {
						return interactionSidecar();
					}
					return {
						type: 'lesson',
						title: 'Balance Equations',
						summary: 'Balance equations.',
						estimated_minutes: 5,
						skill_slugs: ['balance'],
						body_markdown: lessonMarkdown()
					};
				}
			},
			bundleRun: async () => ({
				report: {
					valid: true,
					counts: { lessons: 1, quizzes: 0, questions: 0 },
					failures: []
				}
			}),
			now: () => new Date('2026-05-26T12:00:00.000Z')
		}
	);

	assert.equal(agentCalls, 3);
	assert.equal(
		events.some(
			(event) =>
				event.type === 'resume_miss' &&
				event.artifactPath.endsWith('001-lesson-balance-equations.lesson.md')
		),
		true
	);
});
