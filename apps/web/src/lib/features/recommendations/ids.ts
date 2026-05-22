import type { RecommendationReason } from './types';

export function recommendationId(
	reason: RecommendationReason,
	topicId: string,
	qualifier?: string
) {
	const prefix = prefixForReason(reason);
	return qualifier ? `${prefix}:${topicId}:${qualifier}` : `${prefix}:${topicId}`;
}

function prefixForReason(reason: RecommendationReason) {
	if (reason === 'due_review') return 'due-review';
	if (reason === 'weak_skill') return 'weak-skill';
	if (reason === 'new_topic') return 'new-topic';
	if (reason === 'daily_goal_stretch') return 'stretch';
	return 'continue';
}
