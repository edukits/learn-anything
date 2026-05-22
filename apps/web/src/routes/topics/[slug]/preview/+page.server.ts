import type { PageServerLoad } from './$types';
import { loadPublicTopicBySlug } from '$lib/features/literary-devices/server/public-route-data.server';

export const load: PageServerLoad = async ({ locals, parent, params }) => {
	return loadPublicTopicBySlug(locals, await parent(), params.slug);
};
