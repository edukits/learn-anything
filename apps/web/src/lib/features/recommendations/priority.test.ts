import { describe, expect, test } from 'vitest';
import { prioritizeRecommendations, scoreSignal, type RecommendationSignal } from './priority';

const now = new Date('2026-05-22T12:00:00.000Z');

function signal(overrides: Partial<RecommendationSignal>): RecommendationSignal {
	return {
		id: overrides.id ?? `item:${overrides.reason ?? 'continue_path'}`,
		topicId: overrides.topicId ?? 'topic_1',
		topicName: overrides.topicName ?? 'Topic',
		targetUrl: overrides.targetUrl ?? '/app/topics/topic',
		reason: overrides.reason ?? 'continue_path',
		description: overrides.description ?? 'Recommendation',
		...overrides
	};
}

describe('prioritizeRecommendations', () => {
	test('new learner start recommendations are boosted within new topic suggestions', () => {
		const items = prioritizeRecommendations(
			[
				signal({ id: 'returning-new', reason: 'new_topic' }),
				signal({ id: 'first-topic', reason: 'new_topic', isNewLearner: true })
			],
			now
		);

		expect(items.map((item) => item.id)).toEqual(['first-topic', 'returning-new']);
		expect(scoreSignal(signal({ reason: 'new_topic', isNewLearner: true }), now)).toBeLessThan(
			scoreSignal(signal({ reason: 'new_topic' }), now)
		);
	});

	test('overdue review outranks due-today review', () => {
		const items = prioritizeRecommendations(
			[
				signal({ id: 'today', reason: 'due_review', dueAt: now }),
				signal({ id: 'overdue', reason: 'due_review', dueAt: new Date('2026-05-19T12:00:00.000Z') })
			],
			now
		);

		expect(items[0].id).toBe('overdue');
	});

	test('weakest skill gets the stronger priority', () => {
		const items = prioritizeRecommendations(
			[
				signal({ id: 'nearly-there', reason: 'weak_skill', weakSkillAccuracy: 0.65 }),
				signal({ id: 'weakest', reason: 'weak_skill', weakSkillAccuracy: 0.2 })
			],
			now
		);

		expect(items[0].id).toBe('weakest');
	});

	test('daily goal stretch is delayed until the daily goal is complete', () => {
		expect(
			scoreSignal(signal({ reason: 'daily_goal_stretch', dailyGoalCompleted: false }), now)
		).toBeGreaterThan(
			scoreSignal(signal({ reason: 'daily_goal_stretch', dailyGoalCompleted: true }), now)
		);
	});

	test('skipped recommendations are filtered out', () => {
		const items = prioritizeRecommendations(
			[signal({ id: 'skip-me', skippedToday: true }), signal({ id: 'keep-me' })],
			now
		);

		expect(items.map((item) => item.id)).toEqual(['keep-me']);
	});

	test('multi-topic states are globally ordered by priority', () => {
		const items = prioritizeRecommendations(
			[
				signal({
					id: 'math-continue',
					topicId: 'math',
					reason: 'continue_path',
					topicName: 'Math'
				}),
				signal({
					id: 'english-review',
					topicId: 'english',
					reason: 'due_review',
					topicName: 'English'
				}),
				signal({
					id: 'math-weak',
					topicId: 'math',
					reason: 'weak_skill',
					topicName: 'Math',
					weakSkillAccuracy: 0.4
				})
			],
			now
		);

		expect(items.map((item) => item.id)).toEqual(['english-review', 'math-continue', 'math-weak']);
	});
});
