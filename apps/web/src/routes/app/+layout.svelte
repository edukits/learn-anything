<script lang="ts">
	import type { LayoutProps } from './$types';
	import { DailyProgressStrip } from '$lib/features/literary-devices';
	import { Button } from '@learn-anything/ui';
	import { BookOpenCheck, Map, RotateCcw, TrendingUp } from '@lucide/svelte';

	let { data, children }: LayoutProps = $props();
</script>

<div class="app-shell">
	<header>
		<a class="brand" href="/app"><BookOpenCheck size={22} /> Learn Anything</a>
		<span class="topic-name">Literary Devices</span>
		<nav aria-label="App navigation">
			<a href="/app/literary-devices"><Map size={18} /> Map</a>
			<a href="/app/literary-devices/review"><RotateCcw size={18} /> Review</a>
			<a href="/app/progress"><TrendingUp size={18} /> Progress</a>
		</nav>
		<form method="POST" action="/app/logout">
			<span>{data.user.email}</span>
			<Button variant="ghost" size="sm" type="submit" label="Log out" />
		</form>
	</header>

	<DailyProgressStrip engagement={data.engagement} />

	<div class="shell-body">
		{@render children()}
	</div>
</div>

<style>
	.app-shell {
		min-block-size: 100svh;
	}

	header {
		align-items: center;
		background: var(--color-surface);
		border-block-end: 1px solid var(--color-border);
		display: grid;
		gap: 14px;
		grid-template-columns: minmax(180px, 1fr) auto auto minmax(220px, 1fr);
		padding: 12px clamp(16px, 4vw, 36px);
		position: sticky;
		top: 0;
		z-index: 10;
	}

	.brand,
	nav a {
		align-items: center;
		display: inline-flex;
		font-weight: 780;
		gap: 8px;
	}

	.topic-name {
		color: var(--color-text-muted);
		font-size: 0.92rem;
		font-weight: 760;
		white-space: nowrap;
	}

	nav {
		display: flex;
		gap: 10px;
		justify-content: center;
	}

	nav a {
		border-radius: 999px;
		padding: 8px 12px;
	}

	nav a:hover {
		background: var(--color-surface-raised);
	}

	form {
		align-items: center;
		display: flex;
		gap: 10px;
		justify-content: end;
	}

	form span {
		color: var(--color-text-muted);
		font-size: 0.9rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.shell-body {
		padding-block: 28px 48px;
	}

	@media (max-width: 860px) {
		header {
			grid-template-columns: 1fr;
		}

		nav,
		form {
			justify-content: start;
		}
	}
</style>
