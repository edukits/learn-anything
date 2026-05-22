import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { loadProtectedLiteraryDevices } from '$lib/features/literary-devices/server/route-data.server';

export const load: PageServerLoad = async ({ locals }) => {
	const { pathProgress } = await loadProtectedLiteraryDevices(locals);
	const firstUnlockedQuiz =
		pathProgress.find((item) => item.item_type === 'quiz' && item.state !== 'locked') ??
		pathProgress.find((item) => item.item_type === 'quiz');

	if (!firstUnlockedQuiz) {
		redirect(303, '/app/literary-devices');
	}

	redirect(303, `/app/literary-devices/quiz/${firstUnlockedQuiz.item_id}`);
};
