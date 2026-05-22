import type { PageServerLoad } from './$types';
import { getReviewSummary } from '$lib/features/literary-devices/server/review.server';
import { loadProtectedLiteraryDevices } from '$lib/features/literary-devices/server/route-data.server';

export const load: PageServerLoad = async ({ locals }) => {
	const { user, content, progress, pathProgress } = await loadProtectedLiteraryDevices(locals);
	const reviewSummary = await getReviewSummary(locals.supabase, user.id, content);

	return {
		...content,
		progress,
		pathProgress,
		reviewSummary
	};
};
