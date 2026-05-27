import { env as publicEnv } from '$env/dynamic/public';

export const SITE_NAME = 'Clarifyst';
export const DEFAULT_DESCRIPTION =
	'Master any topic with structured paths, spaced repetition, and AI-guided practice.';
export const HOME_TITLE = 'Clarifyst | Master any topic with structured learning paths';

type JsonLdPrimitive = string | number | boolean | null;
export type JsonLdValue = JsonLdPrimitive | JsonLdValue[] | { [key: string]: JsonLdValue };
export type JsonLdObject = { [key: string]: JsonLdValue };

export type SeoMetadata = {
	title: string;
	description: string;
	canonicalUrl?: string;
	robots: 'index,follow' | 'noindex,nofollow';
	type: 'website' | 'article';
	jsonLd?: JsonLdObject[];
};

export type SeoInput = {
	title?: string;
	description?: string;
	url: URL;
	path?: string;
	noindex?: boolean;
	type?: SeoMetadata['type'];
	jsonLd?: JsonLdObject[];
	home?: boolean;
};

function stripTrailingSlash(value: string) {
	return value.replace(/\/+$/, '');
}

export function getSiteOrigin(url: URL) {
	const configured = publicEnv.PUBLIC_SITE_URL?.trim();
	if (!configured) return url.origin;

	try {
		const parsed = new URL(configured);
		return stripTrailingSlash(parsed.origin);
	} catch {
		return url.origin;
	}
}

export function absoluteUrl(path: string, url: URL) {
	const origin = getSiteOrigin(url);
	return new URL(path, `${origin}/`).toString();
}

export function formatTitle(title?: string, home = false) {
	if (home) return HOME_TITLE;
	if (!title || title === SITE_NAME) return SITE_NAME;
	return `${title} | ${SITE_NAME}`;
}

export function buildSeo({
	title,
	description = DEFAULT_DESCRIPTION,
	url,
	path,
	noindex = false,
	type = 'website',
	jsonLd = [],
	home = false
}: SeoInput): SeoMetadata {
	const canonicalPath = path ?? url.pathname;

	return {
		title: formatTitle(title, home),
		description,
		canonicalUrl: noindex ? undefined : absoluteUrl(canonicalPath, url),
		robots: noindex ? 'noindex,nofollow' : 'index,follow',
		type,
		jsonLd: noindex ? [] : jsonLd
	};
}

export function noindexSeo(title: string, url: URL, description = DEFAULT_DESCRIPTION) {
	return buildSeo({ title, url, description, noindex: true });
}

export function siteJsonLd(url: URL): JsonLdObject[] {
	const origin = getSiteOrigin(url);
	const siteUrl = `${origin}/`;

	return [
		{
			'@context': 'https://schema.org',
			'@type': 'Organization',
			name: SITE_NAME,
			url: siteUrl
		},
		{
			'@context': 'https://schema.org',
			'@type': 'WebSite',
			name: SITE_NAME,
			url: siteUrl,
			description: DEFAULT_DESCRIPTION
		}
	];
}

export function itemListJsonLd(
	name: string,
	items: Array<{ name: string; url: string; description?: string }>
): JsonLdObject {
	return {
		'@context': 'https://schema.org',
		'@type': 'ItemList',
		name,
		itemListElement: items.map((item, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			url: item.url,
			name: item.name,
			description: item.description ?? ''
		}))
	};
}

export function collectionPageJsonLd(name: string, description: string, url: string): JsonLdObject {
	return {
		'@context': 'https://schema.org',
		'@type': 'CollectionPage',
		name,
		description,
		url
	};
}

export function breadcrumbJsonLd(items: Array<{ name: string; url: string }>): JsonLdObject {
	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: items.map((item, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: item.name,
			item: item.url
		}))
	};
}

export function courseJsonLd(input: {
	name: string;
	description: string;
	url: string;
	providerUrl: string;
	skills: string[];
}): JsonLdObject {
	return {
		'@context': 'https://schema.org',
		'@type': 'Course',
		name: input.name,
		description: input.description,
		url: input.url,
		provider: {
			'@type': 'Organization',
			name: SITE_NAME,
			url: input.providerUrl
		},
		teaches: input.skills
	};
}

export function serializeJsonLdScriptTags(jsonLd: JsonLdObject[] = []) {
	return jsonLd
		.map(
			(item) =>
				`<script type="application/ld+json">${JSON.stringify(item)
					.replace(/</g, '\\u003c')
					.replace(/\u2028/g, '\\u2028')
					.replace(/\u2029/g, '\\u2029')}</script>`
		)
		.join('');
}
