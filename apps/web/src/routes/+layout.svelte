<script lang="ts">
	import type { LayoutProps } from './$types';
	import '@learn-anything/tokens/theme.css';
	import '../styles/app.css';
	import { GlobalNav } from '@learn-anything/ui';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { DEFAULT_DESCRIPTION, HOME_TITLE, SITE_NAME, serializeJsonLdScriptTags } from '$lib/seo';
	import {
		isFocusedQuizRouteId,
		rememberNonFocusedHref
	} from '$lib/features/learning/focusedQuizRoute';

	let { data, children }: LayoutProps = $props();

	let seo = $derived(page.data.seo);
	let isFocusedQuizRoute = $derived(isFocusedQuizRouteId(page.route.id));
	let isSignInRoute = $derived(page.url.pathname === '/sign-in');

	afterNavigate(({ to }) => {
		rememberNonFocusedHref(to?.url ?? page.url, to?.route.id ?? page.route.id);
	});
</script>

<svelte:head>
	<title>{seo?.title ?? HOME_TITLE}</title>
	<meta name="description" content={seo?.description ?? DEFAULT_DESCRIPTION} />
	<meta name="application-name" content={SITE_NAME} />
	<meta name="robots" content={seo?.robots ?? 'index,follow'} />
	<meta name="theme-color" content="#f8fafc" />

	<link rel="icon" href="/favicon.png" type="image/png" />
	<link rel="manifest" href="/site.webmanifest" />
	{#if seo?.canonicalUrl}
		<link rel="canonical" href={seo.canonicalUrl} />
	{/if}

	<meta property="og:site_name" content={SITE_NAME} />
	<meta property="og:title" content={seo?.title ?? HOME_TITLE} />
	<meta property="og:description" content={seo?.description ?? DEFAULT_DESCRIPTION} />
	<meta property="og:type" content={seo?.type ?? 'website'} />
	{#if seo?.canonicalUrl}
		<meta property="og:url" content={seo.canonicalUrl} />
	{/if}

	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content={seo?.title ?? HOME_TITLE} />
	<meta name="twitter:description" content={seo?.description ?? DEFAULT_DESCRIPTION} />

	{@html serializeJsonLdScriptTags(seo?.jsonLd)}
</svelte:head>

{#if !isFocusedQuizRoute && !isSignInRoute}
	<GlobalNav
		subjects={data.subjects}
		user={data.navUser}
		currentPathname={page.url.pathname}
		showAdmin={Boolean(data.adminRole)}
	/>
{/if}
{@render children()}
