import { readFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getModel } from '@earendil-works/pi-ai';
import {
	AuthStorage,
	createAgentSession,
	DefaultResourceLoader,
	getAgentDir,
	ModelRegistry,
	SessionManager,
	SettingsManager
} from '@earendil-works/pi-coding-agent';
import { JsonReadError } from './utils.mjs';

const skillDir = join(dirname(fileURLToPath(import.meta.url)), 'skills');
const questionContextPromptName = 'QUESTION_CONTEXT.md';
const questionSystemPromptNames = new Set(['QUIZ.md', 'INTERACTIONS.md', 'REVIEW.md']);

export async function buildSystemPrompt(systemPromptName) {
	const systemPromptParts = [await readFile(join(skillDir, systemPromptName), 'utf8')];
	if (questionSystemPromptNames.has(systemPromptName)) {
		systemPromptParts.push(await readFile(join(skillDir, questionContextPromptName), 'utf8'));
	}
	return systemPromptParts.join('\n\n');
}

export function parseModel(value) {
	const [provider, ...modelParts] = value.split(':');
	const id = modelParts.join(':');
	if (!provider || !id) {
		throw new Error(`Model must use provider:id syntax, received ${value}.`);
	}
	const model = getModel(provider, id);
	if (!model) {
		throw new Error(`Model not found: ${value}.`);
	}
	return model;
}

function handleEvent(label, taskId, emit, event) {
	if (event.type === 'tool_execution_start') {
		emit({
			type: 'task_tool_start',
			taskId,
			label,
			toolName: event.toolName
		});
		return;
	}
	if (event.type === 'tool_execution_end' && event.isError) {
		emit({
			type: 'task_tool_failed',
			taskId,
			label,
			toolName: event.toolName
		});
		return;
	}
	if (event.type === 'agent_end') {
		emit({
			type: 'task_agent_finished',
			taskId,
			label
		});
	}
}

function jsonRepairPrompt(path, error, content) {
	return [
		`The JSON file at ${path} is invalid and could not be parsed.`,
		'Rewrite that same file as valid JSON only.',
		'Preserve the intended content and schema. Do not add Markdown fences or prose.',
		'',
		'Parser error:',
		error.message,
		'',
		'Current file content:',
		'```json',
		content,
		'```'
	].join('\n');
}

function artifactParseRepairPrompt(path, error, content, format) {
	if (format === 'json') {
		return jsonRepairPrompt(path, error, content);
	}
	return [
		`The Markdown lesson file at ${path} is invalid and could not be parsed.`,
		'Rewrite that same file as a Markdown lesson with YAML frontmatter only.',
		'Preserve the intended content and schema. Do not add Markdown fences or prose outside the file content.',
		'',
		'Parser error:',
		error.message,
		'',
		'Current file content:',
		'```markdown',
		content,
		'```'
	].join('\n');
}

function schemaRepairPrompt(path, error, content, format = 'json') {
	const fileDescription =
		format === 'json' ? 'JSON file' : 'Markdown lesson file with YAML frontmatter';
	const rewriteInstruction =
		format === 'json'
			? 'Fix the validation errors and rewrite that same file as JSON only.'
			: 'Fix the validation errors and rewrite that same file as Markdown with YAML frontmatter only.';
	const fence = format === 'json' ? 'json' : 'markdown';
	return [
		`The ${fileDescription} at ${path} does not match the required schema or context.`,
		rewriteInstruction,
		'Preserve the intended content. Do not add Markdown fences or prose outside the file content.',
		'',
		'Validation errors:',
		error,
		'',
		'Current file content:',
		`\`\`\`${fence}`,
		content,
		'```'
	].join('\n');
}

function normalizeValidationResult(result) {
	if (result && typeof result === 'object' && 'success' in result) {
		return result;
	}
	return { success: true, data: result };
}

function parseJsonContent(content, path) {
	try {
		return JSON.parse(content);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		throw new JsonReadError(path, message, 'parse', { cause: error });
	}
}

async function readArtifactContent(path) {
	try {
		return await readFile(path, 'utf8');
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		throw new JsonReadError(path, message, 'read', { cause: error });
	}
}

