import { describe, expect, it } from 'vitest';
import { groupPathModules } from './modules';
import type { LearningPathItem, TopicModuleVersion } from './types';

const modules: TopicModuleVersion[] = [
	{
		topic_module_id: 'module_first',
		version: 1,
		topic_area_id: 'topic_test',
		slug: 'first',
		title: 'First',
		description: 'First module',
		content_responsibility: 'First responsibility',
		ordering: 1
	},
	{
		topic_module_id: 'module_second',
		version: 1,
		topic_area_id: 'topic_test',
		slug: 'second',
		title: 'Second',
		description: 'Second module',
		content_responsibility: 'Second responsibility',
		ordering: 2
	}
];

const lesson = {
	id: 'lesson:lesson_one@1',
	item_type: 'lesson',
	item_id: 'lesson_one',
	item_version: 1,
	ordering: 1,
	required: true,
	title: 'Lesson One',
	summary: 'One',
	estimated_minutes: 5
} satisfies Omit<
	Extract<LearningPathItem, { item_type: 'lesson' }>,
	'module_id' | 'module_version'
>;

describe('groupPathModules', () => {
	it('groups path items by persisted module metadata', () => {
		const grouped = groupPathModules(modules, [
			{ ...lesson, module_id: 'module_first', module_version: 1 },
			{
				...lesson,
				id: 'lesson:lesson_two@1',
				item_id: 'lesson_two',
				ordering: 2,
				module_id: 'module_second',
				module_version: 1
			}
		]);

		expect(grouped.map((module) => module.items.map((item) => item.item_id))).toEqual([
			['lesson_one'],
			['lesson_two']
		]);
	});

	it('puts legacy untagged path items in the default module', () => {
		const [grouped] = groupPathModules(
			[modules[0]],
			[{ ...lesson, module_id: null, module_version: null }]
		);

		expect(grouped.items.map((item) => item.item_id)).toEqual(['lesson_one']);
	});
});
