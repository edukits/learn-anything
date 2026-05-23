#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import {
	createTargetClient,
	downloadStorageObject,
	isStorageArtifactRef,
	writeJson
} from './content-storage.mjs';
import { loadReleaseEnvironment } from './release-env.mjs';

const usage =
	'Usage: node tools/content/download-run.mjs <manifest.json> --target <local|staging|production> --output-dir <dir>';

function parseArgs(args) {
	let manifestPath = null;
	let target = null;
	let outputDir = null;

	for (let index = 0; index < args.length; index += 1) {
		const arg = args[index];
		if (arg === '--target') {
			target = args[index + 1] ?? null;
			index += 1;
			continue;
		}
		if (arg === '--output-dir') {
			outputDir = args[index + 1] ?? null;
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

	if (!manifestPath || !target || !outputDir) {
		throw new Error(usage);
	}

	return { manifestPath, target, outputDir };
}

let args;
try {
	args = parseArgs(process.argv.slice(2));
} catch (error) {
	console.error(error instanceof Error ? error.message : String(error));
	process.exit(1);
}

loadReleaseEnvironment(args.target);

const manifest = JSON.parse(await readFile(resolve(args.manifestPath), 'utf8'));
const outputDir = resolve(args.outputDir);
const client = createTargetClient(args.target);
const localManifest = {
	...manifest,
	artifacts: {}
};

let downloaded = 0;
let local = 0;

await mkdir(outputDir, { recursive: true });

for (const [name, artifactRef] of Object.entries(manifest.artifacts ?? {})) {
	if (!isStorageArtifactRef(artifactRef)) {
		localManifest.artifacts[name] = artifactRef;
		local += 1;
		continue;
	}

	const buffer = await downloadStorageObject(client, artifactRef);
	const fileName = basename(artifactRef.path);
	await writeFile(resolve(outputDir, fileName), buffer);
	localManifest.artifacts[name] = fileName;
	downloaded += 1;
}

await writeJson(resolve(outputDir, 'manifest.json'), localManifest);
console.log(`Downloaded ${downloaded} artifact(s), kept ${local} local ref(s), wrote ${outputDir}`);
