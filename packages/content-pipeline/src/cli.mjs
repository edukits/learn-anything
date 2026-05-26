#!/usr/bin/env node
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import pc from 'picocolors';
import { AgentRunner, buildSourceContext } from './agent.mjs';
import { bundleRun } from './bundle.mjs';
import { defaultGenerationConfig, thinkingLevelForStage } from './config.mjs';
import { runLimited } from './concurrency.mjs';
import { loadTopicInput } from './input.mjs';
import {
	schemaForItemType,
	validateModulePlan,
	validateSyllabus,
	validateWithSchema
} from './schemas.mjs';
import { slugify, snakeId, writeJson } from './utils.mjs';

function usage() {
	const { concurrency, model } = defaultGenerationConfig;
	return [
		'Usage:',
		`  content-pipeline generate <topic-dir> [--concurrency ${concurrency}] [--model ${model}]`,
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
	const options = {
		command,
		topicDir,
		concurrency: defaultGenerationConfig.concurrency,
		model: defaultGenerationConfig.model,
		thinkingLevels: defaultGenerationConfig.thinkingLevels
	};
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

function modulePathSegment(module, index) {
	return `${String(index + 1).padStart(3, '0')}-${slugify(module.slug ?? module.title ?? `module-${index + 1}`)}`;
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

function combineModuleSyllabi(modulePlan, moduleSyllabi) {
	return {
		summary: modulePlan.summary,
		modules: modulePlan.modules,
		syllabus: moduleSyllabi.flatMap((moduleSyllabus, moduleIndex) => {
			const module = modulePlan.modules[moduleIndex];
			return moduleSyllabus.syllabus.map((item) => ({
				...item,
				module_slug: item.module_slug ?? module.slug,
				module_id: item.module_id ?? module.id
			}));
		})
	};
}

function moduleForItem(modulePlan, item) {
	return (
		modulePlan.modules.find(
			(module) => module.id === item.module_id || module.slug === item.module_slug
		) ?? modulePlan.modules[0]
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
	const modulesDir = resolve(pipelineDir, 'modules');
	const distDir = resolve(input.topicDir, 'dist');
	await mkdir(itemsDir, { recursive: true });
	await mkdir(reviewedDir, { recursive: true });
	await mkdir(modulesDir, { recursive: true });

	const runner = new AgentRunner({
		cwd: input.topicDir,
		modelName: options.model
	});

	const sourceContext = buildSourceContext(input);
	const topicContext = contextFor(input);
	const modulesPath = '.content-pipeline/TOPIC_MODULES.json';
	process.stderr.write(`${pc.cyan('stage')} modules\n`);
	const modulePlan = await runner.run({
		label: 'modules',
		systemPromptName: 'MODULES.md',
		expectedJsonPath: modulesPath,
		thinkingLevel: thinkingLevelForStage(options, 'modules'),
		validate: validateModulePlan,
		prompt: [
			'Create the topic module plan.',
			`Write only valid JSON to ${modulesPath}.`,
			'Use topic identity exactly as provided; do not invent subject/topic IDs.',
			'',
			'Topic metadata:',
			topicContext,
			'',
			sourceContext
		].join('\n')
	});

	const moduleSyllabusPaths = modulePlan.modules.map(
		(module, index) => `.content-pipeline/modules/${modulePathSegment(module, index)}/SYLLABUS.json`
	);
	await Promise.all(
		modulePlan.modules.map((module, index) =>
			mkdir(resolve(modulesDir, modulePathSegment(module, index)), { recursive: true })
		)
	);
	process.stderr.write(`${pc.cyan('stage')} syllabi ${modulePlan.modules.length} modules\n`);
	const moduleSyllabi = await runLimited(
		modulePlan.modules,
		options.concurrency,
		async (module, index) => {
			const syllabusPath = moduleSyllabusPaths[index];
			return runner.run({
				label: `syllabus ${index + 1}`,
				systemPromptName: 'SYLLABUS.md',
				expectedJsonPath: syllabusPath,
				thinkingLevel: thinkingLevelForStage(options, 'syllabus'),
				validate: validateSyllabus,
				prompt: [
					`Create the syllabus for module ${index + 1}.`,
					`Write only valid JSON to ${syllabusPath}.`,
					'Use topic identity exactly as provided; do not invent subject/topic IDs.',
					'Every syllabus item must include this module slug.',
					'',
					'Topic metadata:',
					topicContext,
					'',
					'Module metadata:',
					JSON.stringify(module, null, 2),
					'',
					'Full module plan:',
					JSON.stringify(modulePlan, null, 2),
					'',
					sourceContext
				].join('\n')
			});
		}
	);
	const syllabus = combineModuleSyllabi(modulePlan, moduleSyllabi);

	process.stderr.write(`${pc.cyan('stage')} generate ${syllabus.syllabus.length} items\n`);
	const draftItems = await runLimited(
		syllabus.syllabus,
		options.concurrency,
		async (item, index) => {
			const outputPath = itemPathFor(item, index, '.content-pipeline/items');
			const systemPromptName = item.type === 'lesson' ? 'LESSON.md' : 'QUIZ.md';
			const validateItem = validateWithSchema(schemaForItemType(item.type));
			const module = moduleForItem(modulePlan, item);
			const moduleSyllabus = moduleSyllabi[modulePlan.modules.indexOf(module)];
			return runner.run({
				label: `${item.type} ${index + 1}`,
				systemPromptName,
				expectedJsonPath: outputPath,
				thinkingLevel: thinkingLevelForStage(options, item.type),
				validate: validateItem,
				prompt: [
					`Generate syllabus item ${index + 1}.`,
					`Write only valid JSON to ${outputPath}.`,
					'',
					'Topic metadata:',
					topicContext,
					'',
					'Module metadata:',
					JSON.stringify(module, null, 2),
					'',
					'Module syllabus:',
					JSON.stringify(moduleSyllabus, null, 2),
					'',
					'Syllabus item:',
					JSON.stringify(item, null, 2),
					'',
					sourceContext
				].join('\n')
			});
		}
	);

	process.stderr.write(`${pc.cyan('stage')} review ${draftItems.length} items\n`);
	const reviewedItems = await runLimited(draftItems, options.concurrency, async (draft, index) => {
		const outputPath = itemPathFor(syllabus.syllabus[index], index, '.content-pipeline/reviewed');
		const validateItem = validateWithSchema(schemaForItemType(syllabus.syllabus[index].type));
		const module = moduleForItem(modulePlan, syllabus.syllabus[index]);
		const moduleSyllabus = moduleSyllabi[modulePlan.modules.indexOf(module)];
		return runner.run({
			label: `review ${index + 1}`,
			systemPromptName: 'REVIEW.md',
			expectedJsonPath: outputPath,
			thinkingLevel: thinkingLevelForStage(options, 'review'),
			validate: validateItem,
			prompt: [
				`Review and correct syllabus item ${index + 1}.`,
				`Write only valid JSON to ${outputPath}.`,
				'Preserve the same top-level item type.',
				'',
				'Topic metadata:',
				topicContext,
				'',
				'Module metadata:',
				JSON.stringify(module, null, 2),
				'',
				'Module syllabus:',
				JSON.stringify(moduleSyllabus, null, 2),
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
		thinking_levels: options.thinkingLevels,
		topic_dir: input.topicDir,
		started_at: new Date().toISOString(),
		modules_path: modulesPath,
		module_syllabus_paths: moduleSyllabusPaths
	});

	process.stderr.write(`${pc.cyan('stage')} bundle\n`);
	const run = await bundleRun({
		input,
		modules: modulePlan,
		syllabus,
		reviewedItems,
		outDir: distDir,
		runId
	});
	process.stdout.write(
		`Content validation ${run.report.valid ? 'passed' : 'failed'}: ${distDir}/manifest.json\n`
	);
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
