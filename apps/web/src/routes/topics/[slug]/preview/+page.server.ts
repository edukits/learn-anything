import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { findPublicTopicDiscoveryBySlug } from '$lib/features/catalog/server/index.server';
import { absoluteUrl, buildSeo, breadcrumbJsonLd, courseJsonLd, siteJsonLd } from '$lib/seo';

export const load: PageServerLoad = async ({ locals, parent, params, url }) => {
	const topic = await findPublicTopicDiscoveryBySlug(locals.supabase, params.slug);
	if (!topic) {
		error(404, 'Topic not found');
	}
	const { user } = await parent();
	const topicPath = `/topics/${topic.slug}`;
	const previewPath = `${topicPath}/preview`;
	const previewUrl = absoluteUrl(previewPath, url);

	return {
		topic,
		isSignedIn: Boolean(user),
		seo: buildSeo({
			title: `${topic.name} preview`,
			description: topic.public_summary,
			url,
			path: previewPath,
			type: 'article',
			jsonLd: [
				...siteJsonLd(url),
				courseJsonLd({
					name: topic.name,
					description: topic.public_summary,
					url: absoluteUrl(topicPath, url),
					providerUrl: absoluteUrl('/', url),
					skills: topic.covered_skill_labels
				}),
				breadcrumbJsonLd([
					{ name: 'Learning paths', url: absoluteUrl('/topics', url) },
					{ name: topic.name, url: absoluteUrl(topicPath, url) },
					{ name: 'Preview', url: previewUrl }
				])
			]
		})
	};
};
