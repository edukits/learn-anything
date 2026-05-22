<script lang="ts">
	import type { PageProps } from './$types';
	import { PageHeader } from '$lib/features/learning';
	import { PathMap } from '@learn-anything/ui';
	import type { PathMapItem } from '@learn-anything/ui';

	let { data }: PageProps = $props();
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
</script>

<main class="page stack">
	<section class="map-row">
		<div class="map-heading">
			<PageHeader eyebrow={data.topic.level_label} title={data.path.title} description={data.path.summary} />
			<div class="progress">
				<strong>{progressPercent}%</strong>
				<span>path progress</span>
				<div aria-hidden="true"><span style:width={`${progressPercent}%`}></span></div>
			</div>
		</div>

		<PathMap items={pathItems} ariaLabel={`${data.topic.name} learning path`} />
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
						<meter
							min="0"
							max="1"
							value={mastery.mastery_score}
							aria-label={`${skill.name} mastery`}
						></meter>
					</div>
				{/if}
			</article>
		{/each}
	</section>
</main>

<style>
	.map-row {
		align-items: start;
		display: grid;
		gap: clamp(20px, 10vw, 75px);
		grid-template-columns: minmax(220px, 380px) minmax(0, 1fr);
		margin: 2rem 0;
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

	.progress div {
		background: var(--color-border);
		border-radius: 999px;
		block-size: 10px;
		overflow: hidden;
	}

	.progress div span {
		background: var(--color-accent);
		block-size: 100%;
		display: block;
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

	meter {
		inline-size: 100%;
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
