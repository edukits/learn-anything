import type { PageServerLoad } from './$types';
import { listPublicTopics } from '$lib/features/catalog/server/index.server';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const topics = await listPublicTopics(locals.supabase);
	const { user } = await parent();

	return {
		topics,
		isSignedIn: Boolean(user)
	};
};
