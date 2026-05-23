import { error, fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import type { Actions } from './$types';
import type { PageServerLoad } from './$types';
import { ensureTopicEnrollment, findPublicTopicDiscoveryBySlug } from '$lib/features/catalog/server/index.server';
import { requireUser } from '$lib/server/auth/requireUser.server';

const enrollSchema = z.object({
	topicSlug: z.string().min(1)
});

export const load: PageServerLoad = async ({ locals, parent, params }) => {
	const topic = await findPublicTopicDiscoveryBySlug(locals.supabase, params.slug);
	if (!topic) {
		error(404, 'Topic not found');
	}
	const { user } = await parent();

	return {
		topic,
		isSignedIn: Boolean(user)
	};
};

export const actions: Actions = {
	enroll: async ({ request, locals }) => {
		const user = await requireUser(locals);
		const formData = await request.formData();
		const parsed = enrollSchema.safeParse({
			topicSlug: String(formData.get('topicSlug') ?? '')
		});

		if (!parsed.success) {
			return fail(400, { error: 'Choose a topic before enrolling.' });
		}

		const enrollment = await ensureTopicEnrollment(locals.supabaseService, user.id, parsed.data.topicSlug);
		if (!enrollment) {
			return fail(404, { error: 'Topic not found.' });
		}

		throw redirect(303, `/app/topics/${enrollment.topic_slug}`);
	}
};
