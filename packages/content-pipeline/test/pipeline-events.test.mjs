import assert from 'node:assert/strict';
import test from 'node:test';
import {
	createPipelineState,
	moveArtifactSelection,
	reducePipelineEvent
} from '../src/pipeline-events.mjs';

test('pipeline reducer tracks stage and task progress', () => {
	let state = createPipelineState(new Date('2026-05-26T12:00:00.000Z'));
	state = reducePipelineEvent(state, {
		type: 'pipeline_start',
		topicDir: '/tmp/topic',
		model: 'openai-codex:test',
		concurrency: 2
	});
	state = reducePipelineEvent(state, { type: 'stage_start', stage: 'generate', total: 2 });
	state = reducePipelineEvent(state, {
		type: 'task_queued',
		stage: 'generate',
		taskId: 'generate-1',
		label: 'lesson 1'
	});
	state = reducePipelineEvent(state, {
		type: 'task_start',
		stage: 'generate',
		taskId: 'generate-1',
		label: 'lesson 1'
	});
	state = reducePipelineEvent(state, {
		type: 'task_complete',
		stage: 'generate',
		taskId: 'generate-1',
		label: 'lesson 1'
	});

	assert.equal(state.status, 'running');
	assert.equal(state.currentStage, 'generate');
	assert.equal(state.tasks[0].status, 'completed');
	assert.equal(state.stages.find((stage) => stage.id === 'generate').completed, 1);
});

test('pipeline reducer tracks artifacts and selection', () => {
	let state = createPipelineState();
	state = reducePipelineEvent(state, {
		type: 'artifact',
		label: 'Manifest',
		stage: 'bundle',
		kind: 'manifest',
		path: '/tmp/topic/dist/manifest.json',
		status: 'valid'
	});
	state = reducePipelineEvent(state, {
		type: 'artifact',
		label: 'questions',
		stage: 'bundle',
		kind: 'jsonl',
		path: '/tmp/topic/dist/questions.jsonl',
		count: 3
	});
	state = moveArtifactSelection(state, 1);

	assert.equal(state.artifacts.length, 2);
	assert.equal(state.artifacts[1].count, 3);
	assert.equal(state.selectedArtifactIndex, 1);
});

test('pipeline reducer records validation failure', () => {
	let state = createPipelineState();
	state = reducePipelineEvent(state, {
		type: 'validation',
		valid: false,
		manifestPath: '/tmp/topic/dist/manifest.json',
		counts: { questions: 1 },
		failures: ['question is invalid']
	});
	state = reducePipelineEvent(state, {
		type: 'pipeline_end',
		ok: false,
		error: 'validation failed'
	});

	assert.equal(state.validation.valid, false);
	assert.deepEqual(state.validation.failures, ['question is invalid']);
	assert.equal(state.status, 'failed');
});
