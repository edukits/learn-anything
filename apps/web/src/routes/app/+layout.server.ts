import type { LayoutServerLoad } from './$types';
import { getEnrollments } from '$lib/features/catalog/server/index.server';
import { getContentAdminRole } from '$lib/features/content-admin/server/index.server';
import { getEngagementSummary } from '$lib/features/engagement/server/index.server';
import { requireUser } from '$lib/server/auth/requireUser.server';

export const load: LayoutServerLoad = async ({ locals }) => {
	const user = await requireUser(locals);
	const [adminRole, engagement, enrollments] = await Promise.all([
		getContentAdminRole(locals.supabaseService, user.id),
		getEngagementSummary(locals.supabase, user.id),
		getEnrollments(locals.supabase, user.id)
	]);

	return {
		adminRole,
		engagement,
		enrollments,
		session: null,
		user
	};
};
