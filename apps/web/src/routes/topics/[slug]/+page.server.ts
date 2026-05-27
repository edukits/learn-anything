import { error, fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import type { Actions } from './$types';
import type { PageServerLoad } from './$types';
import {
	ensureTopicEnrollment,
	findPublicTopicDiscoveryBySlug
} from '$lib/features/catalog/server/index.server';
import { requireUser } from '$lib/server/auth/requireUser.server';
import { absoluteUrl, buildSeo, breadcrumbJsonLd, courseJsonLd, siteJsonLd } from '$lib/seo';

const enrollSchema = z.object({
	topicSlug: z.string().min(1)
});

export const load: PageServerLoad = async ({ locals, parent, params, url }) => {
	const topic = await findPublicTopicDiscoveryBySlug(locals.supabase, params.slug);
	if (!topic) {
		error(404, 'Topic not found');
	}
	const { user } = await parent();
	const topicPath = `/topics/${topic.slug}`;
	const topicUrl = absoluteUrl(topicPath, url);

	return {
		topic,
		isSignedIn: Boolean(user),
		seo: buildSeo({
			title: topic.name,
			description: topic.public_summary,
			url,
			path: topicPath,
			type: 'article',
			jsonLd: [
				...siteJsonLd(url),
				courseJsonLd({
					name: topic.name,
					description: topic.public_summary,
					url: topicUrl,
					providerUrl: absoluteUrl('/', url),
					skills: topic.covered_skill_labels
				}),
				breadcrumbJsonLd([
					{ name: 'Learning paths', url: absoluteUrl('/topics', url) },
					{ name: topic.name, url: topicUrl }
				])
			]
		})
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

		const enrollment = await ensureTopicEnrollment(
			locals.supabaseService,
			user.id,
			parsed.data.topicSlug
		);
		if (!enrollment) {
			return fail(404, { error: 'Topic not found.' });
		}

		throw redirect(303, `/app/topics/${enrollment.topic_slug}`);
	}
};
