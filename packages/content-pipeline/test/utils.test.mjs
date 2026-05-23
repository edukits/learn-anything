import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { JsonReadError, readJson } from '../src/utils.mjs';

async function tempDir() {
	return mkdtemp(join(tmpdir(), 'content-pipeline-utils-'));
}

test('readJson identifies invalid JSON as a parse error', async () => {
	const dir = await tempDir();
	const path = join(dir, 'invalid.json');
	await writeFile(path, '{ "title": "Broken" "missingComma": true }\n');

	await assert.rejects(() => readJson(path), (error) => {
		assert.ok(error instanceof JsonReadError);
		assert.equal(error.kind, 'parse');
		assert.equal(error.path, path);
		return true;
	});
});

test('readJson identifies missing files as read errors', async () => {
	const path = join(await tempDir(), 'missing.json');

	await assert.rejects(() => readJson(path), (error) => {
		assert.ok(error instanceof JsonReadError);
		assert.equal(error.kind, 'read');
		assert.equal(error.path, path);
		return true;
	});
});
