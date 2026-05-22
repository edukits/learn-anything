import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadTopicInput } from '../src/input.mjs';

async function tempTopic() {
	return mkdtemp(join(tmpdir(), 'content-pipeline-topic-'));
}

async function writeTopicJson(dir, overrides = {}) {
	const topic = {
		subject: {
			id: 'subject_math',
			slug: 'math',
			name: 'Math',
			summary: 'Math topics'
		},
		topic: {
			id: 'topic_linear_equations',
			slug: 'linear-equations',
			name: 'Linear Equations',
			summary: 'Solve linear equations'
		},
		...overrides
	};
	await writeFile(join(dir, 'topic.json'), `${JSON.stringify(topic, null, 2)}\n`);
}

test('loads topic.json, README.md, and sources/sources.json', async () => {
	const dir = await tempTopic();
	await writeTopicJson(dir);
	await writeFile(join(dir, 'README.md'), '# Brief\n');
	await mkdir(join(dir, 'sources'));
	await writeFile(join(dir, 'sources', 'notes.md'), '# Notes\n');
	await writeFile(
		join(dir, 'sources', 'sources.json'),
		JSON.stringify({ sources: [{ source_id: 'source_notes', path: 'notes.md', title: 'Notes' }] })
	);

	const input = await loadTopicInput(dir, { repoRoot: dir });
	assert.equal(input.topic.subject.id, 'subject_math');
	assert.equal(input.topic.topic.id, 'topic_linear_equations');
	assert.equal(input.sourceRefs.length, 1);
	assert.equal(input.sourceRefs[0].source_id, 'source_notes');
	assert.equal(input.sourceRefs[0].path, 'sources/notes.md');
	assert.equal(input.legacy, false);
});

test('loads valid topic with no source directory', async () => {
	const dir = await tempTopic();
	await writeTopicJson(dir);
	await writeFile(join(dir, 'README.md'), '# Brief\n');

	const input = await loadTopicInput(dir, { repoRoot: dir });
	assert.equal(input.sourceRefs.length, 0);
	assert.deepEqual(input.sourceFiles, []);
});

test('loads legacy metadata.json and source.md with warning', async () => {
	const dir = await tempTopic();
	await writeFile(
		join(dir, 'metadata.json'),
		JSON.stringify({
			source_id: 'source_legacy',
			subject: 'english',
			topic: 'literary-devices',
			title: 'Literary Devices'
		})
	);
	await writeFile(join(dir, 'source.md'), '# Legacy source\n');

	const input = await loadTopicInput(dir, { repoRoot: dir });
	assert.equal(input.legacy, true);
	assert.equal(input.sourceRefs[0].source_id, 'source_legacy');
	assert.equal(input.warnings.length, 1);
});

test('requires topic.json for non-legacy topics', async () => {
	const dir = await tempTopic();
	await writeFile(join(dir, 'README.md'), '# Brief\n');

	await assert.rejects(() => loadTopicInput(dir, { repoRoot: dir }), /topic\.json is required/);
});

test('rejects malformed persistent ids', async () => {
	const dir = await tempTopic();
	await writeTopicJson(dir, {
		subject: {
			id: 'Subject Math',
			slug: 'math',
			name: 'Math',
			summary: 'Math topics'
		}
	});
	await writeFile(join(dir, 'README.md'), '# Brief\n');

	await assert.rejects(() => loadTopicInput(dir, { repoRoot: dir }), /lowercase snake_case/);
});
