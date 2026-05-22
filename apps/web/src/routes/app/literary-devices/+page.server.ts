import type { PageServerLoad } from './$types';
import { getLiteraryDevicesContent, getUserProgress } from '$lib/server/content';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { user } = await parent();
	const content = await getLiteraryDevicesContent(locals.supabase);
	const progress = await getUserProgress(locals.supabase, user.id, content.release.id);

	return {
		...content,
		progress
	};
};
