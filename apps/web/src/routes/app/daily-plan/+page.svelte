<script lang="ts">
	import type { PageProps } from './$types';
	import type { RecommendationReason } from '$lib/features/recommendations/types';
	import { Button, StreakWeek } from '@learn-anything/ui';
	import {
		ArrowRight,
		BookOpen,
		CircleDashed,
		Flame,
		RefreshCw,
		Sparkles,
		Target,
		Zap
	} from '@lucide/svelte';

	let { data, form }: PageProps = $props();

	let goalMet = $derived(data.engagement.daily_goal_remaining === 0);

	const reasonConfig: Record<
		RecommendationReason,
		{ icon: typeof Sparkles; label: string; colorClass: string }
	> = {
		continue_path: { icon: ArrowRight, label: 'Continue', colorClass: 'reason-accent' },
		due_review: { icon: RefreshCw, label: 'Review due', colorClass: 'reason-warning' },
		weak_skill: { icon: Target, label: 'Strengthen', colorClass: 'reason-danger' },
		new_topic: { icon: BookOpen, label: 'New topic', colorClass: 'reason-success' },
		daily_goal_stretch: { icon: Zap, label: 'Stretch goal', colorClass: 'reason-star' }
	};

	function getReasonConfig(reason: RecommendationReason) {
		return reasonConfig[reason] ?? reasonConfig.continue_path;
	}
</script>

