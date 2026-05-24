<script lang="ts">
	import type { PageProps } from './$types';
	import { PageHeader } from '$lib/features/learning';
	import mountainImage from '$lib/assets/topic-map/mountain-image.jpeg';
	import {
		AchievementCelebrationDialog,
		Button,
		NextAchievementStatus,
		PathMap,
		ProgressBar,
		type AchievementCelebrationItem
	} from '@learn-anything/ui';
	import type { PathMapItem } from '@learn-anything/ui';
	import {
		toAchievementCardData,
		toAchievementCelebrationItem
	} from '$lib/features/engagement/achievement-ui';

	let { data, form }: PageProps = $props();
	let topicBaseHref = $derived(`/app/topics/${data.topic.slug}`);

	let completedCount = $derived(
		data.pathProgress.filter((item) => item.state === 'completed' || item.state === 'review').length
	);
	let progressPercent = $derived(
		data.pathProgress.length === 0 ? 0 : Math.round((completedCount / data.pathProgress.length) * 100)
	);
	let masteryBySkill = $derived(
		new Map(data.mastery.map((projection) => [projection.skill_id, projection]))
	);
	let pathItems: PathMapItem[] = $derived(
		[
			...data.pathProgress.map((item) => ({
				id: item.id,
				title: item.title,
				description: item.item_type === 'lesson' ? item.summary : item.description,
				meta:
					item.item_type === 'lesson'
						? item.state === 'completed'
							? 'Completed'
							: `${item.estimated_minutes} min lesson`
						: item.total_attempts > 0
							? `Best score ${Math.round(item.best_score ?? 0)}%`
							: `${item.question_count} questions`,
				href:
					item.state === 'locked'
						? undefined
						: item.item_type === 'lesson'
							? `${topicBaseHref}/lesson/${item.item_id}`
							: `${topicBaseHref}/quiz/${item.item_id}`,
				state: item.state,
				kind: item.item_type
			})),
			...(data.reviewSummary.available
				? [
						{
							id: 'adaptive-review',
							title: 'Adaptive review',
							description: data.reviewSummary.reason_labels.join(' · '),
							meta: `${data.reviewSummary.question_count} questions`,
							href: `${topicBaseHref}/review`,
							state: 'review' as const,
							kind: 'review' as const
						}
					]
				: [])
		]
	);
	let nextAchievement = $derived(data.achievements.find((achievement) => !achievement.earned_at) ?? null);
	let celebrationAchievements = $derived(
		data.pendingAchievementCelebrations.map(toAchievementCelebrationItem)
	);
</script>

