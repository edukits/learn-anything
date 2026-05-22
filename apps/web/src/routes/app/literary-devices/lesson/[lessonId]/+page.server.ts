import { error as kitError, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	getLiteraryDevicesContent,
	getLiteraryDevicesLesson
} from '$lib/features/literary-devices/server/content.server';
import { completeLesson } from '$lib/features/literary-devices/server/mutations.server';
import { getPathItemProgress } from '$lib/features/literary-devices/server/progress.server';
import { requireUser } from '$lib/server/auth/requireUser.server';

export const load: PageServerLoad = async ({ locals, params }) => {
	const user = await requireUser(locals);
	const content = await getLiteraryDevicesContent(locals.supabase);
	const pathProgress = await getPathItemProgress(locals.supabase, user.id, content.release.id, content.pathItems);
	const itemProgress = pathProgress.find((item) => item.item_type === 'lesson' && item.item_id === params.lessonId);
	if (!itemProgress) {
		kitError(404, 'Lesson not found in the current Literary Devices path.');
	}

	const locked = itemProgress.state === 'locked';
	const lesson = locked ? null : await getLiteraryDevicesLesson(locals.supabase, content, params.lessonId);

	return {
		...content,
		lesson,
		itemProgress,
		locked
	};
};

export const actions: Actions = {
	complete: async ({ locals, params }) => {
		const user = await requireUser(locals);
		const content = await getLiteraryDevicesContent(locals.supabase);
		const pathProgress = await getPathItemProgress(locals.supabase, user.id, content.release.id, content.pathItems);
		const itemProgress = pathProgress.find((item) => item.item_type === 'lesson' && item.item_id === params.lessonId);
		if (!itemProgress) {
			kitError(404, 'Lesson not found in the current Literary Devices path.');
		}
		if (itemProgress.state === 'locked') {
			return fail(403, { error: 'Complete the previous path item before completing this lesson.' });
		}

		const lesson = await getLiteraryDevicesLesson(locals.supabase, content, params.lessonId);

		try {
			await completeLesson(locals.supabaseService, user.id, content.release, lesson);
		} catch (error) {
			return fail(500, { error: error instanceof Error ? error.message : 'Unable to complete lesson.' });
		}

		redirect(303, '/app/literary-devices');
	}
};
