import type { PageServerLoad } from './$types';
import { getAttemptDeviceStats, getAttempts } from '$lib/features/literary-devices/server/progress.server';
import { loadProtectedLiteraryDevices } from '$lib/features/literary-devices/server/route-data.server';

const completedAtFormatter = new Intl.DateTimeFormat('en-US', {
	dateStyle: 'medium',
	timeStyle: 'short',
	timeZone: 'America/Los_Angeles'
});

export const load: PageServerLoad = async ({ locals, url }) => {
	const { user, content, progress } = await loadProtectedLiteraryDevices(locals);
	const attempts = await getAttempts(locals.supabase, user.id, content.release.id);
	const requestedAttemptId = url.searchParams.get('attempt');
	const attempt = attempts.find((candidate) => candidate.id === requestedAttemptId) ?? attempts[0] ?? null;
	const deviceStats = attempt ? await getAttemptDeviceStats(locals.supabase, attempt.id) : [];

	return {
		...content,
		progress,
		attempt,
		attemptCompletedAtLabel: attempt ? completedAtFormatter.format(new Date(attempt.completed_at)) : null,
		deviceStats
	};
};
