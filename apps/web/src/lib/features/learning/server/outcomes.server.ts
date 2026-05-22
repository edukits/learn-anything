import type { SupabaseClient } from '@supabase/supabase-js';

export type LearningAnswerOutcome = {
	question_id: string;
	question_version: number;
	skill_id: string;
	is_correct: boolean;
	answered_at: string;
	response_time_ms?: number;
};

export async function recordLearningAnswerOutcomes(
	client: SupabaseClient,
	{
		userId,
		topicId,
		releaseId,
		source,
		sourceId,
		outcomes
	}: {
		userId: string;
		topicId: string;
		releaseId: string;
		source: 'quiz' | 'review' | 'diagnostic' | 'drill';
		sourceId: string;
		outcomes: LearningAnswerOutcome[];
	}
) {
	if (!outcomes.length) return;

	const { error } = await client.rpc('record_learning_answer_outcomes', {
		p_user_id: userId,
		p_topic_area_id: topicId,
		p_release_id: releaseId,
		p_source: source,
		p_source_id: sourceId,
		p_outcomes: outcomes
	});

	if (error) {
		throw new Error(error.message);
	}
}
