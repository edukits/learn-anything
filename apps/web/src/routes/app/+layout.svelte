<script lang="ts">
	import type { LayoutProps } from './$types';
	import { DailyProgressStrip } from '$lib/features/engagement';
	import { LearningNav } from '@learn-anything/ui';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { isFocusedQuizRouteId } from '$lib/features/learning/focusedQuizRoute';

	let { data, children }: LayoutProps = $props();

	let activeEnrollments = $derived(
		data.enrollments.filter((enrollment) => enrollment.status === 'active')
	);

	let activeEnrollment = $derived(
		activeEnrollments.find((enrollment) => page.params.topic === enrollment.topic_slug) ??
			activeEnrollments[0] ??
			null
	);

	let navTopics = $derived(
		activeEnrollments.map((enrollment) => ({
			id: enrollment.topic_area_id,
			slug: enrollment.topic_slug,
			name: enrollment.topic_name
		}))
	);

	let isFocusedQuizRoute = $derived(isFocusedQuizRouteId(page.route.id));
</script>

<div class="app-shell">
	{#if !isFocusedQuizRoute}
		<LearningNav
			topics={navTopics}
			activeTopicSlug={activeEnrollment?.topic_slug ?? ''}
			currentPathname={page.url.pathname}
			onTopicChange={(topicSlug: string) => {
				void goto(`/app/topics/${topicSlug}`);
			}}
		/>

		<DailyProgressStrip engagement={data.engagement} />
	{/if}

	<div class="shell-body" data-focused={isFocusedQuizRoute}>
		{@render children()}
	</div>
</div>

<style>
	.app-shell {
		min-block-size: 100svh;
	}

	.shell-body {
		padding-block: 28px 48px;
	}

	.shell-body[data-focused='true'] {
		padding-block: 0;
	}
</style>
