<script lang="ts">
	import type { PageProps } from './$types';
	import { Button } from '@learn-anything/ui';
	import { ArrowRight, BookOpen, Clock, Eye, Layers } from '@lucide/svelte';

	let { data }: PageProps = $props();

	let topicHref = $derived(`/topics/${data.topic.slug}`);
</script>

<main class="topic-page">
	<section class="hero page">
		<div class="copy">
			<p class="eyebrow">{data.topic.level_label}</p>
			<h1>{data.topic.name}</h1>
			<p class="lede">{data.topic.public_summary}</p>

			<div class="stats">
				<div class="stat">
					<span class="stat-icon accent"><BookOpen size={16} /></span>
					<div>
						<strong>{data.topic.lesson_count}</strong>
						<span>{data.topic.lesson_count === 1 ? 'Lesson' : 'Lessons'}</span>
					</div>
				</div>
				<div class="stat">
					<span class="stat-icon star"><Layers size={16} /></span>
					<div>
						<strong>{data.topic.quiz_count}</strong>
						<span>{data.topic.quiz_count === 1 ? 'Quiz' : 'Quizzes'}</span>
					</div>
				</div>
				<div class="stat">
					<span class="stat-icon muted-icon"><Clock size={16} /></span>
					<div>
						<strong>{data.topic.estimated_minutes}</strong>
						<span>Minutes</span>
					</div>
				</div>
			</div>

			<div class="button-row">
				{#if data.isSignedIn}
					<form method="POST" action="?/enroll">
						<input type="hidden" name="topicSlug" value={data.topic.slug} />
						<Button type="submit" size="lg">Start or continue <ArrowRight size={18} /></Button>
					</form>
				{:else}
					<Button href="/sign-in" size="lg">Sign in to start <ArrowRight size={18} /></Button>
				{/if}
				<Button href={`${topicHref}/preview`} variant="ghost" size="lg">
					<Eye size={18} /> Preview
				</Button>
			</div>
		</div>
	</section>

	<section class="skills-section page" aria-label="Skills covered">
		<h2>Skills you'll build</h2>
		<div class="skills">
			{#each data.topic.covered_skill_labels as skill (skill)}
				<span class="skill">{skill}</span>
			{/each}
		</div>
	</section>
</main>

<style>
	.topic-page {
		padding-block: 48px 72px;
	}

	.hero {
		display: grid;
		gap: 22px;
	}

	.copy {
		display: grid;
		gap: 18px;
		max-inline-size: 720px;
	}

	h1,
	h2,
	p {
		margin: 0;
	}

	h1 {
		font-size: clamp(2.8rem, 7vw, 5.6rem);
		letter-spacing: -0.02em;
		line-height: 0.95;
	}

	.lede {
		color: var(--color-text-muted);
		font-size: clamp(1.05rem, 1.4vw, 1.15rem);
		max-inline-size: 56ch;
	}

	.stats {
		display: flex;
		flex-wrap: wrap;
		gap: 24px;
		margin-block: 6px;
	}

	.stat {
		align-items: center;
		display: flex;
		gap: 12px;
	}

	.stat-icon {
		align-items: center;
		block-size: 40px;
		border-radius: var(--radius-md);
		display: inline-flex;
		flex-shrink: 0;
		inline-size: 40px;
		justify-content: center;
		position: relative;
		overflow: hidden;
	}

	.stat-icon::after {
		background: linear-gradient(
			135deg,
			rgb(255 255 255 / 0.3) 0%,
			rgb(255 255 255 / 0) 50%
		);
		content: '';
		inset: 0;
		pointer-events: none;
		position: absolute;
	}

	.stat-icon.accent {
		background: linear-gradient(
			to bottom,
			hsl(var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) + 4%)),
			hsl(var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) - 6%))
		);
		box-shadow:
			0 1px 0 inset
				hsl(var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) + 14%)),
			0 1px 3px hsl(var(--color-accent-h) 30% 40% / 0.15);
		color: var(--color-accent-contrast);
	}

	.stat-icon.star {
		background: linear-gradient(
			to bottom,
			hsl(var(--color-star-h) var(--color-star-s) calc(var(--color-star-l) + 6%)),
			hsl(var(--color-star-h) var(--color-star-s) calc(var(--color-star-l) - 4%))
		);
		box-shadow:
			0 1px 0 inset
				hsl(var(--color-star-h) var(--color-star-s) calc(var(--color-star-l) + 16%)),
			0 1px 3px hsl(var(--color-star-h) 30% 40% / 0.15);
		color: #fff;
	}

	.stat-icon.muted-icon {
		background: linear-gradient(to bottom, var(--color-surface-raised), var(--color-surface-hover));
		border: 1px solid var(--color-border);
		box-shadow: 0 1px 0 inset rgb(255 255 255 / 0.6);
		color: var(--color-text-muted);
	}

	.stat div {
		display: grid;
		gap: 1px;
	}

	.stat strong {
		font-family: var(--font-display);
		font-size: 1.4rem;
		font-weight: 600;
		line-height: 1.1;
	}

	.stat div > span {
		color: var(--color-text-muted);
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	form {
		display: contents;
	}

	.button-row {
		margin-block-start: 4px;
	}

	.skills-section {
		border-block-start: 1px dashed var(--color-border);
		display: grid;
		gap: 14px;
		margin-block-start: 48px;
		padding-block-start: 32px;
	}

	h2 {
		font-size: 0.82rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.skills {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.skill {
		background: color-mix(in srgb, var(--color-accent), transparent 90%);
		border: 1px solid color-mix(in srgb, var(--color-accent), transparent 72%);
		border-radius: var(--radius-pill);
		color: hsl(var(--color-accent-h) 50% 32%);
		font-size: 0.88rem;
		font-weight: 600;
		padding: 6px 14px;
	}
</style>
