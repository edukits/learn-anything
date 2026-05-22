import type { RequestEvent } from '@sveltejs/kit';
import { requireUser } from '$lib/server/auth/requireUser.server';
import { getLiteraryDevicesContent } from './content.server';
import { getPathItemProgress, getUserProgress } from './progress.server';

export async function loadProtectedLiteraryDevices(locals: RequestEvent['locals']) {
	const user = await requireUser(locals);
	const content = await getLiteraryDevicesContent(locals.supabase);
	const [progress, pathProgress] = await Promise.all([
		getUserProgress(locals.supabase, user.id, content.release.id),
		getPathItemProgress(locals.supabase, user.id, content.release.id, content.pathItems)
	]);

	return {
		user,
		content,
		progress,
		pathProgress
	};
}
