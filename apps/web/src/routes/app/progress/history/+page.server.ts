import type { PageServerLoad } from './$types';
import { getActivityHistory, getAttempts } from '$lib/features/literary-devices/server/progress.server';
import { loadProtectedLiteraryDevices } from '$lib/features/literary-devices/server/route-data.server';

export const load: PageServerLoad = async ({ locals }) => {
	const { user, content } = await loadProtectedLiteraryDevices(locals);
	const [activityHistory, attempts] = await Promise.all([
		getActivityHistory(locals.supabase, user.id),
		getAttempts(locals.supabase, user.id, content.release.id)
	]);

	return {
		activityHistory,
		attempts,
		release: content.release
	};
};
