import { readFileSync, statSync } from 'node:fs';
import { basename, extname } from 'node:path';
import { BoxRenderable, createCliRenderer, TextRenderable } from '@opentui/core';
import { createPipelineState, moveArtifactSelection, reducePipelineEvent } from './pipeline-events.mjs';

const maxPreviewBytes = 60_000;
const spinnerFrames = ['-', '\\', '|', '/'];

function clip(value, width) {
	const text = String(value ?? '');
	if (text.length <= width) {
		return text.padEnd(width, ' ');
	}
	return `${text.slice(0, Math.max(0, width - 3))}...`;
}

function statusMark(status) {
	if (status === 'completed' || status === 'valid') {
		return '[x]';
	}
	if (status === 'resumed') {
		return '[=]';
	}
	if (status === 'running') {
		return '[>]';
	}
	if (status === 'failed' || status === 'invalid') {
		return '[!]';
	}
	if (status === 'queued') {
		return '[.]';
	}
	return '[ ]';
}

function selectedArtifact(state) {
	if (!state.artifacts.length) {
		return null;
	}
	return state.artifacts[Math.min(state.selectedArtifactIndex, state.artifacts.length - 1)];
}

function previewArtifact(artifact) {
	if (!artifact?.path) {
		return 'No generated artifacts yet.';
	}
	try {
		const stat = statSync(artifact.path);
		if (stat.size > maxPreviewBytes) {
			const content = readFileSync(artifact.path, 'utf8').slice(0, maxPreviewBytes);
			return `${content}\n\n[preview truncated: ${stat.size} bytes]`;
		}
		return readFileSync(artifact.path, 'utf8');
	} catch (error) {
		return `Unable to read ${artifact.path}\n${error instanceof Error ? error.message : String(error)}`;
	}
}

function formatElapsed(startedAt, endedAt = null) {
	if (!startedAt) {
		return '0s';
	}
	const start = new Date(startedAt).getTime();
	const end = endedAt ? new Date(endedAt).getTime() : Date.now();
	const seconds = Math.max(0, Math.floor((end - start) / 1000));
	const minutes = Math.floor(seconds / 60);
	const remainder = seconds % 60;
	return minutes ? `${minutes}m ${remainder}s` : `${remainder}s`;
}

function runningMark(startedAt, now) {
	if (!startedAt) {
		return '[>]';
	}
	const frame = Math.floor(now.getTime() / 250) % spinnerFrames.length;
	return `[${spinnerFrames[frame]}]`;
}

function statusMarkForTask(task, now) {
	if (task?.status === 'running') {
		return runningMark(task.startedAt, now);
	}
	return statusMark(task?.status);
}

