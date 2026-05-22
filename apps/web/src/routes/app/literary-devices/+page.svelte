<script lang="ts">
	import type { PageProps } from './$types';
	import { PageHeader } from '$lib/features/literary-devices';
	import { PathMap } from '@learn-anything/ui';
	import type { PathMapItem } from '@learn-anything/ui';

	let { data }: PageProps = $props();

	let completedCount = $derived(
		data.pathProgress.filter((item) => item.state === 'completed' || item.state === 'review').length
	);
	let progressPercent = $derived(
		data.pathProgress.length === 0 ? 0 : Math.round((completedCount / data.pathProgress.length) * 100)
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
							? `/app/literary-devices/lesson/${item.item_id}`
							: `/app/literary-devices/quiz/${item.item_id}`,
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
							href: '/app/literary-devices/review',
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
			<PageHeader eyebrow="English" title={data.path.title} description={data.path.summary} />
			<div class="progress">
				<strong>{progressPercent}%</strong>
				<span>path progress</span>
				<div aria-hidden="true"><span style:width={`${progressPercent}%`}></span></div>
			</div>
		</div>

		<div class="path-map-column">
			<PathMap items={pathItems} ariaLabel="Literary Devices learning path" />
		</div>
	</section>

	<section class="skills">
		{#each data.skills as skill (skill.skill_id)}
			<article class="skill">
				<h2>{skill.name}</h2>
				<p>{skill.summary}</p>
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
	}

	.map-heading {
		display: grid;
		gap: 20px;
		position: sticky;
		top: 5.5rem;
	}

	.path-map-column {
		padding-top: 40px;
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

	@media (max-width: 760px) {
		.map-row {
			grid-template-columns: 1fr;
		}

		.map-heading {
			position: static;
		}
	}
</style>
