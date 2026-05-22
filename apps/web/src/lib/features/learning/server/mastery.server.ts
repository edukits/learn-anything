import type { SupabaseClient } from '@supabase/supabase-js';

export type SkillMasteryProjection = {
	topic_area_id: string;
	skill_id: string;
	mastery_score: number;
	evidence_count: number;
	updated_at: string;
};

export async function getSkillMasteryProjections(
	client: SupabaseClient,
	userId: string,
	topicId: string
): Promise<SkillMasteryProjection[]> {
	const { data, error } = await client
		.from('skill_mastery_projections')
		.select('topic_area_id,skill_id,mastery_score,evidence_count,updated_at')
		.eq('user_id', userId)
		.eq('topic_area_id', topicId)
		.order('mastery_score');

	if (error) {
		throw new Error(error.message);
	}

	return (data ?? []).map((row) => ({
		topic_area_id: row.topic_area_id,
		skill_id: row.skill_id,
		mastery_score: Number(row.mastery_score),
		evidence_count: row.evidence_count,
		updated_at: row.updated_at
	}));
}

export async function getWeakSkillMasteryProjections(
	client: SupabaseClient,
	userId: string,
	topicIds: string[],
	threshold = 0.7
): Promise<SkillMasteryProjection[]> {
	if (!topicIds.length) return [];

	const { data, error } = await client
		.from('skill_mastery_projections')
		.select('topic_area_id,skill_id,mastery_score,evidence_count,updated_at')
		.eq('user_id', userId)
		.in('topic_area_id', topicIds)
		.lt('mastery_score', threshold)
		.order('mastery_score');

	if (error) {
		throw new Error(error.message);
	}

	return (data ?? []).map((row) => ({
		topic_area_id: row.topic_area_id,
		skill_id: row.skill_id,
		mastery_score: Number(row.mastery_score),
		evidence_count: row.evidence_count,
		updated_at: row.updated_at
	}));
}
