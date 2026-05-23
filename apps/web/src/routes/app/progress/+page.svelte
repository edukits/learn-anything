<script lang="ts">
	import type { PageProps } from './$types';
	import { SkillAccuracyPanel } from '$lib/features/learning';
	import type { MetricItem } from '$lib/features/learning';
	import { Button } from '@learn-anything/ui';
	import {
		BookOpen,
		Check,
		Flame,
		HelpCircle,
		Lock,
		Play,
		RotateCcw,
		Target,
		Trophy
	} from '@lucide/svelte';

	let { data }: PageProps = $props();

	let engagement = $derived(data.engagement);
	let completedPathItems = $derived(
		data.pathProgress.filter((item) => item.state === 'completed' || item.state === 'review').length
	);
	let quizItems = $derived(data.pathProgress.filter((item) => item.item_type === 'quiz'));
	let totalAttempts = $derived(quizItems.reduce((total, item) => total + item.total_attempts, 0));
	let bestScore = $derived(
		quizItems.every((item) => item.best_score === null)
			? null
			: Math.round(Math.max(...quizItems.map((item) => item.best_score ?? 0)))
	);

	let pathCompletionPercent = $derived(
		data.pathProgress.length > 0
			? Math.round((completedPathItems / data.pathProgress.length) * 100)
			: 0
	);

	function resolveIcon(item: (typeof data.pathProgress)[number]) {
		if (item.state === 'locked') return Lock;
		if (item.state === 'completed') return Check;
		if (item.state === 'review') return RotateCcw;
		if (item.item_type === 'quiz') return Trophy;
		return item.state === 'active' ? Play : BookOpen;
	}
</script>

