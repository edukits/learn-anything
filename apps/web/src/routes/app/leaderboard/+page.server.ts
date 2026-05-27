import type { PageServerLoad } from './$types';
import {
	ensureWeeklyLeagueMembership,
	getPublicProfile,
	getWeeklyLeaderboard
} from '$lib/features/social/server/index.server';
import { noindexSeo } from '$lib/seo';

export const load: PageServerLoad = async ({ locals, parent, url }) => {
	const { user, enrollments } = await parent();
	const activeEnrollments = enrollments.filter((enrollment) => enrollment.status === 'active');
	const requestedTopicId = url.searchParams.get('topic');
	const activeTopicId =
		requestedTopicId &&
		activeEnrollments.some((enrollment) => enrollment.topic_area_id === requestedTopicId)
			? requestedTopicId
			: null;
	const profile = await getPublicProfile(locals.supabase, user.id, user.email);
	const membership = profile.leaderboard_opt_in
		? await ensureWeeklyLeagueMembership(locals.supabaseService, user.id, activeTopicId)
		: null;
	const entries = profile.leaderboard_opt_in
		? await getWeeklyLeaderboard(locals.supabaseService, user.id, activeTopicId)
		: [];

	return {
		activeTopicId,
		entries,
		enrollments: activeEnrollments,
		membership,
		profile,
		seo: noindexSeo('Leaderboard', url)
	};
};
