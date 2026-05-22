import type { PageServerLoad } from './$types';
import {
	getAttempts,
	getDeviceStats,
	getLiteraryDevicesContent,
	getUserProgress
} from '$lib/server/content';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { user } = await parent();
	const content = await getLiteraryDevicesContent(locals.supabase);
	const progress = await getUserProgress(locals.supabase, user.id, content.release.id);
	const attempts = await getAttempts(locals.supabase, user.id, content.release.id);
	const deviceStats = await getDeviceStats(
		locals.supabase,
		attempts.map((attempt) => attempt.id)
	);

	return {
		...content,
		progress,
		attempts,
		deviceStats
	};
};