<main class="page progress-page">
	<section class="hero">
		<div class="hero-text">
			<p class="eyebrow">Progress</p>
			<h1>{data.topic.name}</h1>
			<p class="hero-subtitle">
				Based on <strong>{data.release.title}</strong>
			</p>
		</div>

		<div class="hero-stats">
			<div class="stat">
				<strong>{engagement.xp_today}<span class="stat-unit">/{engagement.daily_xp_goal}</span></strong>
				<span>XP today</span>
			</div>
			<div class="stat-divider" aria-hidden="true"></div>
			<div class="stat">
				<strong>{engagement.xp_total}</strong>
				<span>XP total</span>
			</div>
			<div class="stat-divider" aria-hidden="true"></div>
			<div class="stat">
				<strong class="streak-val">
					<Flame size={18} />
					{engagement.current_streak}
				</strong>
				<span>Day streak</span>
			</div>
		</div>
	</section>

	{#if data.reviewSummary.available}
		<section class="recommendation" aria-label="Recommended next action">
			<div class="rec-icon">
				<Target size={22} />
			</div>
			<div class="rec-content">
				<span class="rec-badge">Recommended</span>
				<h2>{data.reviewSummary.reason_label ?? 'Adaptive review'}</h2>
				<p>{data.reviewSummary.question_count} questions selected from your recent attempt history.</p>
			</div>
			<Button href={`/app/topics/${data.topic.slug}/review`} label="Start review" />
		</section>
	{/if}

	<div class="two-col">
		<section class="col-main">
			<div class="section-header">
				<h2>Learning path</h2>
				<p>{completedPathItems} of {data.pathProgress.length} completed · {pathCompletionPercent}%</p>
			</div>

			<div class="path-map">
				{#each data.pathProgress as item, i (item.id)}
					{@const Icon = resolveIcon(item)}
					<div class="step" data-state={item.state}>
						<div class="node" data-state={item.state} data-kind={item.item_type}>
							<div class="track">
								<span class="icon" aria-hidden="true">
									<Icon size={20} strokeWidth={2.25} />
								</span>
								{#if i < data.pathProgress.length - 1}
									<div class="connector" aria-hidden="true"></div>
								{/if}
							</div>
							<span class="content">
								<span class="node-eyebrow">
									{#if item.item_type === 'lesson'}
										<BookOpen size={12} /> Lesson
									{:else}
										<HelpCircle size={12} /> Quiz
									{/if}
								</span>
								<strong>{item.title}</strong>
								<small>
									{#if item.item_type === 'lesson'}
										{item.estimated_minutes} min
									{:else if item.total_attempts > 0}
										Best: {Math.round(item.best_score ?? 0)}% · {item.total_attempts} attempt{item.total_attempts === 1 ? '' : 's'}
									{:else}
										{item.question_count} questions
									{/if}
								</small>
							</span>
						</div>
					</div>
				{/each}
			</div>
		</section>

		<aside class="col-side">
			<section class="side-card">
				<h3>Overview</h3>
				<div class="overview-stats">
					<div class="overview-row">
						<span>Path progress</span>
						<strong>{completedPathItems}/{data.pathProgress.length}</strong>
					</div>
					<div class="overview-row">
						<span>Lessons done</span>
						<strong>{data.pathProgress.filter((item) => item.item_type === 'lesson' && item.state === 'completed').length}</strong>
					</div>
					<div class="overview-row">
						<span>Quizzes taken</span>
						<strong>{quizItems.filter((item) => item.total_attempts > 0).length}</strong>
					</div>
					<div class="overview-row">
						<span>Best score</span>
						<strong>{bestScore !== null ? `${bestScore}%` : '—'}</strong>
					</div>
					<div class="overview-row">
						<span>Total attempts</span>
						<strong>{totalAttempts}</strong>
					</div>
				</div>
			</section>

			<div class="side-actions">
				<Button href="/app/progress/history" variant="secondary" label="View history" />
			</div>
		</aside>
	</div>

	<SkillAccuracyPanel
		title="Skill accuracy"
		stats={data.skillAccuracy}
		emptyMessage={`No quiz answers yet. Complete a ${data.topic.name} quiz to populate this view.`}
		density="roomy"
	/>
</main>

<style>
	.progress-page {
		display: grid;
		gap: 32px;
	}

	/* ---- Hero ---- */

	.hero {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 32px;
		padding: clamp(20px, 4vw, 36px) 0;
		border-bottom: 1px dashed var(--color-border);
	}

	.hero-text {
		display: grid;
		gap: 4px;
	}

	.hero h1 {
		font-size: clamp(2rem, 4.5vw, 2.8rem);
		letter-spacing: 0;
		line-height: 1;
		margin: 0;
	}

	.hero p {
		margin: 0;
	}

	.hero-subtitle {
		color: var(--color-text-muted);
	}

	.hero-subtitle strong {
		font-weight: 600;
	}

	.hero-stats {
		align-items: center;
		display: flex;
		gap: 20px;
		flex-shrink: 0;
	}

	.stat {
		display: grid;
		gap: 2px;
		text-align: center;
	}

	.stat strong {
		font-size: 1.6rem;
		line-height: 1;
	}

	.stat-unit {
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--color-text-muted);
	}

	.streak-val {
		align-items: center;
		display: inline-flex;
		gap: 4px;
		justify-content: center;
		color: var(--color-warning);
	}

	.stat span {
		color: var(--color-text-muted);
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
	}

	.stat-divider {
		background: var(--color-border);
		block-size: 32px;
		inline-size: 1px;
	}

	/* ---- Recommendation banner ---- */

	.recommendation {
		align-items: center;
		background: var(--color-surface-accent);
		border: 1px solid color-mix(in srgb, var(--color-accent), transparent 70%);
		border-radius: var(--radius-md);
		display: flex;
		gap: 16px;
		padding: 20px;
	}

	.rec-icon {
		--tone-top: calc(var(--color-accent-l) + 10%);
		--tone-bottom: calc(var(--color-accent-l) - 12%);
		--tone-border: calc(var(--color-accent-l) - 22%);
		align-items: center;
		background: linear-gradient(
			to bottom,
			hsl(var(--color-accent-h) var(--color-accent-s) var(--tone-top)),
			hsl(var(--color-accent-h) var(--color-accent-s) var(--tone-bottom))
		);
		border: 1px solid hsl(var(--color-accent-h) var(--color-accent-s) var(--tone-border));
		border-radius: 999px;
		box-shadow:
			inset 0 2px 1px hsl(var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) + 20%) / 0.5),
			0 2px 0 hsl(var(--color-accent-h) var(--color-accent-s) var(--tone-border));
		color: var(--color-accent-contrast);
		display: grid;
		block-size: 44px;
		inline-size: 44px;
		flex-shrink: 0;
		justify-items: center;
	}

	.rec-content {
		display: grid;
		gap: 2px;
		flex: 1;
		min-inline-size: 0;
	}

	.rec-badge {
		color: hsl(var(--color-accent-h) var(--color-accent-s) 36%);
		font-size: 0.72rem;
		font-weight: 750;
		letter-spacing: 0.02em;
		text-transform: uppercase;
	}

	.rec-content h2 {
		font-size: 1.05rem;
		letter-spacing: 0;
		margin: 0;
	}

	.rec-content p {
		color: var(--color-text-muted);
		font-size: 0.88rem;
		margin: 0;
	}

	/* ---- Two-col layout ---- */

	.two-col {
		display: grid;
		gap: 28px;
		grid-template-columns: 1fr 280px;
	}

	.col-main {
		display: grid;
		gap: 16px;
		align-content: start;
	}

	.col-side {
		display: grid;
		gap: 16px;
		align-content: start;
	}

	/* ---- Section header ---- */

	.section-header {
		display: grid;
		gap: 2px;
	}

	.section-header h2 {
		font-size: 1.25rem;
		letter-spacing: 0;
		margin: 0;
	}

	.section-header p {
		color: var(--color-text-muted);
		font-size: 0.9rem;
		margin: 0;
	}

	/* ---- Path map ---- */

	.path-map {
		display: grid;
	}

	.step {
		display: grid;
		grid-template-columns: 2.75rem 1fr;
		gap: var(--space-3);
	}

	.node {
		--path-item-accent-h: var(--color-accent-h);
		--path-item-accent-s: var(--color-accent-s);
		--path-item-accent-l: var(--color-accent-l);
		display: contents;
	}

	.step[data-state='active'] {
		--path-item-accent-h: var(--color-accent-h);
		--path-item-accent-s: var(--color-accent-s);
		--path-item-accent-l: var(--color-accent-l);
	}

	.step[data-state='completed'] {
		--path-item-accent-h: var(--color-success-h);
		--path-item-accent-s: var(--color-success-s);
		--path-item-accent-l: var(--color-success-l);
	}

	.step[data-state='review'] {
		--path-item-accent-h: var(--color-star-h);
		--path-item-accent-s: var(--color-star-s);
		--path-item-accent-l: var(--color-star-l);
	}

	.step[data-state='locked'] {
		--path-item-accent-h: var(--color-accent-h);
		--path-item-accent-s: 12%;
		--path-item-accent-l: 58%;
	}

	.step[data-state='locked'] .content {
		color: var(--color-text-muted);
	}


	.track {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding-block-start: 2px;
	}

	.icon {
		align-items: center;
		border-radius: 999px;
		display: inline-flex;
		justify-content: center;
		min-block-size: 2.75rem;
		min-inline-size: 2.75rem;
		--tone-top: var(--path-item-accent-l);
		--tone-bottom: calc(var(--path-item-accent-l) - 15%);
		--tone-border: calc(var(--path-item-accent-l) - 25%);
		--tone-inset: calc(var(--path-item-accent-l) + 10%);
		background: linear-gradient(
			to bottom,
			hsl(var(--path-item-accent-h) var(--path-item-accent-s) var(--tone-top)),
			hsl(var(--path-item-accent-h) var(--path-item-accent-s) var(--tone-bottom))
		);
		border: 1px solid hsl(var(--path-item-accent-h) var(--path-item-accent-s) var(--tone-border));
		box-shadow:
			inset 0 2px 1px hsl(var(--path-item-accent-h) var(--path-item-accent-s) var(--tone-inset) / 0.5),
			0 2px 0 hsl(var(--path-item-accent-h) var(--path-item-accent-s) var(--tone-border));
		color: var(--color-accent-contrast);
		flex-shrink: 0;
	}

	.connector {
		flex: 1;
		inline-size: 0.375rem;
		margin-block: 6px;
		min-block-size: 12px;
		border-radius: 2px;
		background: color-mix(
			in srgb,
			hsl(var(--path-item-accent-h) var(--path-item-accent-s) var(--path-item-accent-l)),
			var(--color-border) 78%
		);
	}


	.content {
		display: grid;
		gap: var(--space-1);
		min-inline-size: 0;
		padding-block: 6px 20px;
	}

	.node-eyebrow {
		align-items: center;
		color: var(--color-text-muted);
		display: inline-flex;
		font-size: 0.75rem;
		font-weight: 750;
		gap: 3px;
		letter-spacing: 0;
		line-height: 1.1;
		text-transform: uppercase;
	}

	.content strong {
		font-size: 1.05rem;
		line-height: 1.2;
		overflow-wrap: anywhere;
	}

	.content small {
		color: var(--color-text-muted);
		font-size: 0.85rem;
		line-height: 1.3;
	}

	/* ---- Sidebar card ---- */

	.side-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		display: grid;
		gap: 14px;
		padding: 20px;
	}

	.side-card h3 {
		font-size: 0.9rem;
		font-weight: 700;
		letter-spacing: 0;
		margin: 0;
		text-transform: uppercase;
		color: var(--color-text-muted);
	}

	.overview-stats {
		display: grid;
		gap: 12px;
	}

	.overview-row {
		align-items: center;
		display: flex;
		justify-content: space-between;
	}

	.overview-row span {
		color: var(--color-text-muted);
		font-size: 0.88rem;
	}

	.overview-row strong {
		font-size: 1rem;
	}

	.side-actions {
		display: grid;
		gap: 8px;
	}

	/* ---- Responsive ---- */

	@media (max-width: 840px) {
		.hero {
			flex-direction: column;
			align-items: start;
		}

		.hero-stats {
			align-self: stretch;
			justify-content: center;
			background: var(--color-surface-raised);
			border-radius: var(--radius-sm);
			padding: 14px;
		}

		.two-col {
			grid-template-columns: 1fr;
		}

		.col-side {
			order: -1;
		}
	}

	@media (max-width: 480px) {
		.recommendation {
			flex-direction: column;
			align-items: start;
		}
	}
</style>
