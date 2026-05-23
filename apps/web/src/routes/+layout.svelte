<script lang="ts">
	import type { LayoutProps } from './$types';
	import '@learn-anything/tokens/theme.css';
	import '../styles/app.css';
	import { GlobalNav } from '@learn-anything/ui';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import {
		isFocusedQuizRouteId,
		rememberNonFocusedHref
	} from '$lib/features/learning/focusedQuizRoute';

	let { data, children }: LayoutProps = $props();

	let isFocusedQuizRoute = $derived(isFocusedQuizRouteId(page.route.id));

	afterNavigate(({ to }) => {
		rememberNonFocusedHref(to?.url ?? page.url, to?.route.id ?? page.route.id);
	});
</script>

{#if !isFocusedQuizRoute}
	<GlobalNav subjects={data.subjects} user={data.user} currentPathname={page.url.pathname} />
{/if}
{@render children()}
