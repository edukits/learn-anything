import type { PageServerLoad } from './$types';
import { getAttempts, getDeviceStats } from '$lib/features/literary-devices/server/progress.server';
import { getReviewSummary } from '$lib/features/literary-devices/server/review.server';
import { loadProtectedLiteraryDevices } from '$lib/features/literary-devices/server/route-data.server';

export const load: PageServerLoad = async ({ locals }) => {
	const { user, content, progress, pathProgress } = await loadProtectedLiteraryDevices(locals);
	const [attempts, reviewSummary] = await Promise.all([
		getAttempts(locals.supabase, user.id, content.release.id),
		getReviewSummary(locals.supabase, user.id, content)
	]);
	const deviceStats = await getDeviceStats(
		locals.supabase,
		attempts.map((attempt) => attempt.id)
	);

	return {
		...content,
		progress,
		pathProgress,
		reviewSummary,
		attempts,
		deviceStats
	};
};
