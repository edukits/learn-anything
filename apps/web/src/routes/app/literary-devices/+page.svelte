<script lang="ts">
	import { PageHeader } from '$lib/features/literary-devices';
	import { PathMap } from '@learn-anything/ui';
	import type { PathMapItem } from '@learn-anything/ui';

	let { data } = $props();

	let quizLocked = $derived(!data.progress.intro_lesson_completed);
	let progressPercent = $derived(
		(data.progress.intro_lesson_completed ? 50 : 0) + (data.progress.quiz_completed ? 50 : 0)
	);
	let pathItems: PathMapItem[] = $derived([
		{
			id: 'intro-lesson',
			title: data.lesson.title,
			meta: data.progress.intro_lesson_completed
				? 'Completed'
				: `${data.lesson.estimated_minutes} min lesson`,
			href: '/app/literary-devices/intro',
			state: data.progress.intro_lesson_completed ? 'complete' : 'active',
			kind: 'lesson'
		},
		{
			id: 'mixed-practice',
			title: data.quiz.title,
			meta: quizLocked
				? 'Complete the intro lesson to unlock'
				: data.progress.quiz_completed
					? `Best score ${Math.round(data.progress.best_score ?? 0)}%`
					: `${data.quiz.question_count} questions`,
			href: quizLocked ? undefined : '/app/literary-devices/quiz',
			state: quizLocked ? 'locked' : data.progress.quiz_completed ? 'complete' : 'available',
			kind: 'quiz'
		}
	]);
</script>

<main class="page stack">
	<section class="map-row">
		<div class="map-heading">
			<PageHeader eyebrow="English" title="Literary Devices" description={data.lesson.summary} />
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
