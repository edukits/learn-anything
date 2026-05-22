<script lang="ts">
	import type { LayoutProps } from './$types';
	import { DailyProgressStrip } from '$lib/features/engagement';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import {
		ChevronDown,
		ClipboardCheck,
		Map,
		Medal,
		RotateCcw,
		Sparkles,
		Trophy,
		TrendingUp
	} from '@lucide/svelte';

	let { data, children }: LayoutProps = $props();
	let activeEnrollments = $derived(
		data.enrollments.filter((enrollment) => enrollment.status === 'active')
	);
	let activeEnrollment = $derived(
		activeEnrollments.find((enrollment) => page.params.topic === enrollment.topic_slug) ??
			activeEnrollments[0] ??
			null
	);
	let activeTopicHref = $derived(
		activeEnrollment ? `/app/topics/${activeEnrollment.topic_slug}` : '/subjects'
	);
	let reviewHref = $derived(activeEnrollment ? `${activeTopicHref}/review` : '/subjects');
</script>

<div class="app-shell">
	<header class="sub-nav-strip">
		<div class="sub-nav layout-content">
			<label class="topic-switcher">
				<span>Topic</span>
				<div>
					<select
						aria-label="Switch active topic"
						value={activeEnrollment?.topic_slug ?? ''}
						onchange={(event) => {
							const topicSlug = event.currentTarget.value;
							if (topicSlug) void goto(`/app/topics/${topicSlug}`);
						}}
					>
						{#if activeEnrollments.length === 0}
							<option value="">Choose topic</option>
						{/if}
						{#each activeEnrollments as enrollment (enrollment.topic_area_id)}
							<option value={enrollment.topic_slug}>{enrollment.topic_name}</option>
						{/each}
					</select>
					<ChevronDown size={16} />
				</div>
			</label>
			<nav aria-label="App navigation">
				<a href={activeTopicHref}><Map size={18} /> Map</a>
				<a href={reviewHref}><RotateCcw size={18} /> Review</a>
				<a href="/app/daily-plan"><Sparkles size={18} /> Daily plan</a>
				<a href="/app/progress"><TrendingUp size={18} /> Progress</a>
				<a href="/app/achievements"><Medal size={18} /> Rewards</a>
				<a href="/app/leaderboard"><Trophy size={18} /> Leaderboard</a>
				{#if data.adminRole}
					<a href="/app/content-admin"><ClipboardCheck size={18} /> Admin</a>
				{/if}
			</nav>
		</div>
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

	.sub-nav-strip {
		background: var(--color-surface);
		border-block-end: 1px solid var(--color-border);
	}

	.sub-nav {
		align-items: center;
		display: flex;
		gap: 24px;
		padding-block: 12px;
	}

	nav a {
		align-items: center;
		display: inline-flex;
		font-weight: 780;
		gap: 8px;
	}

	nav {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		flex: 1;
	}

	.topic-switcher {
		display: grid;
		gap: 2px;
		min-inline-size: 180px;
	}

	.topic-switcher > span {
		color: var(--color-text-muted);
		font-size: 0.72rem;
		font-weight: 780;
		text-transform: uppercase;
	}

	.topic-switcher div {
		align-items: center;
		background: var(--color-surface-raised);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		display: grid;
		grid-template-columns: 1fr auto;
		padding-inline: 10px;
	}

	select {
		appearance: none;
		background: transparent;
		border: 0;
		color: var(--color-text);
		font: inherit;
		font-weight: 760;
		inline-size: 100%;
		min-inline-size: 0;
		padding-block: 7px;
	}

	nav a {
		border-radius: 999px;
		padding: 8px 12px;
	}

	nav a:hover {
		background: var(--color-surface-raised);
	}

	.shell-body {
		padding-block: 28px 48px;
	}

	@media (max-width: 860px) {
		.sub-nav {
			flex-direction: column;
			align-items: stretch;
		}

		nav {
			justify-content: start;
			overflow-x: auto;
			padding-bottom: 4px;
		}
	}
</style>
