const stageLabels = {
	modules: 'Modules',
	syllabi: 'Syllabi',
	generate: 'Generate',
	review: 'Review',
	bundle: 'Bundle'
};

export const pipelineStages = Object.keys(stageLabels);

export function labelForStage(stage) {
	return stageLabels[stage] ?? stage;
}

export function createPipelineState(now = new Date()) {
	return {
		startedAt: now.toISOString(),
		endedAt: null,
		topicDir: null,
		model: null,
		concurrency: null,
		currentStage: null,
		status: 'idle',
		stages: pipelineStages.map((id) => ({
			id,
			label: labelForStage(id),
			status: 'pending',
			total: 0,
			completed: 0
		})),
		tasks: [],
		artifacts: [],
		logs: [],
		validation: null,
		selectedArtifactIndex: 0,
		focus: 'artifacts'
	};
}

function upsertById(items, id, patch) {
	const index = items.findIndex((item) => item.id === id);
	if (index === -1) {
		return [...items, { id, ...patch }];
	}
	const next = [...items];
	next[index] = { ...next[index], ...patch };
	return next;
}

function updateStage(stages, id, patch) {
	return stages.map((stage) => (stage.id === id ? { ...stage, ...patch } : stage));
}

function appendLog(state, message, level = 'info') {
	return {
		...state,
		logs: [...state.logs, { message, level, at: new Date().toISOString() }].slice(-200)
	};
}

function completeStageProgress(stage, tasks) {
	if (!stage) {
		return stage;
	}
	const stageTasks = tasks.filter((task) => task.stage === stage.id);
	if (!stageTasks.length) {
		return stage;
	}
	return {
		...stage,
		total: Math.max(stage.total, stageTasks.length),
		completed: stageTasks.filter((task) => task.status === 'completed').length
	};
}

export function reducePipelineEvent(state, event) {
	if (!event || typeof event.type !== 'string') {
		return state;
	}

	if (event.type === 'pipeline_start') {
		return appendLog(
			{
				...state,
				status: 'running',
				startedAt: event.startedAt ?? state.startedAt,
				topicDir: event.topicDir,
				model: event.model,
				concurrency: event.concurrency
			},
			`Started ${event.topicDir}`
		);
	}

	if (event.type === 'warning') {
		return appendLog(state, event.message, 'warning');
	}

	if (event.type === 'stage_start') {
		return appendLog(
			{
				...state,
				currentStage: event.stage,
				stages: updateStage(state.stages, event.stage, {
					status: 'running',
					total: event.total ?? 0,
					completed: 0
				})
			},
			`${labelForStage(event.stage)} started${event.total ? ` (${event.total})` : ''}`
		);
	}

	if (event.type === 'stage_end') {
		return appendLog(
			{
				...state,
				stages: updateStage(state.stages, event.stage, {
					status: 'completed',
					completed: event.completed ?? event.total ?? 0,
					total: event.total ?? event.completed ?? 0
				})
			},
			`${labelForStage(event.stage)} completed`
		);
	}

	if (event.type === 'task_queued' || event.type === 'task_start') {
		const taskStatus = event.type === 'task_start' ? 'running' : 'queued';
		const tasks = upsertById(state.tasks, event.taskId, {
			label: event.label,
			stage: event.stage,
			status: taskStatus,
			artifactPath: event.artifactPath,
			message: taskStatus
		});
		const stages = state.stages.map((stage) => completeStageProgress(stage, tasks));
		return {
			...appendLog(state, `${event.label} ${taskStatus}`, 'task'),
			tasks,
			stages
		};
	}

	if (
		event.type === 'task_tool_start' ||
		event.type === 'task_tool_failed' ||
		event.type === 'task_agent_finished' ||
		event.type === 'task_repair'
	) {
		const level = event.type === 'task_tool_failed' ? 'error' : 'task';
		const message =
			event.type === 'task_repair'
				? `${event.label} repair ${event.kind} ${event.attempt}/${event.maxRepairAttempts}`
				: event.toolName
					? `${event.label} ${event.toolName}`
					: `${event.label} agent finished`;
		return appendLog(
			{
				...state,
				tasks: upsertById(state.tasks, event.taskId, {
					message,
					status: event.type === 'task_tool_failed' ? 'running' : state.tasks.find((task) => task.id === event.taskId)?.status
				})
			},
			message,
			level
		);
	}

	if (event.type === 'task_complete' || event.type === 'task_failed') {
		const status = event.type === 'task_complete' ? 'completed' : 'failed';
		const tasks = upsertById(state.tasks, event.taskId, {
			label: event.label,
			stage: event.stage,
			status,
			artifactPath: event.artifactPath,
			message: event.error ?? status
		});
		const stages = state.stages.map((stage) => completeStageProgress(stage, tasks));
		return appendLog(
			{
				...state,
				tasks,
				stages
			},
			event.type === 'task_complete' ? `${event.label} completed` : `${event.label} failed: ${event.error}`,
			event.type === 'task_complete' ? 'task' : 'error'
		);
	}

	if (event.type === 'artifact') {
		const artifacts = upsertById(state.artifacts, event.path, {
			path: event.path,
			label: event.label,
			stage: event.stage,
			kind: event.kind,
			status: event.status ?? 'created',
			count: event.count
		});
		return appendLog(
			{
				...state,
				artifacts,
				selectedArtifactIndex: Math.min(state.selectedArtifactIndex, Math.max(artifacts.length - 1, 0))
			},
			`Artifact ${event.label}: ${event.path}`,
			'artifact'
		);
	}

	if (event.type === 'validation') {
		return appendLog(
			{
				...state,
				validation: {
					valid: event.valid,
					manifestPath: event.manifestPath,
					counts: event.counts ?? {},
					failures: event.failures ?? []
				}
			},
			`Validation ${event.valid ? 'passed' : 'failed'}: ${event.manifestPath}`,
			event.valid ? 'info' : 'error'
		);
	}

	if (event.type === 'pipeline_end') {
		return appendLog(
			{
				...state,
				status: event.ok ? 'completed' : 'failed',
				endedAt: event.endedAt ?? new Date().toISOString()
			},
			event.ok ? 'Pipeline completed' : `Pipeline failed: ${event.error}`,
			event.ok ? 'info' : 'error'
		);
	}

	return state;
}

export function moveArtifactSelection(state, delta) {
	if (!state.artifacts.length) {
		return state;
	}
	return {
		...state,
		selectedArtifactIndex:
			(state.selectedArtifactIndex + delta + state.artifacts.length) % state.artifacts.length
	};
}
