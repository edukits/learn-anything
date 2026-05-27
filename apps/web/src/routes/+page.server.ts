import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { listPublicTopics } from '$lib/features/catalog/server/index.server';
import { absoluteUrl, buildSeo, courseJsonLd, siteJsonLd } from '$lib/seo';

export const load: PageServerLoad = async ({ locals, parent, url }) => {
	const { user } = await parent();
	const topic = (await listPublicTopics(locals.supabase))[0];
	if (!topic) {
		error(404, 'No public topics are available yet.');
	}

	return {
		topic,
		isSignedIn: Boolean(user),
		seo: buildSeo({
			url,
			home: true,
			jsonLd: [
				...siteJsonLd(url),
				courseJsonLd({
					name: topic.name,
					description: topic.public_summary,
					url: absoluteUrl(`/topics/${topic.slug}`, url),
					providerUrl: absoluteUrl('/', url),
					skills: topic.covered_skill_labels
				})
			]
		})
	};
};
