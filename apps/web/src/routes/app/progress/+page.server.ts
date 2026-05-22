import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { getDefaultTopicSlug } from '$lib/features/catalog/server/index.server';
import {
	getAttempts,
	getPathItemProgress,
	getSkillAccuracyStats,
	getTopicContentBySlug,
	getUserProgress
} from '$lib/features/learning/server/index.server';
import { getReviewSummary } from '$lib/features/review/server/index.server';
import { requireUser } from '$lib/server/auth/requireUser.server';

export const load: PageServerLoad = async ({ locals }) => {
	const user = await requireUser(locals);
	const topicSlug = await getDefaultTopicSlug(locals.supabase, user.id);
	if (!topicSlug) {
		redirect(303, '/subjects');
	}
	const content = await getTopicContentBySlug(locals.supabase, topicSlug);
	if (!content) {
		redirect(303, '/subjects');
	}
	const [progress, pathProgress] = await Promise.all([
		getUserProgress(locals.supabase, user.id, content.topic.topic_area_id, content.release.id),
		getPathItemProgress(locals.supabase, user.id, content.release.id, content.pathItems)
	]);
	const [attempts, reviewSummary] = await Promise.all([
		getAttempts(locals.supabase, user.id, content.release.id),
		getReviewSummary(locals.supabase, user.id, content)
	]);
	const skillAccuracy = await getSkillAccuracyStats(
		locals.supabase,
		attempts.map((attempt) => attempt.id)
	);

	return {
		...content,
		topicSlug,
		progress,
		pathProgress,
		reviewSummary,
		attempts,
		skillAccuracy
	};
};
