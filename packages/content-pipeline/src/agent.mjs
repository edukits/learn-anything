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
import pc from 'picocolors';
import { JsonReadError, readJson } from './utils.mjs';

const skillDir = join(dirname(fileURLToPath(import.meta.url)), 'skills');

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

function status(line) {
	process.stderr.write(`${line}\n`);
}

function handleEvent(label, event) {
	if (event.type === 'tool_execution_start') {
		status(`${pc.cyan('tool')} ${label} ${pc.yellow(event.toolName)}`);
		return;
	}
	if (event.type === 'tool_execution_end' && event.isError) {
		status(`${pc.red('tool failed')} ${label} ${pc.yellow(event.toolName)}`);
		return;
	}
	if (event.type === 'agent_end') {
		status(`${pc.dim('agent finished')} ${label}`);
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

export class AgentRunner {
	constructor({ cwd, modelName, thinkingLevel = 'minimal' }) {
		this.cwd = cwd;
		this.model = parseModel(modelName);
		this.defaultThinkingLevel = thinkingLevel;
		this.authStorage = AuthStorage.create();
		this.modelRegistry = ModelRegistry.create(this.authStorage);
		this.settingsManager = SettingsManager.inMemory({ compaction: { enabled: true } });
	}

	async run({ label, systemPromptName, prompt, expectedJsonPath, thinkingLevel = this.defaultThinkingLevel }) {
		const systemPrompt = await readFile(join(skillDir, systemPromptName), 'utf8');
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
		session.subscribe((event) => handleEvent(label, event));
		try {
			await session.prompt(prompt);
			if (!expectedJsonPath) {
				return undefined;
			}
			const absoluteJsonPath = resolve(this.cwd, expectedJsonPath);
			try {
				return await readJson(absoluteJsonPath);
			} catch (error) {
				if (!(error instanceof JsonReadError) || error.kind !== 'parse') {
					throw error;
				}
				process.stderr.write(`${pc.yellow('repair')} ${label} invalid JSON; asking agent to rewrite\n`);
				const content = await readFile(absoluteJsonPath, 'utf8');
				await session.prompt(jsonRepairPrompt(expectedJsonPath, error, content));
				return await readJson(absoluteJsonPath);
			}
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
