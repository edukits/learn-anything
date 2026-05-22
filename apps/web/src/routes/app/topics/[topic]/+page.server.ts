import type { PageServerLoad } from './$types';
import {
	getPathItemProgress,
	getSkillMasteryProjections,
	getUserProgress
} from '$lib/features/learning/server/index.server';
import { getReviewSummary } from '$lib/features/review/server/index.server';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { user, content } = await parent();
	const [progress, pathProgress, mastery] = await Promise.all([
		getUserProgress(locals.supabase, user.id, content.topic.topic_area_id, content.release.id),
		getPathItemProgress(locals.supabase, user.id, content.release.id, content.pathItems),
		getSkillMasteryProjections(locals.supabase, user.id, content.topic.topic_area_id)
	]);
	const reviewSummary = await getReviewSummary(locals.supabase, user.id, content);

	return {
		...content,
		progress,
		mastery,
		pathProgress,
		reviewSummary
	};
};
