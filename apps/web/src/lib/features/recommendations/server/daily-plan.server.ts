import type { TopicEnrollment } from '$lib/features/catalog';
import {
	getActiveEnrollments,
	listPublicTopics
} from '$lib/features/catalog/server/index.server';
import { getEngagementSummary } from '$lib/features/engagement/server/index.server';
import {
	getWeakSkillMasteryProjections,
	type SkillMasteryProjection
} from '$lib/features/learning/server/index.server';
import {
	getDueSpacedRepetitionItems,
	type DueSpacedRepetitionItem
} from '$lib/features/review/server/index.server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { recommendationId } from '../ids';
import { prioritizeRecommendations, type RecommendationSignal } from '../priority';
import type { DailyPlan, RecommendationItem } from '../types';
import { getTodaysSkippedRecommendationIds } from './recommendation-events.server';

type BuildDailyPlanInput = {
	enrollments: TopicEnrollment[];
	signals?: RecommendationSignal[];
	skippedRecommendationIds?: Set<string>;
	now?: Date;
};

type GetDailyPlanForUserOptions = {
	includeSkipped?: boolean;
	now?: Date;
};

export function buildDailyPlan({
	enrollments,
	signals = [],
	skippedRecommendationIds = new Set(),
	now = new Date()
}: BuildDailyPlanInput): DailyPlan {
	const enrollmentSignals: RecommendationSignal[] = enrollments
		.filter((enrollment) => enrollment.status === 'active')
		.map((enrollment, index) => ({
			id: recommendationId('continue_path', enrollment.topic_area_id),
			reason: 'continue_path',
			topicId: enrollment.topic_area_id,
			topicName: enrollment.topic_name,
			targetUrl: `/app/topics/${enrollment.topic_slug}`,
			description: index === 0 ? 'Next unlocked path item' : 'Continue this enrolled topic',
			skippedToday: skippedRecommendationIds.has(
				recommendationId('continue_path', enrollment.topic_area_id)
			)
		}));
	const items: RecommendationItem[] = prioritizeRecommendations(
		[
			...signals.map((signal) => ({
				...signal,
				skippedToday: signal.skippedToday ?? skippedRecommendationIds.has(signal.id)
			})),
			...enrollmentSignals
		],
		now
	);

	return {
		items,
		generatedAt: now.toISOString()
	};
}

export async function getDailyPlanForUser(
	client: SupabaseClient,
	userId: string,
	options: GetDailyPlanForUserOptions = {}
) {
	const now = options.now ?? new Date();
	const [enrollments, engagement, dueItems, skippedRecommendationIds] = await Promise.all([
		getActiveEnrollments(client, userId),
		getEngagementSummary(client, userId),
		getDueSpacedRepetitionItems(client, userId, now, { limit: 100 }),
		options.includeSkipped
			? Promise.resolve(new Set<string>())
			: getTodaysSkippedRecommendationIds(client, userId, now)
	]);
	const activeEnrollments = enrollments.filter((enrollment) => enrollment.status === 'active');
	const signals = await buildRecommendationSignals(client, userId, {
		enrollments: activeEnrollments,
		dueItems,
		dailyGoalCompleted: engagement.daily_goal_remaining === 0
	});

	return {
		enrollments,
		engagement,
		plan: buildDailyPlan({
			enrollments,
			signals,
			skippedRecommendationIds,
			now
		})
	};
}

async function buildRecommendationSignals(
	client: SupabaseClient,
	userId: string,
	{
		enrollments,
		dueItems,
		dailyGoalCompleted
	}: {
		enrollments: TopicEnrollment[];
		dueItems: DueSpacedRepetitionItem[];
		dailyGoalCompleted: boolean;
	}
): Promise<RecommendationSignal[]> {
	const signals: RecommendationSignal[] = [];
	const enrollmentByTopicId = new Map(
		enrollments.map((enrollment) => [enrollment.topic_area_id, enrollment])
	);

	for (const dueItem of oldestDueItemByTopic(dueItems)) {
		const enrollment = enrollmentByTopicId.get(dueItem.topic_area_id);
		if (!enrollment) continue;
		if (enrollment.topic?.release_id !== dueItem.release_id) continue;

		signals.push({
			id: recommendationId('due_review', enrollment.topic_area_id),
			reason: 'due_review',
			topicId: enrollment.topic_area_id,
			topicName: enrollment.topic_name,
			targetUrl: `/app/topics/${enrollment.topic_slug}/review`,
			description: 'Spaced review is due for this topic.',
			dueAt: new Date(dueItem.due_at)
		});
	}

	const weakSkills = await getWeakSkillMasteryProjections(
		client,
		userId,
		enrollments.map((enrollment) => enrollment.topic_area_id)
	);
	for (const weakSkill of weakestSkillByTopic(weakSkills)) {
		const enrollment = enrollmentByTopicId.get(weakSkill.topic_area_id);
		if (!enrollment) continue;

		signals.push({
			id: recommendationId('weak_skill', enrollment.topic_area_id, weakSkill.skill_id),
			reason: 'weak_skill',
			topicId: enrollment.topic_area_id,
			topicName: enrollment.topic_name,
			targetUrl: `/app/topics/${enrollment.topic_slug}/review`,
			description: `Practice a skill at ${Math.round(weakSkill.mastery_score * 100)}% mastery.`,
			weakSkillAccuracy: weakSkill.mastery_score
		});
	}

	if (!enrollments.length) {
		const [topic] = await listPublicTopics(client);
		if (topic) {
			signals.push({
				id: recommendationId('new_topic', topic.topic_area_id),
				reason: 'new_topic',
				topicId: topic.topic_area_id,
				topicName: topic.name,
				targetUrl: `/topics/${topic.slug}`,
				description: 'Start with a published topic selected for new learners.',
				isNewLearner: true
			});
		}
	}

	if (dailyGoalCompleted && enrollments[0]) {
		const enrollment = enrollments[0];
		signals.push({
			id: recommendationId('daily_goal_stretch', enrollment.topic_area_id),
			reason: 'daily_goal_stretch',
			topicId: enrollment.topic_area_id,
			topicName: enrollment.topic_name,
			targetUrl: `/app/topics/${enrollment.topic_slug}/review`,
			description: 'Daily goal complete. Add a short review while momentum is high.',
			dailyGoalCompleted: true
		});
	}

	return signals;
}

function oldestDueItemByTopic(items: DueSpacedRepetitionItem[]) {
	const byTopic = new Map<string, DueSpacedRepetitionItem>();
	for (const item of items) {
		const current = byTopic.get(item.topic_area_id);
		if (!current || item.due_at < current.due_at) {
			byTopic.set(item.topic_area_id, item);
		}
	}
	return [...byTopic.values()];
}

function weakestSkillByTopic(projections: SkillMasteryProjection[]) {
	const byTopic = new Map<string, SkillMasteryProjection>();
	for (const projection of projections) {
		const current = byTopic.get(projection.topic_area_id);
		if (!current || projection.mastery_score < current.mastery_score) {
			byTopic.set(projection.topic_area_id, projection);
		}
	}
	return [...byTopic.values()];
}
