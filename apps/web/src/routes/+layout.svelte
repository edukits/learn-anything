<script lang="ts">
	import type { LayoutProps } from './$types';
	import '@learn-anything/tokens/theme.css';
	import '../styles/app.css';
	import GlobalNav from '$lib/shared/components/GlobalNav.svelte';

	let { data, children }: LayoutProps = $props();
</script>

<GlobalNav subjects={data.subjects} user={data.user} />
{@render children()}
