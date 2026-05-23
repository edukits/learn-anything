import { error, redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { getEnrollmentForTopic } from '$lib/features/catalog/server/index.server';
import { getTopicContentBySlug } from '$lib/features/learning/server/index.server';

export const load: LayoutServerLoad = async ({ locals, parent, params }) => {
	const { user } = await parent();
	if (!user) {
		throw redirect(303, '/sign-in');
	}

	const content = await getTopicContentBySlug(locals.supabase, params.topic);
	if (!content) {
		error(404, 'Topic not found');
	}

	const enrollment = await getEnrollmentForTopic(locals.supabase, user.id, params.topic);
	if (!enrollment || enrollment.status !== 'active') {
		throw redirect(303, `/topics/${params.topic}?enrollment=required`);
	}

	return {
		content,
		user,
		topic: content.topic,
		enrollment
	};
};
