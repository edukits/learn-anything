#!/usr/bin/env node
import { loadAndValidateRun, writeValidationReport } from './content-run.mjs';
import { buildDiffReport } from './content-diff.mjs';

const usage =
	'Usage: node tools/content/validate-run.mjs <manifest.json> [--base <base-manifest.json|none>]';

function parseArgs(args) {
	let manifestPath = null;
	let baseManifestPath = null;

	for (let index = 0; index < args.length; index += 1) {
		const arg = args[index];
		if (arg === '--base') {
			baseManifestPath = args[index + 1] ?? null;
			index += 1;
			continue;
		}
		if (arg.startsWith('--')) {
			throw new Error(`Unknown option ${arg}`);
		}
		if (manifestPath) {
			throw new Error(`Unexpected extra positional argument ${arg}`);
		}
		manifestPath = arg;
	}

	if (!manifestPath) {
		throw new Error(usage);
	}

	return { manifestPath, baseManifestPath };
}

let args;
try {
	args = parseArgs(process.argv.slice(2));
} catch (error) {
	console.error(error instanceof Error ? error.message : String(error));
	process.exit(1);
}

const run = await loadAndValidateRun(args.manifestPath);

if (args.baseManifestPath) {
	const { report: diffReport } = await buildDiffReport(args.manifestPath, args.baseManifestPath);
	run.report.diff_summary = diffReport.summary;
	run.report.diff_base_run_id = diffReport.base_run_id;
}

const reportPath = await writeValidationReport(run);

if (!run.report.valid) {
	console.error(`Content validation failed. Report written to ${reportPath}`);
	for (const failure of run.report.failures) {
		console.error(`- ${failure}`);
	}
	process.exit(1);
}

console.log(`Content validation passed. Report written to ${reportPath}`);
