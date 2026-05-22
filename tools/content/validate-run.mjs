#!/usr/bin/env node
import { loadAndValidateRun, writeValidationReport } from './content-run.mjs';

const manifestPath = process.argv[2];

if (!manifestPath) {
	console.error('Usage: node tools/content/validate-run.mjs <manifest.json>');
	process.exit(1);
}

const run = await loadAndValidateRun(manifestPath);
const reportPath = await writeValidationReport(run);

if (!run.report.valid) {
	console.error(`Content validation failed. Report written to ${reportPath}`);
	for (const failure of run.report.failures) {
		console.error(`- ${failure}`);
	}
	process.exit(1);
}

console.log(`Content validation passed. Report written to ${reportPath}`);
