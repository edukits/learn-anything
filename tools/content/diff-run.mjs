#!/usr/bin/env node
import { buildDiffReport, defaultDiffOutputPath, writeDiffReports } from './content-diff.mjs';
import { createTargetClient } from './content-storage.mjs';
import { loadReleaseEnvironment } from './release-env.mjs';

const usage =
	'Usage: node tools/content/diff-run.mjs <candidate-manifest.json> --base <base-manifest.json|none> [--output diff-report.json] [--target <local|staging|production>]';

function parseArgs(args) {
	let candidateManifestPath = null;
	let baseManifestPath = null;
	let outputPath = null;
	let target = null;

	for (let index = 0; index < args.length; index += 1) {
		const arg = args[index];

		if (arg === '--base') {
			baseManifestPath = args[index + 1] ?? null;
			index += 1;
			continue;
		}

		if (arg === '--output') {
			outputPath = args[index + 1] ?? null;
			index += 1;
			continue;
		}

		if (arg === '--target') {
			target = args[index + 1] ?? null;
			index += 1;
			continue;
		}

		if (arg.startsWith('--')) {
			throw new Error(`Unknown option ${arg}`);
		}

		if (candidateManifestPath) {
			throw new Error(`Unexpected extra positional argument ${arg}`);
		}
		candidateManifestPath = arg;
	}

	if (!candidateManifestPath || !baseManifestPath) {
		throw new Error(usage);
	}

	return { candidateManifestPath, baseManifestPath, outputPath, target };
}

async function main() {
	let args;
	try {
		args = parseArgs(process.argv.slice(2));
	} catch (error) {
		console.error(error instanceof Error ? error.message : String(error));
		process.exit(1);
	}

	let storageClient = null;
	if (args.target) {
		loadReleaseEnvironment(args.target);
		storageClient = createTargetClient(args.target);
	}

	const { report } = await buildDiffReport(args.candidateManifestPath, args.baseManifestPath, {
		storageClient
	});
	const outputPath = args.outputPath ?? defaultDiffOutputPath(args.candidateManifestPath);
	const { jsonPath, markdownPath } = await writeDiffReports(report, outputPath);

	if (!report.valid) {
		console.error(`Diff report written to ${jsonPath}, but one or more manifests are invalid.`);
		process.exit(1);
	}

	console.log(`Diff report written to ${jsonPath}`);
	console.log(`Markdown diff written to ${markdownPath}`);
}

await main();
