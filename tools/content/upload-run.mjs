#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { loadAndValidateRun } from './content-run.mjs';
import {
	createTargetClient,
	defaultArtifactBucket,
	isStorageArtifactRef,
	normalizeStoragePrefix,
	readLocalArtifact,
	storageArtifactRef,
	storagePathForArtifact,
	uploadImmutableObject,
	writeJson
} from './content-storage.mjs';
import { loadReleaseEnvironment } from './release-env.mjs';

const usage =
	'Usage: node tools/content/upload-run.mjs <manifest.json> --target <local|staging|production> [--bucket curriculum-artifacts] [--prefix runs/<run_id>] [--output manifest.storage.json]';

function parseArgs(args) {
	let manifestPath = null;
	let target = null;
	let bucket = defaultArtifactBucket;
	let prefix = null;
	let outputPath = null;

	for (let index = 0; index < args.length; index += 1) {
		const arg = args[index];
		if (arg === '--target') {
			target = args[index + 1] ?? null;
			index += 1;
			continue;
		}
		if (arg === '--bucket') {
			bucket = args[index + 1] ?? '';
			index += 1;
			continue;
		}
		if (arg === '--prefix') {
			prefix = args[index + 1] ?? '';
			index += 1;
			continue;
		}
		if (arg === '--output') {
			outputPath = args[index + 1] ?? '';
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

	if (!manifestPath || !target || !bucket) {
		throw new Error(usage);
	}

	return { manifestPath, target, bucket, prefix, outputPath };
}

let args;
try {
	args = parseArgs(process.argv.slice(2));
} catch (error) {
	console.error(error instanceof Error ? error.message : String(error));
	process.exit(1);
}

loadReleaseEnvironment(args.target);

const run = await loadAndValidateRun(args.manifestPath);
if (!run.report.valid || !run.report.importable) {
	console.error('Refusing to upload invalid or non-importable content artifacts.');
	for (const failure of run.report.failures) {
		console.error(`- ${failure}`);
	}
	for (const blocker of run.report.import_blockers) {
		console.error(`- ${blocker}`);
	}
	process.exit(1);
}

const manifestPath = resolve(args.manifestPath);
const manifestDir = dirname(manifestPath);
const rawManifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const prefix = normalizeStoragePrefix(args.prefix, run.manifest.run_id);
const client = createTargetClient(args.target);
const storageManifest = {
	...rawManifest,
	artifacts: {}
};

let uploaded = 0;
let reused = 0;

for (const [name, artifactRef] of Object.entries(rawManifest.artifacts ?? {})) {
	if (isStorageArtifactRef(artifactRef)) {
		storageManifest.artifacts[name] = artifactRef;
		reused += 1;
		continue;
	}

	if (typeof artifactRef !== 'string') {
		throw new Error(`Unsupported artifact reference for ${name}.`);
	}

	const buffer = await readLocalArtifact(manifestDir, artifactRef);
	const storagePath = storagePathForArtifact({ artifactRef, prefix });
	const ref = storageArtifactRef({
		bucket: args.bucket,
		path: storagePath,
		buffer
	});
	const result = await uploadImmutableObject(client, ref, buffer);
	storageManifest.artifacts[name] = ref;
	if (result.uploaded) {
		uploaded += 1;
	} else {
		reused += 1;
	}
}

const outputPath =
	args.outputPath ?? resolve(manifestDir, 'manifest.storage.json');
await writeJson(outputPath, storageManifest);

console.log(
	`Uploaded ${uploaded} artifact(s), reused ${reused} existing artifact(s), wrote ${outputPath}`
);