<main class="page stack">
	{#snippet dismissCelebrationAction(achievements: AchievementCelebrationItem[])}
		<form method="POST" action="?/dismissAchievementCelebrations" class="celebration-action-form">
			{#each achievements as achievement (achievement.eventId)}
				<input type="hidden" name="eventId" value={achievement.eventId} />
			{/each}
			<Button type="submit" size="sm" label="Continue learning" />
		</form>
	{/snippet}

	<AchievementCelebrationDialog
		open={celebrationAchievements.length > 0}
		achievements={celebrationAchievements}
		dismissAction={dismissCelebrationAction}
	/>

	{#if form?.celebrationError}
		<p class="celebration-error" role="alert">{form.celebrationError}</p>
	{/if}

	<section class="map-section" style:--topic-map-background={`url(${mountainImage})`}>
		<div class="topic-map-background" aria-hidden="true"></div>
		<div class="heading-backdrop" aria-hidden="true"></div>

		<div class="map-row">
			<div class="map-heading">
				<PageHeader
					eyebrow={data.topic.level_label}
					title={data.path.title}
					description={data.path.summary}
				/>
				<div class="progress">
					<strong>{progressPercent}%</strong>
					<span>path progress</span>
					<ProgressBar
						value={progressPercent}
						size="sm"
						aria-label={`${data.topic.name} path progress`}
						disableSparks
					/>
				</div>
				<NextAchievementStatus
					achievement={nextAchievement ? toAchievementCardData(nextAchievement) : null}
					href="/app/achievements"
				/>
			</div>

			<PathMap class="map-path" items={pathItems} ariaLabel={`${data.topic.name} learning path`} />
		</div>
	</section>

	<section class="skills">
		{#each data.skills as skill (skill.skill_id)}
			{@const mastery = masteryBySkill.get(skill.skill_id)}
			<article class="skill">
				<h2>{skill.name}</h2>
				<p>{skill.summary}</p>
				{#if mastery}
					<div class="mastery">
						<span>{Math.round(mastery.mastery_score * 100)}% mastery</span>
						<ProgressBar
							value={mastery.mastery_score}
							max={1}
							size="sm"
							aria-label={`${skill.name} mastery`}
							disableSparks
						/>
					</div>
				{/if}
			</article>
		{/each}
	</section>
</main>

<style>
	.celebration-action-form {
		margin: 0;
	}

	.celebration-error {
		background: color-mix(in srgb, var(--color-danger), transparent 88%);
		border-radius: var(--radius-sm);
		color: var(--color-danger);
		font-size: 0.86rem;
		font-weight: 650;
		margin: 0;
		padding: 10px 12px;
	}

	.map-section {
		display: grid;
		isolation: isolate;
		position: relative;
	}

	.topic-map-background {
		--mountain-height: clamp(9.984rem, 32.166vw, 26.622rem);
		--mountain-width: clamp(18rem, 58vw, 48rem);
		aspect-ratio: 1684 / 934;
		background-image: var(--topic-map-background);
		background-position: left bottom;
		background-repeat: no-repeat;
		background-size: contain;
		block-size: var(--mountain-height);
		filter: saturate(0.92) contrast(1.02);
		grid-area: 1 / 1;
		inline-size: var(--mountain-width);
		justify-self: start;
		margin-inline-start: calc(
			-1 * max(var(--layout-page-gutter), calc((100vw - var(--layout-content-max-inline-size)) / 2))
		);
		-webkit-mask-image: radial-gradient(
			ellipse 110% 95% at 0% 100%,
			#000 0%,
			rgb(0 0 0 / 0.94) 44%,
			rgb(0 0 0 / 0.34) 70%,
			transparent 91%
		);
		mask-image: radial-gradient(
			ellipse 110% 95% at 0% 100%,
			#000 0%,
			rgb(0 0 0 / 0.94) 44%,
			rgb(0 0 0 / 0.34) 70%,
			transparent 91%
		);
		pointer-events: none;
		position: sticky;
		top: calc(100svh - var(--mountain-height) - max(0px, env(safe-area-inset-bottom)));
		z-index: 0;
	}

	.heading-backdrop {
		--backdrop-block-size: min(30rem, calc(100svh - 6rem));
		--backdrop-inline-size: min(52rem, calc(100vw - var(--layout-page-gutter)));
		background: var(--color-canvas);
		block-size: var(--backdrop-block-size);
		grid-area: 1 / 1;
		inline-size: var(--backdrop-inline-size);
		justify-self: start;
		margin-block-start: -5rem;
		margin-inline-start: -12rem;
		-webkit-mask-image: radial-gradient(
			ellipse 54% 54% at 48% 46%,
			#000 0%,
			#000 48%,
			rgb(0 0 0 / 0.85) 58%,
			rgb(0 0 0 / 0.45) 72%,
			rgb(0 0 0 / 0.12) 88%,
			transparent 100%
		);
		mask-image: radial-gradient(
			ellipse 54% 54% at 48% 46%,
			#000 0%,
			#000 48%,
			rgb(0 0 0 / 0.85) 58%,
			rgb(0 0 0 / 0.45) 72%,
			rgb(0 0 0 / 0.12) 88%,
			transparent 100%
		);
		pointer-events: none;
		position: sticky;
		top: 4rem;
		z-index: 1;
	}

	.map-row {
		align-items: start;
		display: grid;
		gap: clamp(20px, 10vw, 75px);
		grid-area: 1 / 1;
		grid-template-columns: minmax(220px, 380px) minmax(0, 1fr);
		margin: 2rem 0;
		position: relative;
		z-index: 1;
	}

	.map-heading {
		display: grid;
		gap: 20px;
		position: sticky;
		top: 5.5rem;
	}

	.progress {
		display: grid;
		gap: 0.2rem;
		min-inline-size: 190px;
	}

	.progress strong {
		font-size: 2rem;
		line-height: 1;
	}

	.progress span {
		color: var(--color-text-muted);
	}

	.skills {
		border-block-start: 1px solid var(--color-border);
		display: grid;
		gap: 24px;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		padding-block-start: 24px;
		margin-block-start: 24px;
	}

	.skill h2 {
		font-size: 1rem;
	}

	.skill p {
		color: var(--color-text-muted);
		font-size: 0.94rem;
		margin-block-start: 6px;
	}

	.mastery {
		display: grid;
		gap: 6px;
		margin-block-start: 10px;
	}

	.mastery span {
		color: var(--color-text-muted);
		font-size: 0.82rem;
		font-weight: 700;
	}

	@media (max-width: 760px) {
		.map-row {
			grid-template-columns: 1fr;
		}

		.map-heading {
			position: static;
		}
	}
</style>
