import type { PageServerLoad } from './$types';
import { absoluteUrl, buildSeo, collectionPageJsonLd, itemListJsonLd, siteJsonLd } from '$lib/seo';

const description = 'Browse subjects and choose a structured learning path to preview or start.';

export const load: PageServerLoad = async ({ parent, url }) => {
	const { subjects } = await parent();
	const pageUrl = absoluteUrl('/subjects', url);

	return {
		seo: buildSeo({
			title: 'Browse subjects',
			description,
			url,
			path: '/subjects',
			jsonLd: [
				...siteJsonLd(url),
				collectionPageJsonLd('Browse subjects', description, pageUrl),
				itemListJsonLd(
					'Subjects',
					subjects.map((subject) => ({
						name: subject.name,
						description: subject.summary,
						url: absoluteUrl(`/subjects/${subject.slug}`, url)
					}))
				)
			]
		})
	};
};
