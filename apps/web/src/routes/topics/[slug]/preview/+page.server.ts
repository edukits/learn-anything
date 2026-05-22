import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { findPublicTopicDiscoveryBySlug } from '$lib/features/catalog/server/index.server';

export const load: PageServerLoad = async ({ locals, parent, params }) => {
	const topic = await findPublicTopicDiscoveryBySlug(locals.supabase, params.slug);
	if (!topic) {
		error(404, 'Topic not found');
	}
	const { user } = await parent();

	return {
		topic,
		isSignedIn: Boolean(user)
	};
};
