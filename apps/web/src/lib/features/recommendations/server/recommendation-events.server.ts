import type { SupabaseClient } from '@supabase/supabase-js';
import type { RecommendationItem } from '../types';

export async function getTodaysSkippedRecommendationIds(
	client: SupabaseClient,
	userId: string,
	now = new Date()
): Promise<Set<string>> {
	const start = new Date(now);
	start.setHours(0, 0, 0, 0);
	const end = new Date(now);
	end.setHours(23, 59, 59, 999);

	const { data, error } = await client
		.from('recommendation_events')
		.select('recommendation_id')
		.eq('user_id', userId)
		.eq('reason', 'skipped')
		.gte('occurred_at', start.toISOString())
		.lte('occurred_at', end.toISOString());

	if (error) {
		throw new Error(error.message);
	}

	return new Set((data ?? []).map((event) => event.recommendation_id));
}

export async function logRecommendationDecision(
	client: SupabaseClient,
	userId: string,
	recommendation: RecommendationItem,
	reason: 'generated' | 'shown' | 'started' | 'skipped' | 'dismissed' = 'generated'
) {
	const { error } = await client.from('recommendation_events').insert({
		user_id: userId,
		topic_area_id: recommendation.topicId,
		recommendation_id: recommendation.id,
		reason,
		payload: {
			recommendation_reason: recommendation.reason,
			priority: recommendation.priority,
			target_url: recommendation.targetUrl
		}
	});

	if (error) {
		throw new Error(error.message);
	}

	return { logged: true as const };
}
