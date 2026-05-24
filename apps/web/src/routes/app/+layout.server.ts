import type { LayoutServerLoad } from './$types';
import { getEnrollments } from '$lib/features/catalog/server/index.server';
import { getEngagementSummary } from '$lib/features/engagement/server/index.server';
import { requireUser } from '$lib/server/auth/requireUser.server';

export const load: LayoutServerLoad = async ({ locals }) => {
	const user = await requireUser(locals);
	const [engagement, enrollments] = await Promise.all([
		getEngagementSummary(locals.supabase, user.id),
		getEnrollments(locals.supabase, user.id)
	]);

	return {
		engagement,
		enrollments,
		session: null,
		user
	};
};
