import type { RequestHandler } from './$types';
import type { SubjectSummary, TopicDiscoveryMetadata } from '$lib/features/catalog';
import { listPublicTopics, listSubjects } from '$lib/features/catalog/server/index.server';
import { absoluteUrl } from '$lib/seo';

function escapeXml(value: string) {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

function urlEntry(location: string) {
	return `<url><loc>${escapeXml(location)}</loc></url>`;
}

export const GET: RequestHandler = async ({ locals, url }) => {
	let subjects: SubjectSummary[] = [];
	let topics: TopicDiscoveryMetadata[] = [];

	try {
		[subjects, topics] = await Promise.all([
			listSubjects(locals.supabase),
			listPublicTopics(locals.supabase)
		]);
	} catch {
		// Keep the sitemap reachable during local setup or transient catalogue outages.
	}

	const paths = [
		'/',
		'/subjects',
		...subjects.map((subject) => `/subjects/${subject.slug}`),
		'/topics',
		...topics.flatMap((topic) => [`/topics/${topic.slug}`, `/topics/${topic.slug}/preview`])
	];
	const uniquePaths = [...new Set(paths)];
	const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${uniquePaths
		.map((path) => `\t${urlEntry(absoluteUrl(path, url))}`)
		.join('\n')}\n</urlset>\n`;

	return new Response(body, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8'
		}
	});
};
