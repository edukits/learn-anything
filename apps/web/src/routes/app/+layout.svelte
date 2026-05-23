<script lang="ts">
	import type { LayoutProps } from './$types';
	import { DailyProgressStrip } from '$lib/features/engagement';
	import { LearningNav } from '@learn-anything/ui';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

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
</script>

<div class="app-shell">
	<LearningNav
		topics={navTopics}
		activeTopicSlug={activeEnrollment?.topic_slug ?? ''}
		currentPathname={page.url.pathname}
		showAdmin={Boolean(data.adminRole)}
		onTopicChange={(topicSlug: string) => {
			void goto(`/app/topics/${topicSlug}`);
		}}
	/>

	<DailyProgressStrip engagement={data.engagement} />

	<div class="shell-body">
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
</style>
