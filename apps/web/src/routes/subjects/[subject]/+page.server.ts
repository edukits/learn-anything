import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getSubjectBySlug } from '$lib/features/catalog/server/index.server';
import {
	absoluteUrl,
	buildSeo,
	breadcrumbJsonLd,
	collectionPageJsonLd,
	itemListJsonLd,
	siteJsonLd
} from '$lib/seo';

export const load: PageServerLoad = async ({ locals, params, parent, url }) => {
	const result = await getSubjectBySlug(locals.supabase, params.subject);
	if (!result) {
		error(404, 'Subject not found');
	}
	const { user } = await parent();
	const subjectPath = `/subjects/${result.subject.slug}`;
	const subjectUrl = absoluteUrl(subjectPath, url);

	return {
		...result,
		isSignedIn: Boolean(user),
		seo: buildSeo({
			title: result.subject.name,
			description: result.subject.summary,
			url,
			path: subjectPath,
			jsonLd: [
				...siteJsonLd(url),
				collectionPageJsonLd(result.subject.name, result.subject.summary, subjectUrl),
				itemListJsonLd(
					`${result.subject.name} learning paths`,
					result.topics.map((topic) => ({
						name: topic.name,
						description: topic.public_summary,
						url: absoluteUrl(`/topics/${topic.slug}`, url)
					}))
				),
				breadcrumbJsonLd([
					{ name: 'Subjects', url: absoluteUrl('/subjects', url) },
					{ name: result.subject.name, url: subjectUrl }
				])
			]
		})
	};
};
