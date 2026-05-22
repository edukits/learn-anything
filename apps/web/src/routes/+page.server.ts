import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { listPublicTopics } from '$lib/features/catalog/server/index.server';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { user } = await parent();
	const topic = (await listPublicTopics(locals.supabase))[0];
	if (!topic) {
		error(404, 'No public topics are available yet.');
	}

	return {
		topic,
		isSignedIn: Boolean(user)
	};
};
