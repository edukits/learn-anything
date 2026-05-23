import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getPathItemProgress } from '$lib/features/learning/server/index.server';

export const load: PageServerLoad = async ({ locals, parent, params }) => {
	const { user, content } = await parent();
	const pathProgress = await getPathItemProgress(locals.supabase, user.id, content.release.id, content.pathItems);
	const firstUnlockedQuiz =
		pathProgress.find((item) => item.item_type === 'quiz' && item.state !== 'locked') ??
		pathProgress.find((item) => item.item_type === 'quiz');

	if (!firstUnlockedQuiz) {
		throw redirect(303, `/app/topics/${params.topic}`);
	}

	throw redirect(303, `/app/topics/${params.topic}/quiz/${firstUnlockedQuiz.item_id}`);
};
