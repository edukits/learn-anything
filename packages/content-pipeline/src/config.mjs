export const defaultGenerationConfig = {
	concurrency: 3,
	model: 'openai-codex:gpt-5.5',
	thinkingLevels: {
		syllabus: 'high',
		lesson: 'low',
		quiz: 'medium',
		review: 'low'
	}
};

export function thinkingLevelForStage(config, stage) {
	return config.thinkingLevels[stage] ?? 'minimal';
}
