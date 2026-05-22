import type { LayoutServerLoad } from './$types';
import { getEngagementSummary } from '$lib/features/literary-devices/server/engagement.server';
import { requireUser } from '$lib/server/auth/requireUser.server';

export const load: LayoutServerLoad = async ({ locals }) => {
	const user = await requireUser(locals);
	const engagement = await getEngagementSummary(locals.supabase, user.id);

	return {
		engagement,
		session: null,
		user
	};
};
