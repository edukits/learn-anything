import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getDefaultTopicSlug } from '$lib/features/catalog/server/index.server';
import { requireUser } from '$lib/server/auth/requireUser.server';

export const load: PageServerLoad = async ({ locals }) => {
	const user = await requireUser(locals);
	const topicSlug = await getDefaultTopicSlug(locals.supabase, user.id);

	if (!topicSlug) {
		throw redirect(303, '/subjects');
	}

	throw redirect(303, `/app/topics/${topicSlug}`);
};