<main class="page plan-page">
	<section class="hero">
		<div class="hero-visual">
			<div class="hero-rays" aria-hidden="true">
				{#each { length: 12 } as _, i}
					<span class="ray" style:--ray-angle="{i * 30}deg"></span>
				{/each}
			</div>
			<div class="hero-icon">
				<div class="hero-icon-sheen" aria-hidden="true"></div>
				<Sparkles size={36} />
			</div>
		</div>

		<div class="hero-text">
			<p class="eyebrow">Daily plan</p>
			<h1>Today's recommendations</h1>
			<p class="hero-subtitle">
				{#if goalMet}
					Daily goal complete — stretch recommendations below.
				{:else}
					Curated for you based on your progress and goals.
				{/if}
			</p>
		</div>

		<div class="hero-summary-card">
			<StreakWeek
				currentStreak={data.engagement.current_streak}
				currentDate={data.streakToday}
				ariaLabel="Weekly streak progress"
			/>
			<div class="hero-stats">
				<div class="stat">
					<strong>{data.engagement.daily_xp_goal - data.engagement.daily_goal_remaining}</strong>
					<span>XP earned</span>
				</div>
				<div class="stat-divider" aria-hidden="true"></div>
				<div class="stat">
					<strong>{data.engagement.daily_xp_goal}</strong>
					<span>XP goal</span>
				</div>
				<div class="stat-divider" aria-hidden="true"></div>
				<div class="stat">
					<strong class="streak-val">
						<Flame size={18} />
						{data.engagement.current_streak}
					</strong>
					<span>Day streak</span>
				</div>
			</div>
		</div>
	</section>

	{#if form?.error}
		<p class="message error">{form.error}</p>
	{:else if form?.skipped}
		<p class="message success">Recommendation skipped.</p>
	{/if}

	{#if data.plan.items.length}
		<section class="plan-section">
			<div class="section-header">
				<h2>{data.plan.items.length} recommendation{data.plan.items.length === 1 ? '' : 's'}</h2>
				<p>
					{#if data.engagement.daily_goal_remaining > 0}
						{data.engagement.daily_goal_remaining} XP remaining for today's goal
					{:else}
						You're ahead of the curve today
					{/if}
				</p>
			</div>

			<div class="plan-grid">
				{#each data.plan.items as item, i (item.id)}
					{@const config = getReasonConfig(item.reason)}
					{@const Icon = config.icon}
					<article class="plan-card">
						<div class="card-top">
							<div class="plan-icon {config.colorClass}">
								<Icon size={22} />
							</div>
							<span class="reason-pill {config.colorClass}">{config.label}</span>
						</div>
						<div class="card-body">
							<h3>{item.title}</h3>
							<p>{item.description}</p>
						</div>
						<div class="card-actions">
							<Button href={item.targetUrl} label="Start learning" />
							<form method="POST" action="?/skip">
								<input type="hidden" name="recommendationId" value={item.id} />
								<Button type="submit" variant="secondary" label="Skip" />
							</form>
						</div>
					</article>
				{/each}
			</div>
		</section>
	{:else}
		<section class="empty-state">
			<div class="empty-icon">
				<CircleDashed size={48} />
			</div>
			<h2>No recommendations yet</h2>
			<p>Enroll in a topic to start receiving personalised daily plans.</p>
			<Button href="/subjects" label="Browse subjects" />
		</section>
	{/if}
</main>

<style>
	.plan-page {
		display: grid;
		gap: 28px;
	}

	/* ---- Hero ---- */

	.hero {
		display: grid;
		gap: 50px;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		padding: clamp(24px, 4vw, 40px) 0;
		border-bottom: 1px dashed var(--color-border);
	}

	.hero-visual {
		position: relative;
		inline-size: 96px;
		block-size: 96px;
	}

	.hero-visual::before {
		content: '';
		position: absolute;
		inset: -10px;
		border-radius: 50%;
		background: radial-gradient(
			circle,
			hsl(var(--color-accent-h) var(--color-accent-s) var(--color-accent-l) / 0.1) 40%,
			hsl(var(--color-accent-h) var(--color-accent-s) var(--color-accent-l) / 0.04) 70%,
			transparent 100%
		);
		box-shadow: inset 0 0 12px
			hsl(var(--color-accent-h) var(--color-accent-s) var(--color-accent-l) / 0.08);
	}

	.hero-icon {
		align-items: center;
		background: linear-gradient(
			to bottom,
			hsl(var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) + 14%)),
			hsl(var(--color-accent-h) var(--color-accent-s) var(--color-accent-l)),
			hsl(var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) - 12%))
		);
		border: 1px solid
			hsl(var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) - 18%));
		border-radius: 50%;
		box-shadow:
			inset 0 2px 3px
				hsl(
					var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) + 28%) / 0.55
				),
			inset 0 -1px 2px
				hsl(
					var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) - 20%) / 0.3
				),
			0 2px 8px hsl(var(--color-accent-h) var(--color-accent-s) var(--color-accent-l) / 0.4),
			0 0 20px hsl(var(--color-accent-h) var(--color-accent-s) var(--color-accent-l) / 0.22);
		color: #fff;
		display: grid;
		block-size: 100%;
		inline-size: 100%;
		justify-items: center;
		position: relative;
		z-index: 1;
	}

	.hero-icon-sheen {
		border-radius: inherit;
		inset: 0;
		pointer-events: none;
		position: absolute;
		background: linear-gradient(
			to bottom,
			hsl(0 0% 100% / 0.32) 0%,
			hsl(0 0% 100% / 0.08) 42%,
			transparent 50%,
			hsl(0 0% 0% / 0.1) 100%
		);
		z-index: 2;
	}

	.hero-rays {
		inset: -18px;
		position: absolute;
		pointer-events: none;
	}

	.ray {
		position: absolute;
		inset: 0;
		display: block;
		transform: rotate(var(--ray-angle));
	}

	.ray::before {
		content: '';
		position: absolute;
		inset-inline: calc(50% - 1px);
		inset-block-start: 0;
		block-size: 40%;
		inline-size: 2px;
		border-radius: 1px;
		background: linear-gradient(
			to bottom,
			hsl(var(--color-accent-h) var(--color-accent-s) var(--color-accent-l) / 0.28),
			hsl(var(--color-accent-h) var(--color-accent-s) var(--color-accent-l) / 0)
		);
	}

	@keyframes rays-spin {
		to {
			transform: rotate(360deg);
		}
	}

	.hero-rays {
		animation: rays-spin 60s linear infinite;
	}

	.hero-text {
		display: grid;
		gap: 4px;
	}

	.hero h1 {
		font-size: clamp(1.8rem, 4vw, 2.6rem);
		letter-spacing: 0;
		line-height: 1;
		margin: 0;
	}

	.hero p {
		margin: 0;
	}

	.hero-subtitle {
		color: var(--color-text-muted);
		max-inline-size: 38ch;
	}

	.hero-summary-card {
		background: var(--color-surface);
		border: 1px solid color-mix(in srgb, var(--color-border), transparent 20%);
		border-radius: var(--radius-md);
		box-shadow:
			0 1px 0 hsl(0 0% 100% / 0.8),
			0 2px 8px hsl(0 0% 0% / 0.05);
		display: grid;
		gap: 16px;
		justify-items: center;
		min-inline-size: 340px;
		padding: 16px 18px 18px;
	}

	.hero-stats {
		align-items: center;
		display: flex;
		gap: 20px;
	}

	.stat {
		display: grid;
		gap: 2px;
		text-align: center;
	}

	.stat strong {
		font-size: 1.8rem;
		line-height: 1;
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
		font-size: 0.78rem;
		font-weight: 700;
		text-transform: uppercase;
	}

	.stat-divider {
		background: var(--color-border);
		block-size: 32px;
		inline-size: 1px;
	}

	/* ---- Section headers ---- */

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
		margin: 0;
	}

	/* ---- Plan section ---- */

	.plan-section {
		display: grid;
		gap: 16px;
	}

	.plan-grid {
		display: grid;
		gap: 12px;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
	}

	/* ---- Plan card ---- */

	.plan-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		display: grid;
		gap: 14px;
		padding: 20px;
		transition:
			border-color 0.2s,
			box-shadow 0.2s;
	}

	.plan-card:hover {
		border-color: color-mix(in srgb, var(--color-accent), transparent 40%);
		box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-accent), transparent 70%);
	}

	.card-top {
		align-items: center;
		display: flex;
		justify-content: space-between;
	}

	.plan-icon {
		align-items: center;
		border-radius: var(--radius-md);
		display: grid;
		block-size: 44px;
		inline-size: 44px;
		justify-items: center;
		position: relative;
		color: #fff;
	}

	.plan-icon::after {
		border-radius: inherit;
		content: '';
		inset: 0;
		pointer-events: none;
		position: absolute;
		background: linear-gradient(
			to bottom,
			hsl(0 0% 100% / 0.28) 0%,
			hsl(0 0% 100% / 0.06) 44%,
			transparent 50%,
			hsl(0 0% 0% / 0.1) 100%
		);
	}

	.plan-icon.reason-accent {
		background: linear-gradient(
			to bottom,
			hsl(var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) + 10%)),
			hsl(var(--color-accent-h) var(--color-accent-s) var(--color-accent-l)),
			hsl(var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) - 14%))
		);
		border: 1px solid
			hsl(var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) - 22%));
		box-shadow:
			inset 0 1px 2px
				hsl(
					var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) + 24%) / 0.5
				),
			0 1px 4px hsl(var(--color-accent-h) var(--color-accent-s) var(--color-accent-l) / 0.3);
	}

	.plan-icon.reason-warning {
		background: linear-gradient(
			to bottom,
			hsl(var(--color-warning-h) var(--color-warning-s) calc(var(--color-warning-l) + 10%)),
			hsl(var(--color-warning-h) var(--color-warning-s) var(--color-warning-l)),
			hsl(var(--color-warning-h) var(--color-warning-s) calc(var(--color-warning-l) - 14%))
		);
		border: 1px solid
			hsl(var(--color-warning-h) var(--color-warning-s) calc(var(--color-warning-l) - 22%));
		box-shadow:
			inset 0 1px 2px
				hsl(
					var(--color-warning-h) var(--color-warning-s) calc(var(--color-warning-l) + 24%) / 0.5
				),
			0 1px 4px hsl(var(--color-warning-h) var(--color-warning-s) var(--color-warning-l) / 0.3);
	}

	.plan-icon.reason-danger {
		background: linear-gradient(
			to bottom,
			hsl(var(--color-danger-h) var(--color-danger-s) calc(var(--color-danger-l) + 10%)),
			hsl(var(--color-danger-h) var(--color-danger-s) var(--color-danger-l)),
			hsl(var(--color-danger-h) var(--color-danger-s) calc(var(--color-danger-l) - 14%))
		);
		border: 1px solid
			hsl(var(--color-danger-h) var(--color-danger-s) calc(var(--color-danger-l) - 22%));
		box-shadow:
			inset 0 1px 2px
				hsl(
					var(--color-danger-h) var(--color-danger-s) calc(var(--color-danger-l) + 24%) / 0.5
				),
			0 1px 4px hsl(var(--color-danger-h) var(--color-danger-s) var(--color-danger-l) / 0.3);
	}

	.plan-icon.reason-success {
		background: linear-gradient(
			to bottom,
			hsl(var(--color-success-h) var(--color-success-s) calc(var(--color-success-l) + 12%)),
			hsl(var(--color-success-h) var(--color-success-s) var(--color-success-l)),
			hsl(var(--color-success-h) var(--color-success-s) calc(var(--color-success-l) - 10%))
		);
		border: 1px solid
			hsl(var(--color-success-h) var(--color-success-s) calc(var(--color-success-l) - 18%));
		box-shadow:
			inset 0 1px 2px
				hsl(
					var(--color-success-h) var(--color-success-s) calc(var(--color-success-l) + 26%) / 0.5
				),
			0 1px 4px hsl(var(--color-success-h) var(--color-success-s) var(--color-success-l) / 0.3);
	}

	.plan-icon.reason-star {
		background: linear-gradient(
			to bottom,
			hsl(var(--color-star-h) var(--color-star-s) calc(var(--color-star-l) + 14%)),
			hsl(var(--color-star-h) var(--color-star-s) var(--color-star-l)),
			hsl(var(--color-star-h) var(--color-star-s) calc(var(--color-star-l) - 12%))
		);
		border: 1px solid
			hsl(var(--color-star-h) var(--color-star-s) calc(var(--color-star-l) - 18%));
		box-shadow:
			inset 0 1px 2px
				hsl(var(--color-star-h) var(--color-star-s) calc(var(--color-star-l) + 28%) / 0.5),
			0 1px 4px hsl(var(--color-star-h) var(--color-star-s) var(--color-star-l) / 0.3);
	}

	/* ---- Reason pill ---- */

	.reason-pill {
		border-radius: 999px;
		font-size: 0.72rem;
		font-weight: 750;
		padding: 3px 10px;
		text-transform: uppercase;
	}

	.reason-pill.reason-accent {
		background: color-mix(in srgb, var(--color-accent), transparent 88%);
		color: hsl(var(--color-accent-h) var(--color-accent-s) 36%);
	}

	.reason-pill.reason-warning {
		background: color-mix(in srgb, var(--color-warning), transparent 85%);
		color: hsl(var(--color-warning-h) var(--color-warning-s) 34%);
	}

	.reason-pill.reason-danger {
		background: color-mix(in srgb, var(--color-danger), transparent 90%);
		color: hsl(var(--color-danger-h) var(--color-danger-s) 40%);
	}

	.reason-pill.reason-success {
		background: color-mix(in srgb, var(--color-success), transparent 88%);
		color: hsl(var(--color-success-h) var(--color-success-s) 30%);
	}

	.reason-pill.reason-star {
		background: color-mix(in srgb, var(--color-star), transparent 85%);
		color: hsl(var(--color-star-h) var(--color-star-s) 34%);
	}

	/* ---- Card body ---- */

	.card-body {
		display: grid;
		gap: 4px;
	}

	.card-body h3 {
		font-size: 1.05rem;
		letter-spacing: 0;
		margin: 0;
	}

	.card-body p {
		color: var(--color-text-muted);
		font-size: 0.9rem;
		line-height: 1.45;
		margin: 0;
	}

	/* ---- Card actions ---- */

	.card-actions {
		align-items: center;
		border-block-start: 1px solid var(--color-border);
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		padding-block-start: 14px;
	}

	/* ---- Empty state ---- */

	.empty-state {
		align-items: center;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		color: var(--color-text-muted);
		display: grid;
		gap: 12px;
		justify-items: center;
		padding: 60px 32px;
		text-align: center;
	}

	.empty-icon {
		align-items: center;
		background: var(--color-surface-raised);
		border: 1px solid var(--color-border);
		border-radius: 50%;
		display: grid;
		block-size: 80px;
		inline-size: 80px;
		justify-items: center;
	}

	.empty-state h2 {
		color: var(--color-text);
		margin: 0;
	}

	.empty-state p {
		margin: 0;
		max-inline-size: 36ch;
	}

	/* ---- Responsive ---- */

	@media (max-width: 840px) {
		.hero {
			grid-template-columns: 1fr;
			justify-items: start;
		}

		.hero-stats {
			justify-self: stretch;
			justify-content: center;
		}

		.hero-summary-card {
			inline-size: 100%;
			min-inline-size: 0;
		}
	}

	@media (max-width: 480px) {
		.plan-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
