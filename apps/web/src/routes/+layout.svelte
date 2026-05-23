<script lang="ts">
	import type { LayoutProps } from './$types';
	import '@learn-anything/tokens/theme.css';
	import '../styles/app.css';
	import { GlobalNav } from '@learn-anything/ui';
	import { page } from '$app/state';

	let { data, children }: LayoutProps = $props();
</script>

<GlobalNav subjects={data.subjects} user={data.user} currentPathname={page.url.pathname} />
{@render children()}
