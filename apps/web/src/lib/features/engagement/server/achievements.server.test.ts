import { describe, expect, test } from 'vitest';
import { buildAchievementRows } from './achievements.server';
import type { AchievementDefinitionRow } from './achievements.server';

const definitions: (AchievementDefinitionRow & {
	current_metric: number;
	progress_percent: number;
	earned_at: string | null;
})[] = [
	{
		key: 'five_lessons',
		name: 'Lesson rhythm',
		description: 'Complete 5 lessons.',
		category: 'learning',
		condition_type: 'activity_count',
		condition_scope: 'lesson_completed',
		threshold: 5,
		reward_kind: 'badge',
		reward_key: 'badge_lesson_rhythm',
		reward_label: 'Lesson Rhythm',
		current_metric: 2,
		progress_percent: 40,
		earned_at: null
	},
	{
		key: 'hundred_xp',
		name: '100 XP',
		description: 'Earn 100 total XP.',
		category: 'xp',
		condition_type: 'xp_total',
		condition_scope: null,
		threshold: 100,
		reward_kind: 'title',
		reward_key: 'title_xp_builder',
		reward_label: 'XP Builder',
		current_metric: 80,
		progress_percent: 80,
		earned_at: null
	},
	{
		key: 'five_reviews',
		name: 'Review rhythm',
		description: 'Complete 5 reviews.',
		category: 'review',
		condition_type: 'activity_count',
		condition_scope: 'review_completed',
		threshold: 5,
		reward_kind: 'badge',
		reward_key: 'badge_review_rhythm',
		reward_label: 'Review Rhythm',
		current_metric: 4,
		progress_percent: 80,
		earned_at: null
	},
	{
		key: 'three_day_streak',
		name: 'Three-day streak',
		description: 'Reach a three-day streak.',
		category: 'streak',
		condition_type: 'streak_current',
		condition_scope: null,
		threshold: 3,
		reward_kind: 'title',
		reward_key: 'title_consistent_learner',
		reward_label: 'Consistent Learner',
		current_metric: 3,
		progress_percent: 100,
		earned_at: null
	}
];

describe('buildAchievementRows', () => {
	test('adds progress metrics and labels for locked achievements', () => {
		const rows = buildAchievementRows(definitions);

		expect(rows.map((row) => row.key)).toEqual([
			'three_day_streak',
			'five_reviews',
			'hundred_xp',
			'five_lessons'
		]);
		expect(rows.find((row) => row.key === 'hundred_xp')).toMatchObject({
			current_metric: 80,
			progress_percent: 80,
			progress_label: '80 / 100 XP'
		});
		expect(rows.find((row) => row.key === 'five_lessons')).toMatchObject({
			current_metric: 2,
			progress_percent: 40,
			progress_label: '2 / 5 lessons'
		});
	});

	test('sorts earned achievements first and clamps earned labels at the threshold', () => {
		const rows = buildAchievementRows(
			definitions.map((definition) => {
				if (definition.key === 'five_lessons') {
					return Object.assign({}, definition, {
						current_metric: 8,
						progress_percent: 100,
						earned_at: '2026-05-21T12:00:00.000Z'
					});
				}
				if (definition.key === 'three_day_streak') {
					return Object.assign({}, definition, {
						earned_at: '2026-05-22T12:00:00.000Z'
					});
				}
				return definition;
			})
		);

		expect(rows.map((row) => row.key).slice(0, 2)).toEqual([
			'three_day_streak',
			'five_lessons'
		]);
		expect(rows.find((row) => row.key === 'five_lessons')?.progress_label).toBe(
			'5 / 5 lessons'
		);
	});
});
