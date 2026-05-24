import type { LayoutServerLoad } from './$types';
import { listSubjects } from '$lib/features/catalog/server/index.server';
import { getContentAdminRole } from '$lib/features/content-admin/server/index.server';

export const load: LayoutServerLoad = async ({ locals }) => {
	const { session, user } = await locals.safeGetSession();
	const [adminRole, subjects] = await Promise.all([
		user ? getContentAdminRole(locals.supabaseService, user.id) : null,
		listSubjects(locals.supabase)
	]);

	return {
		adminRole,
		session,
		user,
		subjects
	};
};
