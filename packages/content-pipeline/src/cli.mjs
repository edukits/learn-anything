#!/usr/bin/env node
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import pc from 'picocolors';
import { z } from 'zod';
import { AgentRunner, buildSourceContext } from './agent.mjs';
import { bundleRun } from './bundle.mjs';
import { runLimited } from './concurrency.mjs';
import { loadTopicInput } from './input.mjs';
import { slugify, snakeId, writeJson } from './utils.mjs';

const defaultModel = 'openai-codex:gpt-5.5';

const syllabusItemSchema = z.object({
	type: z.enum(['lesson', 'quiz']),
	slug: z.string().min(1).optional(),
	focus: z.string().min(1),
	goals: z.string().min(1),
	nonGoals: z.string().min(1).optional(),
	skills: z
		.array(
			z.object({
				id: z.string().min(1).optional(),
				slug: z.string().min(1).optional(),
				name: z.string().min(1),
				device: z.string().min(1).optional(),
				summary: z.string().min(1).optional()
			})
		)
		.optional(),
	question_count: z.number().int().positive().optional()
});

const syllabusSchema = z.object({
	summary: z.string().min(1).optional(),
	syllabus: z.array(syllabusItemSchema).min(1)
});

function usage() {
	return [
		'Usage:',
		'  content-pipeline generate <topic-dir> [--concurrency 3] [--model openai-codex:gpt-5.5]',
		'',
		'Topic directory contract:',
		'  topic.json',
		'  README.md',
		'  sources/sources.json optional'
	].join('\n');
}

function parseArgs(args) {
	const [command, topicDir, ...rest] = args;
	if (command !== 'generate' || !topicDir) {
		throw new Error(usage());
	}
	const options = { command, topicDir, concurrency: 3, model: defaultModel };
	for (let index = 0; index < rest.length; index += 1) {
		const arg = rest[index];
		if (arg === '--concurrency') {
			options.concurrency = Number.parseInt(rest[index + 1] ?? '', 10);
			index += 1;
			continue;
		}
		if (arg === '--model') {
			options.model = rest[index + 1] ?? '';
			index += 1;
			continue;
		}
		throw new Error(`Unknown option ${arg}\n\n${usage()}`);
	}
	if (!Number.isInteger(options.concurrency) || options.concurrency < 1) {
		throw new Error('--concurrency must be a positive integer.');
	}
	return options;
}

function runIdFor(input, now = new Date()) {
	const date = now.toISOString().slice(0, 10).replaceAll('-', '_');
	return `run_${date}_${snakeId(input.topic.subject.slug)}_${snakeId(input.topic.topic.slug)}_v1`;
}

function itemPathFor(item, index, dir) {
	const slug = slugify(item.slug ?? item.focus ?? `${item.type}-${index + 1}`);
	return `${dir}/${String(index + 1).padStart(3, '0')}-${item.type}-${slug}.json`;
}

function contextFor(input) {
	return JSON.stringify(
		{
			topic: input.topic,
			source_refs: input.sourceRefs,
			legacy: input.legacy
		},
		null,
		2
	);
}

async function generate(options) {
	const input = await loadTopicInput(options.topicDir);
	for (const warning of input.warnings) {
		process.stderr.write(`${pc.yellow('warning')} ${warning}\n`);
	}

	const pipelineDir = resolve(input.topicDir, '.content-pipeline');
	const itemsDir = resolve(pipelineDir, 'items');
	const reviewedDir = resolve(pipelineDir, 'reviewed');
	const distDir = resolve(input.topicDir, 'dist');
	await mkdir(itemsDir, { recursive: true });
	await mkdir(reviewedDir, { recursive: true });

	const runner = new AgentRunner({
		cwd: input.topicDir,
		modelName: options.model
	});

	const sourceContext = buildSourceContext(input);
	const topicContext = contextFor(input);
	const syllabusPath = '.content-pipeline/TOPIC_SYLLABUS.json';
	process.stderr.write(`${pc.cyan('stage')} syllabus\n`);
	const rawSyllabus = await runner.run({
		label: 'syllabus',
		systemPromptName: 'SYLLABUS.md',
		expectedJsonPath: syllabusPath,
		prompt: [
			'Create the topic syllabus.',
			`Write only valid JSON to ${syllabusPath}.`,
			'Use topic identity exactly as provided; do not invent subject/topic IDs.',
			'',
			'Topic metadata:',
			topicContext,
			'',
			sourceContext
		].join('\n')
	});
	const syllabus = syllabusSchema.parse(rawSyllabus);

	process.stderr.write(`${pc.cyan('stage')} generate ${syllabus.syllabus.length} items\n`);
	const draftItems = await runLimited(syllabus.syllabus, options.concurrency, async (item, index) => {
		const outputPath = itemPathFor(item, index, '.content-pipeline/items');
		const systemPromptName = item.type === 'lesson' ? 'LESSON.md' : 'QUIZ.md';
		return runner.run({
			label: `${item.type} ${index + 1}`,
			systemPromptName,
			expectedJsonPath: outputPath,
			prompt: [
				`Generate syllabus item ${index + 1}.`,
				`Write only valid JSON to ${outputPath}.`,
				'',
				'Topic metadata:',
				topicContext,
				'',
				'Syllabus item:',
				JSON.stringify(item, null, 2),
				'',
				sourceContext
			].join('\n')
		});
	});

	process.stderr.write(`${pc.cyan('stage')} review ${draftItems.length} items\n`);
	const reviewedItems = await runLimited(draftItems, options.concurrency, async (draft, index) => {
		const outputPath = itemPathFor(syllabus.syllabus[index], index, '.content-pipeline/reviewed');
		return runner.run({
			label: `review ${index + 1}`,
			systemPromptName: 'REVIEW.md',
			expectedJsonPath: outputPath,
			prompt: [
				`Review and correct syllabus item ${index + 1}.`,
				`Write only valid JSON to ${outputPath}.`,
				'Preserve the same top-level item type.',
				'',
				'Topic metadata:',
				topicContext,
				'',
				'Syllabus item:',
				JSON.stringify(syllabus.syllabus[index], null, 2),
				'',
				'Draft item:',
				JSON.stringify(draft, null, 2),
				'',
				sourceContext
			].join('\n')
		});
	});

	const runId = runIdFor(input);
	await writeJson(resolve(pipelineDir, 'run.json'), {
		run_id: runId,
		model: options.model,
		concurrency: options.concurrency,
		topic_dir: input.topicDir,
		started_at: new Date().toISOString(),
		syllabus_path: syllabusPath
	});

	process.stderr.write(`${pc.cyan('stage')} bundle\n`);
	const run = await bundleRun({
		input,
		syllabus,
		reviewedItems,
		outDir: distDir,
		runId
	});
	process.stdout.write(`Content validation ${run.report.valid ? 'passed' : 'failed'}: ${distDir}/manifest.json\n`);
	if (!run.report.valid) {
		for (const failure of run.report.failures) {
			process.stderr.write(`- ${failure}\n`);
		}
		process.exitCode = 1;
	}
}

export async function main(args = process.argv.slice(2)) {
	try {
		const options = parseArgs(args);
		await generate(options);
	} catch (error) {
		process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
		process.exitCode = 1;
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	await main();
}

export { parseArgs, runIdFor };
