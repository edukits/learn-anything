import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getLiteraryDevicesContent, getUserProgress, LITERARY_DEVICES_TOPIC_ID } from '$lib/server/content';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { user } = await parent();
	const content = await getLiteraryDevicesContent(locals.supabase);
	const progress = await getUserProgress(locals.supabase, user.id, content.release.id);

	return {
		...content,
		progress
	};
};

export const actions: Actions = {
	complete: async ({ locals }) => {
		const { user } = await locals.safeGetSession();

		if (!user) {
			redirect(303, '/sign-in');
		}

		const content = await getLiteraryDevicesContent(locals.supabase);

		const { error: completionError } = await locals.supabaseService.from('lesson_completions').upsert(
			{
				user_id: user.id,
				lesson_id: content.lesson.lesson_id,
				lesson_version: content.lesson.version,
				release_id: content.release.id
			},
			{ onConflict: 'user_id,lesson_id,lesson_version,release_id' }
		);

		if (completionError) {
			return fail(500, { error: completionError.message });
		}

		const current = await getUserProgress(locals.supabaseService, user.id, content.release.id);
		const { error: progressError } = await locals.supabaseService.from('user_progress').upsert(
			{
				user_id: user.id,
				topic_area_id: LITERARY_DEVICES_TOPIC_ID,
				release_id: content.release.id,
				intro_lesson_completed: true,
				quiz_completed: current.quiz_completed,
				latest_attempt_id: current.latest_attempt_id,
				latest_score: current.latest_score,
				best_score: current.best_score,
				total_attempts: current.total_attempts
			},
			{ onConflict: 'user_id,topic_area_id,release_id' }
		);

		if (progressError) {
			return fail(500, { error: progressError.message });
		}

		redirect(303, '/app/literary-devices');
	}
};
