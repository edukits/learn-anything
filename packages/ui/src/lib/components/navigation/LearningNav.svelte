<script lang="ts">
	import {
		Map,
		Medal,
		RotateCcw,
		Sparkles,
		Trophy,
		TrendingUp
	} from '@lucide/svelte';
	import NavLink from './NavLink.svelte';
	import NavStrip from './NavStrip.svelte';
	import TopicSelector from './TopicSelector.svelte';
	import type { LearningNavItem, NavTopic } from './types';

	let {
		topics = [],
		activeTopicSlug = '',
		currentPathname = '',
		onTopicChange,
		class: className = ''
	}: {
		topics?: NavTopic[];
		activeTopicSlug?: string;
		currentPathname?: string;
		onTopicChange?: (slug: string) => void;
		class?: string;
	} = $props();

	let topicBaseHref = $derived(
		activeTopicSlug ? `/app/topics/${activeTopicSlug}` : '/subjects'
	);

	let navItems = $derived.by((): LearningNavItem[] => {
		const reviewPrefix = `${topicBaseHref}/review`;

		return [
			{
				id: 'map',
				label: 'Map',
				href: topicBaseHref,
				icon: Map,
				isActive: (pathname) =>
					pathname === topicBaseHref ||
					(pathname.startsWith(`${topicBaseHref}/`) && !pathname.startsWith(reviewPrefix))
			},
			{
				id: 'review',
				label: 'Review',
				href: `${topicBaseHref}/review`,
				icon: RotateCcw,
				isActive: (pathname) => pathname.startsWith(`${topicBaseHref}/review`)
			},
			{
				id: 'daily-plan',
				label: 'Daily plan',
				href: '/app/daily-plan',
				icon: Sparkles,
				isActive: (pathname) => pathname.startsWith('/app/daily-plan')
			},
			{
				id: 'progress',
				label: 'Progress',
				href: '/app/progress',
				icon: TrendingUp,
				isActive: (pathname) => pathname.startsWith('/app/progress')
			},
			{
				id: 'achievements',
				label: 'Rewards',
				href: '/app/achievements',
				icon: Medal,
				isActive: (pathname) => pathname.startsWith('/app/achievements')
			},
			{
				id: 'leaderboard',
				label: 'Leaderboard',
				href: '/app/leaderboard',
				icon: Trophy,
				isActive: (pathname) => pathname.startsWith('/app/leaderboard')
			}
		];
	});
</script>

{#snippet navItem(item: LearningNavItem)}
	{@const Icon = item.icon}
	<NavLink
		href={item.href}
		variant="learning"
		current={item.isActive(currentPathname)}
	>
		<span class="nav-item-icon" aria-hidden="true">
			<Icon size={16} strokeWidth={2.25} />
		</span>
		{item.label}
	</NavLink>
{/snippet}

<NavStrip tone="learning" class={className}>
	<div class="learning-nav">
		<TopicSelector
			topics={topics}
			value={activeTopicSlug}
			disabled={topics.length === 0}
			onchange={onTopicChange}
		/>

		<nav aria-label="Learning navigation" class="learning-links">
			{#each navItems as item (item.id)}
				{@render navItem(item)}
			{/each}
		</nav>
	</div>
</NavStrip>

<style>
	.learning-nav {
		align-items: center;
		display: flex;
		gap: var(--space-6);
		inline-size: min(
			var(--layout-content-max-inline-size, 72rem),
			calc(100% - (var(--layout-page-gutter, 1.25rem) * 2))
		);
		margin-inline: auto;
		padding-block: var(--space-3);
	}

	.learning-links {
		align-items: center;
		display: flex;
		flex: 1;
		flex-wrap: wrap;
		gap: var(--space-2);
		min-inline-size: 0;
	}

	.nav-item-icon {
		display: inline-flex;
	}

	@media (max-width: 860px) {
		.learning-nav {
			align-items: stretch;
			flex-direction: column;
			gap: var(--space-3);
		}

		.learning-links {
			flex-wrap: nowrap;
			overflow-x: auto;
			padding-block-end: var(--space-1);
			scrollbar-width: thin;
		}
	}
</style>
