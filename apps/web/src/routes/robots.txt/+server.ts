import type { RequestHandler } from './$types';
import { absoluteUrl } from '$lib/seo';

export const GET: RequestHandler = ({ url }) => {
	const body = [
		'User-agent: *',
		'Allow: /',
		'Disallow: /app',
		'Disallow: /admin',
		'Disallow: /auth',
		`Sitemap: ${absoluteUrl('/sitemap.xml', url)}`
	].join('\n');

	return new Response(`${body}\n`, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8'
		}
	});
};