function renderDashboard(state, width, height, now = new Date()) {
	const leftWidth = Math.max(44, Math.floor(width * 0.48));
	const rightWidth = Math.max(32, width - leftWidth - 3);
	const previewHeight = Math.max(8, height - 13);
	const selected = selectedArtifact(state);
	const lines = [];

	lines.push('Learn Anything content pipeline');
	lines.push(
		`Topic: ${state.topicDir ?? 'loading'} | Model: ${state.model ?? 'n/a'} | Concurrency: ${state.concurrency ?? 'n/a'} | ${state.status} | ${formatElapsed(state.startedAt, state.endedAt ?? now.toISOString())}`
	);
	lines.push(`Keys: up/down select artifact, tab switch pane, l logs, a artifacts, q/esc close TUI | Focus: ${state.focus}`);
	lines.push('');

	const stageLine = state.stages
		.map((stage) => `${statusMark(stage.status)} ${stage.label} ${stage.completed}/${stage.total || '-'}`)
		.join('  ');
	lines.push(stageLine);
	lines.push('');

	const taskRows = state.tasks
		.filter((task) => !state.currentStage || task.stage === state.currentStage || task.status === 'running')
		.slice(-Math.max(4, Math.floor((height - 16) / 2)));
	const artifactRows = state.artifacts.slice(-Math.max(4, Math.floor((height - 16) / 2)));
	const rowCount = Math.max(taskRows.length, artifactRows.length, 6);
	lines.push(`${clip('Agents', leftWidth)} | ${clip('Artifacts', rightWidth)}`);
	lines.push(`${'-'.repeat(leftWidth)} | ${'-'.repeat(rightWidth)}`);
	for (let index = 0; index < rowCount; index += 1) {
		const task = taskRows[index];
		const artifact = artifactRows[index];
		const artifactIndex = artifact ? state.artifacts.indexOf(artifact) : -1;
		const artifactPrefix = artifactIndex === state.selectedArtifactIndex ? '>' : ' ';
		const taskText = task
			? `${statusMarkForTask(task, now)} ${task.label} (${task.stage}) ${formatElapsed(task.startedAt ?? task.queuedAt, task.endedAt ?? now.toISOString())} ${task.message ?? ''}`
			: '';
		const artifactText = artifact
			? `${artifactPrefix} ${statusMark(artifact.status)} ${artifact.label} ${artifact.count === undefined ? '' : `(${artifact.count})`} ${basename(artifact.path)}`
			: '';
		lines.push(`${clip(taskText, leftWidth)} | ${clip(artifactText, rightWidth)}`);
	}

	lines.push('');
	lines.push(
		selected
			? `Preview: ${selected.label} | ${selected.kind} | ${selected.path}`
			: 'Preview: waiting for generated files'
	);
	lines.push('-'.repeat(Math.max(20, width - 1)));
	const preview = previewArtifact(selected)
		.split('\n')
		.map((line) => {
			const extension = selected ? extname(selected.path) : '';
			return extension === '.jsonl' && line.length > width - 1 ? `${line.slice(0, width - 4)}...` : line;
		})
		.slice(0, previewHeight);
	lines.push(...preview.map((line) => clip(line, width - 1)));

	const logLines = state.logs.slice(-4).map((entry) => `${entry.level}: ${entry.message}`);
	if (logLines.length) {
		lines.push('-'.repeat(Math.max(20, width - 1)));
		lines.push(...logLines.map((line) => clip(line, width - 1)));
	}

	return lines.slice(0, height).join('\n');
}

export async function createTuiSession({ plainLogger } = {}) {
	const renderer = await createCliRenderer({
		exitOnCtrlC: true,
		clearOnShutdown: true,
		screenMode: 'alternate-screen',
		consoleMode: 'disabled',
		externalOutputMode: 'passthrough',
		backgroundColor: '#111416'
	});
	const root = new BoxRenderable(renderer, {
		id: 'content-pipeline-root',
		width: '100%',
		height: '100%',
		padding: 1
	});
	const text = new TextRenderable(renderer, {
		id: 'content-pipeline-dashboard',
		width: '100%',
		height: '100%',
		content: ''
	});
	root.add(text);
	renderer.root.add(root);

	let state = createPipelineState();
	let closed = false;
	let heartbeat = null;

	function render() {
		if (closed || renderer.isDestroyed) {
			return;
		}
		text.content = renderDashboard(state, renderer.width, renderer.height);
		renderer.requestRender();
	}

	function stopHeartbeat() {
		if (heartbeat) {
			clearInterval(heartbeat);
			heartbeat = null;
		}
	}

	function close() {
		if (closed) {
			return;
		}
		stopHeartbeat();
		closed = true;
		renderer.destroy();
		process.stderr.write('TUI closed; generation continues with plain logs.\n');
	}

	renderer.addInputHandler((sequence) => {
		if (sequence === 'q' || sequence === '\u001b') {
			close();
			return true;
		}
		if (sequence === '\u001b[A') {
			state = moveArtifactSelection(state, -1);
			render();
			return true;
		}
		if (sequence === '\u001b[B') {
			state = moveArtifactSelection(state, 1);
			render();
			return true;
		}
		if (sequence === '\t') {
			state = { ...state, focus: state.focus === 'artifacts' ? 'logs' : 'artifacts' };
			render();
			return true;
		}
		if (sequence === 'l') {
			state = { ...state, focus: 'logs' };
			render();
			return true;
		}
		if (sequence === 'a') {
			state = { ...state, focus: 'artifacts' };
			render();
			return true;
		}
		return false;
	});

	renderer.start();
	heartbeat = setInterval(render, 1000);
	heartbeat.unref?.();
	render();

	return {
		emit(event) {
			if (closed) {
				plainLogger?.(event);
				return;
			}
			state = reducePipelineEvent(state, event);
			render();
		},
		close,
		finish() {
			if (!closed) {
				stopHeartbeat();
				render();
				renderer.destroy();
				closed = true;
			}
		}
	};
}
