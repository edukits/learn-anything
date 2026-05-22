import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getSubjectBySlug } from '$lib/features/catalog/server/index.server';

export const load: PageServerLoad = async ({ locals, params, parent }) => {
	const result = await getSubjectBySlug(locals.supabase, params.subject);
	if (!result) {
		error(404, 'Subject not found');
	}
	const { user } = await parent();

	return {
		...result,
		isSignedIn: Boolean(user)
	};
};