/* eslint-disable no-await-in-loop */
export async function readValidatedArtifact({
	absoluteJsonPath,
	expectedJsonPath,
	label,
	session,
	validate,
	parse = parseJsonContent,
	format = 'json',
	maxRepairAttempts = 3,
	log = () => {},
	onRepair = ({ label: repairLabel, kind, attempt, maxRepairAttempts: max }) =>
		log(
			`repair ${repairLabel} ${kind} validation failed; asking agent to rewrite (${attempt}/${max})`
		)
}) {
	let repairAttempts = 0;

	while (true) {
		let content;
		let value;
		try {
			content = await readArtifactContent(absoluteJsonPath);
			value = parse(content, absoluteJsonPath);
		} catch (error) {
			if (!(error instanceof JsonReadError) || error.kind !== 'parse') {
				throw error;
			}
			if (repairAttempts >= maxRepairAttempts) {
				throw error;
			}
			repairAttempts += 1;
			onRepair({
				label,
				kind: format,
				attempt: repairAttempts,
				maxRepairAttempts
			});
			const currentContent = await readArtifactContent(absoluteJsonPath);
			await session.prompt(
				artifactParseRepairPrompt(expectedJsonPath, error, currentContent, format)
			);
			continue;
		}

		if (!validate) {
			return value;
		}

		const validation = normalizeValidationResult(await validate(value));
		if (validation.success) {
			return validation.data;
		}

		if (repairAttempts >= maxRepairAttempts) {
			throw new Error(
				`${expectedJsonPath} did not match the required schema after ${maxRepairAttempts} repair attempts.\n${validation.error}`
			);
		}

		repairAttempts += 1;
		onRepair({
			label,
			kind: 'schema',
			attempt: repairAttempts,
			maxRepairAttempts,
			error: validation.error
		});
		await session.prompt(schemaRepairPrompt(expectedJsonPath, validation.error, content, format));
	}
}
/* eslint-enable no-await-in-loop */

export function readValidatedJson(options) {
	return readValidatedArtifact({ ...options, format: 'json', parse: parseJsonContent });
}

export class AgentRunner {
	constructor({ cwd, modelName, thinkingLevel = 'minimal' }) {
		this.cwd = cwd;
		this.model = parseModel(modelName);
		this.defaultThinkingLevel = thinkingLevel;
		this.authStorage = AuthStorage.create();
		this.modelRegistry = ModelRegistry.create(this.authStorage);
		this.settingsManager = SettingsManager.inMemory({ compaction: { enabled: true } });
	}

	async run({
		taskId = label,
		label,
		systemPromptName,
		prompt,
		expectedJsonPath,
		thinkingLevel = this.defaultThinkingLevel,
		validate,
		parse,
		format = 'json',
		maxRepairAttempts = 3,
		emit = () => {}
	}) {
		const systemPrompt = await buildSystemPrompt(systemPromptName);
		const loader = new DefaultResourceLoader({
			cwd: this.cwd,
			agentDir: getAgentDir(),
			noExtensions: true,
			agentsFilesOverride: () => ({ agentsFiles: [] }),
			skillsOverride: (current) => ({ ...current, skills: [] }),
			promptsOverride: (current) => ({ ...current, prompts: [] }),
			systemPromptOverride: () => systemPrompt,
			settingsManager: this.settingsManager
		});
		await loader.reload();

		const { session } = await createAgentSession({
			cwd: this.cwd,
			resourceLoader: loader,
			model: this.model,
			thinkingLevel,
			sessionManager: SessionManager.inMemory(),
			settingsManager: this.settingsManager,
			authStorage: this.authStorage,
			modelRegistry: this.modelRegistry
		});
		session.subscribe((event) => handleEvent(label, taskId, emit, event));
		try {
			await session.prompt(prompt);
			if (!expectedJsonPath) {
				return undefined;
			}
			const absoluteJsonPath = resolve(this.cwd, expectedJsonPath);
			return await readValidatedArtifact({
				absoluteJsonPath,
				expectedJsonPath,
				label,
				session,
				validate,
				parse,
				format,
				maxRepairAttempts,
				onRepair: (repair) =>
					emit({
						type: 'task_repair',
						taskId,
						expectedJsonPath,
						...repair
					})
			});
		} finally {
			session.dispose();
		}
	}
}

export function buildSourceContext(input) {
	const sourceLines = input.sourceFiles.length
		? input.sourceFiles.map((file) => `- ${file.relativePath} (${file.source_ref.source_id})`)
		: ['- No source files were found. Use README.md as the only brief.'];
	return [
		`Topic directory: ${input.topicDir}`,
		`README: ${relative(input.topicDir, input.readmePath)}`,
		'Source files:',
		...sourceLines
	].join('\n');
}
