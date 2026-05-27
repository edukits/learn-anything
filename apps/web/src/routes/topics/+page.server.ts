import type { PageServerLoad } from './$types';
import { listPublicTopics } from '$lib/features/catalog/server/index.server';
import { absoluteUrl, buildSeo, collectionPageJsonLd, itemListJsonLd, siteJsonLd } from '$lib/seo';

const description =
	'Browse structured learning paths with previews, quizzes, and progress tracking.';

export const load: PageServerLoad = async ({ locals, parent, url }) => {
	const topics = await listPublicTopics(locals.supabase);
	const { user } = await parent();
	const pageUrl = absoluteUrl('/topics', url);

	return {
		topics,
		isSignedIn: Boolean(user),
		seo: buildSeo({
			title: 'Learning paths',
			description,
			url,
			path: '/topics',
			jsonLd: [
				...siteJsonLd(url),
				collectionPageJsonLd('Learning paths', description, pageUrl),
				itemListJsonLd(
					'Learning paths',
					topics.map((topic) => ({
						name: topic.name,
						description: topic.public_summary,
						url: absoluteUrl(`/topics/${topic.slug}`, url)
					}))
				)
			]
		})
	};
};
