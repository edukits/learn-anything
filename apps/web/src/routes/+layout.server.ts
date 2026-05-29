import type { LayoutServerLoad } from './$types';
import { listSubjects } from '$lib/features/catalog/server/index.server';
import { getContentAdminRole } from '$lib/features/content-admin/server/index.server';
import { buildNotionistsAvatarUrl } from '$lib/features/social';
import { getPublicProfile } from '$lib/features/social/server/index.server';

export const load: LayoutServerLoad = async ({ locals }) => {
	const { session, user } = await locals.safeGetSession();
	const [adminRole, profile, subjects] = await Promise.all([
		user ? getContentAdminRole(locals.supabaseService, user.id) : null,
		user ? getPublicProfile(locals.supabase, user.id, user.email) : null,
		listSubjects(locals.supabase)
	]);

	return {
		adminRole,
		navUser: user
			? {
					email: user.email,
					avatarUrl: profile ? buildNotionistsAvatarUrl(profile.avatar_options, 72) : null
				}
			: null,
		session,
		user,
		subjects
	};
};
