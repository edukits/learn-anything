import type { PageServerLoad } from './$types';
import {
	getAttemptDeviceStats,
	getAttempts,
	getLiteraryDevicesContent,
	getUserProgress
} from '$lib/server/content';

export const load: PageServerLoad = async ({ locals, parent, url }) => {
	const { user } = await parent();
	const content = await getLiteraryDevicesContent(locals.supabase);
	const progress = await getUserProgress(locals.supabase, user.id, content.release.id);
	const attempts = await getAttempts(locals.supabase, user.id, content.release.id);
	const requestedAttemptId = url.searchParams.get('attempt');
	const attempt = attempts.find((candidate) => candidate.id === requestedAttemptId) ?? attempts[0] ?? null;
	const deviceStats = attempt ? await getAttemptDeviceStats(locals.supabase, attempt.id) : [];

	return {
		...content,
		progress,
		attempt,
		deviceStats
	};
};
