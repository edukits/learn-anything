import type { RequestHandler } from './$types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { SubjectSummary, TopicDiscoveryMetadata } from '$lib/features/catalog';
import { listPublicTopics, listSubjects } from '$lib/features/catalog/server/index.server';
import { absoluteUrl } from '$lib/seo';

const STATIC_SITEMAP_PATHS = ['/', '/subjects', '/topics'];
const CATALOGUE_CACHE_TTL_MS = 60 * 60 * 1000;
const CACHE_CONTROL = 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400';

let cachedCataloguePaths: { paths: string[]; expiresAt: number } | null = null;
let cataloguePathsPromise: Promise<string[]> | null = null;

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

function buildCataloguePaths(subjects: SubjectSummary[], topics: TopicDiscoveryMetadata[]) {
	return [
		'/subjects',
		...subjects.map((subject) => `/subjects/${subject.slug}`),
		'/topics',
		...topics.flatMap((topic) => [`/topics/${topic.slug}`, `/topics/${topic.slug}/preview`])
	];
}

async function loadCataloguePaths(client: SupabaseClient) {
	const now = Date.now();
	if (cachedCataloguePaths && cachedCataloguePaths.expiresAt > now) {
		return cachedCataloguePaths.paths;
	}

	cataloguePathsPromise ??= Promise.all([listSubjects(client), listPublicTopics(client)])
		.then(([subjects, topics]) => {
			const paths = buildCataloguePaths(subjects, topics);
			cachedCataloguePaths = { paths, expiresAt: Date.now() + CATALOGUE_CACHE_TTL_MS };
			return paths;
		})
		.finally(() => {
			cataloguePathsPromise = null;
		});

	return cataloguePathsPromise;
}

export const GET: RequestHandler = async ({ locals, url }) => {
	let sitemapCataloguePaths = cachedCataloguePaths?.paths ?? STATIC_SITEMAP_PATHS.slice(1);

	try {
		sitemapCataloguePaths = await loadCataloguePaths(locals.supabase);
	} catch (error) {
		// Keep the sitemap reachable during local setup or transient catalogue outages.
		// eslint-disable-next-line no-console -- This fallback must remain visible in production logs.
		console.warn(
			'Unable to load catalogue URLs for sitemap; serving cached or static sitemap fallback.',
			error
		);
	}

	const paths = ['/', ...sitemapCataloguePaths];
	const uniquePaths = [...new Set(paths)];
	const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${uniquePaths
		.map((path) => `\t${urlEntry(absoluteUrl(path, url))}`)
		.join('\n')}\n</urlset>\n`;

	return new Response(body, {
		headers: {
			'Cache-Control': CACHE_CONTROL,
			'Content-Type': 'application/xml; charset=utf-8'
		}
	});
};
