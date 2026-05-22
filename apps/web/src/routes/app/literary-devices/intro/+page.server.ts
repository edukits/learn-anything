import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getLiteraryDevicesContent } from '$lib/features/literary-devices/server/content.server';
import { requireUser } from '$lib/server/auth/requireUser.server';

export const load: PageServerLoad = async ({ locals }) => {
	await requireUser(locals);
	const content = await getLiteraryDevicesContent(locals.supabase);
	const firstLesson = content.pathItems.find((item) => item.item_type === 'lesson');

	if (!firstLesson) {
		redirect(303, '/app/literary-devices');
	}

	redirect(303, `/app/literary-devices/lesson/${firstLesson.item_id}`);
};
