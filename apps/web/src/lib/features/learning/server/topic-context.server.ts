import { error, redirect, type RequestEvent } from '@sveltejs/kit';
import { getEnrollmentForTopic } from '$lib/features/catalog/server/index.server';
import { requireUser } from '$lib/server/auth/requireUser.server';
import { getTopicContentBySlug } from './content.server';

export async function requireProtectedTopic(locals: RequestEvent['locals'], topicSlug: string) {
	const user = await requireUser(locals);
	const content = await getTopicContentBySlug(locals.supabase, topicSlug);
	if (!content) {
		error(404, 'Topic not found');
	}

	const enrollment = await getEnrollmentForTopic(locals.supabase, user.id, topicSlug);
	if (!enrollment || enrollment.status !== 'active') {
		redirect(303, `/topics/${topicSlug}?enrollment=required`);
	}

	return {
		user,
		content,
		enrollment
	};
}
