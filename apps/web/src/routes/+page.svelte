<script lang="ts">
	import type { PageProps } from './$types';
	import { Button } from '@learn-anything/ui';
	import { ArrowRight, BookOpen, Clock, Layers, Trophy } from '@lucide/svelte';
	import { pluralize } from '$lib/shared/utils/format';

	let { data }: PageProps = $props();

	let ctaHref = $derived(data.isSignedIn ? data.topic.app_path : '/sign-in');
	let ctaLabel = $derived(data.isSignedIn ? 'Open path' : 'Start learning');

	let steps = $derived([
		{
			icon: BookOpen,
			label: pluralize(data.topic.lesson_count, 'lesson'),
			detail: 'Concept-first, paced for mastery'
		},
		{
			icon: Trophy,
			label: pluralize(data.topic.quiz_count, 'quiz', 'quizzes'),
			detail: 'Practice to lock it in'
		}
	]);
</script>

<main class="home page">
	<section class="hero">
		<div class="hero-copy">
			<p class="eyebrow">{data.topic.level_label}</p>
			<h1>{data.topic.name}</h1>
			<p class="lede">{data.topic.public_summary}</p>

			<div class="fact-inline">
				<span><Clock size={16} /> {data.topic.estimated_minutes} min</span>
				<span><Layers size={16} /> {data.topic.covered_skill_labels.length} skills</span>
			</div>

			<div class="button-row">
				<Button href={ctaHref} size="lg">{ctaLabel} <ArrowRight size={18} /></Button>
				<Button
					href={`/topics/${data.topic.slug}/preview`}
					variant="ghost"
					size="lg"
					label="Preview"
				/>
			</div>
		</div>

		<ol class="journey" aria-label="{data.topic.name} path overview">
			{#each steps as step, i (step.label)}
				<li class="step">
					<div class="step-icon" style:--step-delay="{i * 80}ms">
						<step.icon size={20} strokeWidth={2.25} />
					</div>
					{#if i < steps.length - 1}
						<div class="step-connector" aria-hidden="true"></div>
					{/if}
					<div class="step-body">
						<strong>{step.label}</strong>
						<span>{step.detail}</span>
					</div>
				</li>
			{/each}
		</ol>
	</section>
</main>

<style>
	.home {
		padding-block: clamp(48px, 8vw, 96px) clamp(48px, 8vw, 80px);
	}

	.hero {
		align-items: center;
		animation: fade-up 500ms cubic-bezier(0.22, 1, 0.36, 1) both;
		display: grid;
		gap: clamp(36px, 6vw, 72px);
		grid-template-columns: minmax(0, 1.15fr) minmax(240px, 0.85fr);
		min-block-size: calc(100svh - 160px);
	}

	@keyframes fade-up {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
	}

	.hero-copy {
		display: grid;
		gap: 18px;
	}

	h1 {
		font-size: clamp(3rem, 7.5vw, 7rem);
		letter-spacing: -0.02em;
		line-height: 0.92;
		margin: 0;
	}

	.lede {
		color: var(--color-text-muted);
		font-size: clamp(1.05rem, 1.4vw, 1.2rem);
		margin: 0;
		max-inline-size: 52ch;
	}

	.journey {
		display: grid;
		gap: 0;
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.step {
		display: grid;
		gap: 14px;
		grid-template-columns: 48px 1fr;
		grid-template-rows: auto auto;
		position: relative;
	}

	.step-icon {
		align-items: center;
		animation: fade-up 400ms cubic-bezier(0.22, 1, 0.36, 1) both;
		animation-delay: calc(200ms + var(--step-delay, 0ms));
		background: linear-gradient(
			to bottom,
			hsl(var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) + 4%)),
			hsl(var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) - 8%))
		);
		block-size: 48px;
		border: 1px solid
			hsl(var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) - 16%));
		border-radius: var(--radius-lg);
		box-shadow:
			0 1px 0 inset
				hsl(var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) + 14%)),
			0 2px 6px hsl(var(--color-accent-h) 30% 40% / 0.2);
		color: var(--color-accent-contrast);
		display: inline-flex;
		grid-row: 1;
		inline-size: 48px;
		justify-content: center;
		overflow: hidden;
		position: relative;
	}

	.step-icon::after {
		background: linear-gradient(
			135deg,
			rgb(255 255 255 / 0.25) 0%,
			rgb(255 255 255 / 0) 50%
		);
		content: '';
		inset: 0;
		pointer-events: none;
		position: absolute;
	}

	.step-connector {
		background: linear-gradient(
			to bottom,
			var(--color-accent),
			color-mix(in srgb, var(--color-accent), var(--color-border) 60%)
		);
		block-size: 28px;
		border-radius: 1px;
		grid-column: 1;
		grid-row: 2;
		inline-size: 2px;
		justify-self: center;
	}

	.step-body {
		align-self: center;
		display: grid;
		gap: 2px;
		grid-row: 1;
	}

	.step-body strong {
		font-family: var(--font-display);
		font-size: 1.05rem;
		font-weight: 600;
	}

	.step-body span {
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}

	@media (max-width: 880px) {
		.hero {
			grid-template-columns: 1fr;
			min-block-size: auto;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.hero,
		.step-icon {
			animation: none;
		}
	}
</style>
