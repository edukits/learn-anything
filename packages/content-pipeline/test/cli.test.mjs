import assert from 'node:assert/strict';
import test from 'node:test';
import { parseArgs, shouldUseTui } from '../src/cli.mjs';
import { defaultGenerationConfig } from '../src/config.mjs';

test('parseArgs defaults TUI mode to auto', () => {
	const options = parseArgs(['generate', 'topics/math']);
	assert.equal(options.command, 'generate');
	assert.equal(options.topicDir, 'topics/math');
	assert.equal(options.concurrency, defaultGenerationConfig.concurrency);
	assert.equal(options.model, defaultGenerationConfig.model);
	assert.equal(options.tui, 'auto');
});

test('parseArgs supports explicit TUI flags', () => {
	assert.equal(parseArgs(['generate', 'topics/math', '--tui']).tui, true);
	assert.equal(parseArgs(['generate', 'topics/math', '--no-tui']).tui, false);
});

test('parseArgs rejects conflicting TUI flags', () => {
	assert.throws(
		() => parseArgs(['generate', 'topics/math', '--tui', '--no-tui']),
		/Use only one of --tui or --no-tui/
	);
});

test('parseArgs preserves existing model and concurrency options', () => {
	const options = parseArgs([
		'generate',
		'topics/math',
		'--concurrency',
		'4',
		'--model',
		'openai-codex:test-model'
	]);
	assert.equal(options.concurrency, 4);
	assert.equal(options.model, 'openai-codex:test-model');
});

test('shouldUseTui follows explicit flags before TTY detection', () => {
	assert.equal(shouldUseTui({ tui: true }, { stdout: { isTTY: false }, stderr: { isTTY: false } }), true);
	assert.equal(shouldUseTui({ tui: false }, { stdout: { isTTY: true }, stderr: { isTTY: true } }), false);
	assert.equal(shouldUseTui({ tui: 'auto' }, { stdout: { isTTY: true }, stderr: { isTTY: true } }), true);
	assert.equal(
		shouldUseTui({ tui: 'auto' }, { stdout: { isTTY: true }, stderr: { isTTY: false } }),
		false
	);
});
