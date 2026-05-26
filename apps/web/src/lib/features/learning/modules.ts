import type { LearningPathItem, LearningPathModule, TopicModuleVersion } from './types';

function moduleKey(moduleId: string | null, moduleVersion: number | null) {
	return moduleId && moduleVersion ? `${moduleId}@${moduleVersion}` : null;
}

export function groupPathModules(
	modules: TopicModuleVersion[],
	pathItems: LearningPathItem[]
): LearningPathModule[] {
	const fallbackModule = modules[0];
	const fallbackKey = fallbackModule
		? moduleKey(fallbackModule.topic_module_id, fallbackModule.version)
		: null;
	const groups = new Map(
		modules.map((module) => [
			moduleKey(module.topic_module_id, module.version),
			{ ...module, items: [] as LearningPathItem[] }
		])
	);

	for (const item of pathItems) {
		const key = moduleKey(item.module_id, item.module_version);
		const group =
			(key ? groups.get(key) : undefined) ?? (fallbackKey ? groups.get(fallbackKey) : undefined);
		group?.items.push(item);
	}

	return [...groups.values()].toSorted((a, b) => a.ordering - b.ordering);
}
