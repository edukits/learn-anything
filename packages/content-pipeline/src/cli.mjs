#!/usr/bin/env node
import { defaultGenerationConfig } from './config.mjs';
import { generateContent, runIdFor } from './generator.mjs';
import { createPlainLogger } from './plain-logger.mjs';

function usage() {
	const { concurrency, model } = defaultGenerationConfig;
	return [
		'Usage:',
		`  content-pipeline generate <topic-dir> [--concurrency ${concurrency}] [--model ${model}] [--tui|--no-tui]`,
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
		thinkingLevels: defaultGenerationConfig.thinkingLevels,
		tui: 'auto'
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
		if (arg === '--tui') {
			if (options.tui === false) {
				throw new Error('Use only one of --tui or --no-tui.');
			}
			options.tui = true;
			continue;
		}
		if (arg === '--no-tui') {
			if (options.tui === true) {
				throw new Error('Use only one of --tui or --no-tui.');
			}
			options.tui = false;
			continue;
		}
		throw new Error(`Unknown option ${arg}\n\n${usage()}`);
	}
	if (!Number.isInteger(options.concurrency) || options.concurrency < 1) {
		throw new Error('--concurrency must be a positive integer.');
	}
	if (!options.model) {
		throw new Error('--model must be a provider:id model name.');
	}
	return options;
}

function shouldUseTui(options, streams = { stdout: process.stdout, stderr: process.stderr }) {
	if (options.tui === true) {
		return true;
	}
	if (options.tui === false) {
		return false;
	}
	return Boolean(streams.stdout.isTTY && streams.stderr.isTTY);
}

async function runGenerate(options) {
	const plainLogger = createPlainLogger();
	let tuiSession = null;
	let emit = plainLogger;

	if (shouldUseTui(options)) {
		try {
			const { createTuiSession } = await import('./tui.mjs');
			tuiSession = await createTuiSession({ plainLogger });
			emit = tuiSession.emit;
		} catch (error) {
			if (options.tui === true) {
				throw error;
			}
			process.stderr.write(
				`OpenTUI unavailable; falling back to plain logs. ${error instanceof Error ? error.message : String(error)}\n`
			);
		}
	}

	try {
		const result = await generateContent(options, { emit });
		if (!result.run.report.valid) {
			process.exitCode = 1;
		}
		return result;
	} catch (error) {
		emit({
			type: 'pipeline_end',
			ok: false,
			error: error instanceof Error ? error.message : String(error)
		});
		process.exitCode = 1;
		return null;
	} finally {
		tuiSession?.finish();
	}
}

export async function main(args = process.argv.slice(2)) {
	try {
		const options = parseArgs(args);
		await runGenerate(options);
	} catch (error) {
		process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
		process.exitCode = 1;
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	await main();
}

export { parseArgs, runGenerate, runIdFor, shouldUseTui };
