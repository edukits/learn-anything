import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { getDefaultTopicSlug } from '$lib/features/catalog/server/index.server';
import {
	getActivityHistory,
	getAttempts,
	getTopicContentBySlug
} from '$lib/features/learning/server/index.server';
import { requireUser } from '$lib/server/auth/requireUser.server';

export const load: PageServerLoad = async ({ locals }) => {
	const user = await requireUser(locals);
	const topicSlug = await getDefaultTopicSlug(locals.supabase, user.id);
	if (!topicSlug) {
		throw redirect(303, '/subjects');
	}
	const content = await getTopicContentBySlug(locals.supabase, topicSlug);
	if (!content) {
		throw redirect(303, '/subjects');
	}
	const [activityHistory, attempts] = await Promise.all([
		getActivityHistory(locals.supabase, user.id, content.topic.topic_area_id),
		getAttempts(locals.supabase, user.id, content.release.id)
	]);

	return {
		activityHistory,
		attempts,
		release: content.release,
		topic: content.topic
	};
};
