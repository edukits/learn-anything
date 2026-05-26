import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
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
					{ type: 'lesson', module_slug: 'basics', focus: 'Balance equations', goals: 'Balance' },
					{ type: 'quiz', module_slug: 'basics', focus: 'Equation checks', goals: 'Check' }
				]
			};
		}
		if (systemPromptName === 'LESSON.md') {
			return {
				type: 'lesson',
				slug: 'balance-equations',
				title: 'Balance Equations',
				summary: 'Balance equations.',
				estimated_minutes: 5,
				skills: [{ slug: 'balance', name: 'Balance', device: 'Balance', summary: 'Balance.' }],
				body_markdown: '# Balance\n'
			};
		}
		if (systemPromptName === 'QUIZ.md') {
			return {
				type: 'quiz',
				slug: 'equation-checks',
				title: 'Equation Checks',
				description: 'Check equations.',
				kind: 'practice',
				skills: [{ slug: 'balance', name: 'Balance', device: 'Balance', summary: 'Balance.' }],
				questions: []
			};
		}
		return {
			type: label.includes('1') ? 'lesson' : 'quiz',
			slug: label.includes('1') ? 'balance-equations' : 'equation-checks',
			title: label,
			summary: 'Reviewed.',
			estimated_minutes: 5,
			skills: [{ slug: 'balance', name: 'Balance', device: 'Balance', summary: 'Balance.' }],
			body_markdown: '# Reviewed\n',
			description: 'Reviewed.',
			kind: 'practice',
			questions: []
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
	assert.equal(events.filter((event) => event.type === 'task_complete').length, 6);
	assert.equal(events.some((event) => event.type === 'artifact' && event.kind === 'manifest'), true);
	assert.equal(events.some((event) => event.type === 'validation' && event.valid), true);
	assert.equal(events.at(-1).type, 'pipeline_end');
});
