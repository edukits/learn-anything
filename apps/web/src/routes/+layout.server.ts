import type { LayoutServerLoad } from './$types';
import { listSubjects } from '$lib/features/catalog/server/index.server';

export const load: LayoutServerLoad = async ({ locals }) => {
	const { session, user } = await locals.safeGetSession();

	return {
		session,
		user,
		subjects: await listSubjects(locals.supabase)
	};
};
