import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { AgentRunner, buildSourceContext, readValidatedArtifact } from './agent.mjs';
import { bundleRun } from './bundle.mjs';
import { thinkingLevelForStage } from './config.mjs';
import { runLimited } from './concurrency.mjs';
import { loadTopicInput } from './input.mjs';
import {
	parseLessonMarkdown,
	validateItemForContext,
	validateModulePlan,
	validateSyllabusForModule
} from './schemas.mjs';
import { artifactFiles, slugify, snakeId, writeJson } from './utils.mjs';

export function runIdFor(input, now = new Date()) {
	const date = now.toISOString().slice(0, 10).replaceAll('-', '_');
	return `run_${date}_${snakeId(input.topic.subject.slug)}_${snakeId(input.topic.topic.slug)}_v1`;
}

function itemPathFor(item, index, dir) {
	const slug = slugify(item.slug ?? item.focus ?? `${item.type}-${index + 1}`);
	const extension = item.type === 'lesson' ? 'lesson.md' : 'quiz.json';
	return `${dir}/${String(index + 1).padStart(3, '0')}-${item.type}-${slug}.${extension}`;
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

function formatForPrompt(value) {
	if (value?.type === 'lesson') {
		return [
			'---',
			`title: ${JSON.stringify(value.title)}`,
			`summary: ${JSON.stringify(value.summary)}`,
			`estimated_minutes: ${value.estimated_minutes}`,
			'skill_slugs:',
			...(value.skill_slugs ?? []).map((slug) => `  - ${JSON.stringify(slug)}`),
			'---',
			'',
			value.body_markdown
		].join('\n');
	}
	return JSON.stringify(value, null, 2);
}

function itemFormatFor(item) {
	return item.type === 'lesson' ? 'markdown' : 'json';
}

function itemParserFor(item) {
	return item.type === 'lesson' ? parseLessonMarkdown : undefined;
}

function outputInstructionFor(item, outputPath) {
	if (item.type === 'lesson') {
		return `Write only a Markdown lesson with YAML frontmatter to ${outputPath}.`;
	}
	return `Write only valid simplified quiz JSON to ${outputPath}.`;
}

function artifactEvent({ emit, input, label, stage, kind, path, count, status }) {
	emit({
		type: 'artifact',
		label,
		stage,
		kind,
		path: resolve(input.topicDir, path),
		count,
		status
	});
}

async function runAgentTask({
	runner,
	emit,
	stage,
	taskId,
	label,
	expectedJsonPath,
	artifactKind,
	artifactLabel,
	input,
	...task
}) {
	emit({
		type: 'task_start',
		taskId,
		stage,
		label,
		artifactPath: expectedJsonPath ? resolve(input.topicDir, expectedJsonPath) : undefined
	});
	try {
		const result = await runner.run({
			...task,
			taskId,
			label,
			expectedJsonPath,
			emit
		});
		emit({
			type: 'task_complete',
			taskId,
			stage,
			label,
			artifactPath: expectedJsonPath ? resolve(input.topicDir, expectedJsonPath) : undefined
		});
		if (expectedJsonPath) {
			artifactEvent({
				emit,
				input,
				label: artifactLabel ?? label,
				stage,
				kind: artifactKind ?? 'json',
				path: expectedJsonPath,
				status: 'generated'
			});
		}
		return result;
	} catch (error) {
		emit({
			type: 'task_failed',
			taskId,
			stage,
			label,
			error: error instanceof Error ? error.message : String(error)
		});
		throw error;
	}
}

async function readCachedTask({
	emit,
	stage,
	taskId,
	label,
	expectedJsonPath,
	validate,
	parse,
	format,
	input,
	artifactKind,
	artifactLabel
}) {
	const absoluteJsonPath = resolve(input.topicDir, expectedJsonPath);
	try {
		const value = await readValidatedArtifact({
			absoluteJsonPath,
			expectedJsonPath,
			label,
			session: {
				async prompt() {
					throw new Error(`${expectedJsonPath} needs repair and cannot be resumed automatically.`);
				}
			},
			validate,
			parse,
			format,
			maxRepairAttempts: 0
		});
		emit({
			type: 'task_complete',
			taskId,
			stage,
			label,
			artifactPath: absoluteJsonPath,
			resumed: true
		});
		artifactEvent({
			emit,
			input,
			label: artifactLabel ?? label,
			stage,
			kind: artifactKind ?? 'json',
			path: expectedJsonPath,
			status: 'resumed'
		});
		return { hit: true, value };
	} catch (error) {
		emit({
			type: 'resume_miss',
			taskId,
			stage,
			label,
			artifactPath: absoluteJsonPath,
			reason: error instanceof Error ? error.message : String(error)
		});
		return { hit: false };
	}
}

async function runResumableTask({ resume, ...options }) {
	if (resume && options.expectedJsonPath) {
		const cached = await readCachedTask(options);
		if (cached.hit) {
			return cached.value;
		}
	}
	return runAgentTask(options);
}

function queueTasks(emit, stage, tasks) {
	for (const task of tasks) {
		emit({
			type: 'task_queued',
			stage,
			taskId: task.taskId,
			label: task.label,
			artifactPath: task.artifactPath
		});
	}
}

export async function generateContent(options, dependencies = {}) {
	const emit = dependencies.emit ?? (() => {});
	const now = dependencies.now ?? (() => new Date());
	const loadInput = dependencies.loadTopicInput ?? loadTopicInput;
	const Runner = dependencies.AgentRunner ?? AgentRunner;
	const bundle = dependencies.bundleRun ?? bundleRun;
	const resume = options.resume !== false;
	const input = await loadInput(options.topicDir);

	emit({
		type: 'pipeline_start',
		topicDir: input.topicDir,
		model: options.model,
		concurrency: options.concurrency,
		startedAt: now().toISOString()
	});
	for (const warning of input.warnings) {
		emit({ type: 'warning', message: warning });
	}

	const pipelineDir = resolve(input.topicDir, '.content-pipeline');
	const itemsDir = resolve(pipelineDir, 'items');
	const reviewedDir = resolve(pipelineDir, 'reviewed');
	const modulesDir = resolve(pipelineDir, 'modules');
	const distDir = resolve(input.topicDir, 'dist');
	await mkdir(itemsDir, { recursive: true });
	await mkdir(reviewedDir, { recursive: true });
	await mkdir(modulesDir, { recursive: true });

	const runner = new Runner({
		cwd: input.topicDir,
		modelName: options.model
	});

	const sourceContext = buildSourceContext(input);
	const topicContext = contextFor(input);
	const modulesPath = '.content-pipeline/TOPIC_MODULES.json';
	emit({ type: 'stage_start', stage: 'modules', total: 1 });
	const modulePlan = await runResumableTask({
		resume,
		runner,
		emit,
		input,
		stage: 'modules',
		taskId: 'modules',
		label: 'modules',
		systemPromptName: 'MODULES.md',
		expectedJsonPath: modulesPath,
		artifactKind: 'module-plan',
		artifactLabel: 'Topic modules',
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
	emit({ type: 'stage_end', stage: 'modules', completed: 1, total: 1 });

	const moduleSyllabusPaths = modulePlan.modules.map(
		(module, index) => `.content-pipeline/modules/${modulePathSegment(module, index)}/SYLLABUS.json`
	);
	await Promise.all(
		modulePlan.modules.map((module, index) =>
			mkdir(resolve(modulesDir, modulePathSegment(module, index)), { recursive: true })
		)
	);
	emit({ type: 'stage_start', stage: 'syllabi', total: modulePlan.modules.length });
	queueTasks(
		emit,
		'syllabi',
		modulePlan.modules.map((module, index) => ({
			taskId: `syllabus-${index + 1}`,
			label: `syllabus ${index + 1}`,
			artifactPath: resolve(input.topicDir, moduleSyllabusPaths[index])
		}))
	);
	const moduleSyllabi = await runLimited(
		modulePlan.modules,
		options.concurrency,
		async (module, index) => {
			const syllabusPath = moduleSyllabusPaths[index];
			return runResumableTask({
				resume,
				runner,
				emit,
				input,
				stage: 'syllabi',
				taskId: `syllabus-${index + 1}`,
				label: `syllabus ${index + 1}`,
				systemPromptName: 'SYLLABUS.md',
				expectedJsonPath: syllabusPath,
				artifactKind: 'syllabus',
				artifactLabel: module.title ?? `Syllabus ${index + 1}`,
				thinkingLevel: thinkingLevelForStage(options, 'syllabus'),
				validate: validateSyllabusForModule(module),
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
	emit({
		type: 'stage_end',
		stage: 'syllabi',
		completed: moduleSyllabi.length,
		total: modulePlan.modules.length
	});
	const syllabus = combineModuleSyllabi(modulePlan, moduleSyllabi);

	emit({ type: 'stage_start', stage: 'generate', total: syllabus.syllabus.length });
	queueTasks(
		emit,
		'generate',
		syllabus.syllabus.map((item, index) => ({
			taskId: `generate-${index + 1}`,
			label: `${item.type} ${index + 1}`,
			artifactPath: resolve(input.topicDir, itemPathFor(item, index, '.content-pipeline/items'))
		}))
	);
	const draftItems = await runLimited(
		syllabus.syllabus,
		options.concurrency,
		async (item, index) => {
			const outputPath = itemPathFor(item, index, '.content-pipeline/items');
			const systemPromptName = item.type === 'lesson' ? 'LESSON.md' : 'QUIZ.md';
			const module = moduleForItem(modulePlan, item);
			const moduleSyllabus = moduleSyllabi[modulePlan.modules.indexOf(module)];
			const validateItem = validateItemForContext({
				itemType: item.type,
				syllabusItem: item,
				module,
				moduleSyllabus
			});
			return runResumableTask({
				resume,
				runner,
				emit,
				input,
				stage: 'generate',
				taskId: `generate-${index + 1}`,
				label: `${item.type} ${index + 1}`,
				systemPromptName,
				expectedJsonPath: outputPath,
				artifactKind: item.type,
				artifactLabel: item.focus ?? `${item.type} ${index + 1}`,
				thinkingLevel: thinkingLevelForStage(options, item.type),
				format: itemFormatFor(item),
				parse: itemParserFor(item),
				validate: validateItem,
				prompt: [
					`Generate syllabus item ${index + 1}.`,
					outputInstructionFor(item, outputPath),
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
	emit({
		type: 'stage_end',
		stage: 'generate',
		completed: draftItems.length,
		total: syllabus.syllabus.length
	});

	emit({ type: 'stage_start', stage: 'review', total: draftItems.length });
	queueTasks(
		emit,
		'review',
		draftItems.map((draft, index) => ({
			taskId: `review-${index + 1}`,
			label: `review ${index + 1}`,
			artifactPath: resolve(
				input.topicDir,
				itemPathFor(syllabus.syllabus[index], index, '.content-pipeline/reviewed')
			)
		}))
	);
	const reviewedItems = await runLimited(draftItems, options.concurrency, async (draft, index) => {
		const outputPath = itemPathFor(syllabus.syllabus[index], index, '.content-pipeline/reviewed');
		const module = moduleForItem(modulePlan, syllabus.syllabus[index]);
		const moduleSyllabus = moduleSyllabi[modulePlan.modules.indexOf(module)];
		const validateItem = validateItemForContext({
			itemType: syllabus.syllabus[index].type,
			syllabusItem: syllabus.syllabus[index],
			module,
			moduleSyllabus
		});
		return runResumableTask({
			resume,
			runner,
			emit,
			input,
			stage: 'review',
			taskId: `review-${index + 1}`,
			label: `review ${index + 1}`,
			systemPromptName: 'REVIEW.md',
			expectedJsonPath: outputPath,
			artifactKind: 'reviewed-item',
			artifactLabel: syllabus.syllabus[index].focus ?? `review ${index + 1}`,
			thinkingLevel: thinkingLevelForStage(options, 'review'),
			format: itemFormatFor(syllabus.syllabus[index]),
			parse: itemParserFor(syllabus.syllabus[index]),
			validate: validateItem,
			prompt: [
				`Review and correct syllabus item ${index + 1}.`,
				outputInstructionFor(syllabus.syllabus[index], outputPath),
				`Preserve the ${syllabus.syllabus[index].type} authoring format.`,
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
				formatForPrompt(draft),
				'',
				sourceContext
			].join('\n')
		});
	});
	emit({ type: 'stage_end', stage: 'review', completed: reviewedItems.length, total: draftItems.length });

	const runId = runIdFor(input, now());
	const runJsonPath = resolve(pipelineDir, 'run.json');
	await writeJson(runJsonPath, {
		run_id: runId,
		model: options.model,
		concurrency: options.concurrency,
		thinking_levels: options.thinkingLevels,
		topic_dir: input.topicDir,
		started_at: now().toISOString(),
		modules_path: modulesPath,
		module_syllabus_paths: moduleSyllabusPaths
	});
	emit({
		type: 'artifact',
		label: 'Run metadata',
		stage: 'review',
		kind: 'run-metadata',
		path: runJsonPath,
		status: 'generated'
	});

	emit({ type: 'stage_start', stage: 'bundle', total: Object.keys(artifactFiles).length + 1 });
	const run = await bundle({
		input,
		modules: modulePlan,
		syllabus,
		reviewedItems,
		outDir: distDir,
		runId
	});
	const manifestPath = resolve(distDir, 'manifest.json');
	emit({
		type: 'artifact',
		label: 'Manifest',
		stage: 'bundle',
		kind: 'manifest',
		path: manifestPath,
		status: run.report.valid ? 'valid' : 'invalid'
	});
	for (const [name, file] of Object.entries(artifactFiles)) {
		emit({
			type: 'artifact',
			label: name,
			stage: 'bundle',
			kind: 'jsonl',
			path: resolve(distDir, file),
			count: run.report.counts[name] ?? 0,
			status: run.report.valid ? 'valid' : 'invalid'
		});
	}
	emit({
		type: 'validation',
		valid: run.report.valid,
		manifestPath,
		counts: run.report.counts,
		failures: run.report.failures
	});
	emit({
		type: 'stage_end',
		stage: 'bundle',
		completed: Object.keys(artifactFiles).length + 1,
		total: Object.keys(artifactFiles).length + 1
	});
	emit({
		type: 'pipeline_end',
		ok: run.report.valid,
		endedAt: now().toISOString()
	});

	return { run, manifestPath, input };
}

export { combineModuleSyllabi, itemPathFor, modulePathSegment };
