<script lang="ts">
	import type { PageProps } from './$types';
	import { Button } from '@learn-anything/ui';
	import { Sparkles } from '@lucide/svelte';

	let { data, form }: PageProps = $props();
</script>

<main class="page plan-page">
	<section>
		<Sparkles size={32} />
		<p class="eyebrow">Daily plan</p>
		<h1>Today's recommendations</h1>
		<p>
			{data.engagement.daily_goal_remaining > 0
				? `${data.engagement.daily_goal_remaining} XP left for today's goal.`
				: 'Daily goal complete. Stretch recommendations are available when useful.'}
		</p>
		{#if form?.error}
			<p class="message error">{form.error}</p>
		{:else if form?.skipped}
			<p class="message">Recommendation skipped.</p>
		{/if}
		{#if data.plan.items.length}
			<div class="plan-list">
				{#each data.plan.items as item (item.id)}
					<article>
						<div>
							<span>{item.reason.replaceAll('_', ' ')}</span>
							<h2>{item.title}</h2>
							<p>{item.description}</p>
						</div>
						<div class="actions">
							<Button href={item.targetUrl} label="Start" />
							<form method="POST" action="?/skip">
								<input type="hidden" name="recommendationId" value={item.id} />
								<Button type="submit" variant="secondary" label="Skip" />
							</form>
						</div>
					</article>
				{/each}
			</div>
		{:else}
			<p>Enroll in a topic to generate a daily plan.</p>
			<Button href="/subjects" label="Browse subjects" />
		{/if}
	</section>
</main>

<style>
	.plan-page {
		display: grid;
		max-inline-size: 760px;
	}

	section {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		display: grid;
		gap: 14px;
		padding: clamp(20px, 4vw, 32px);
	}

	h1,
	p {
		margin: 0;
	}

	h1 {
		font-size: clamp(2rem, 4vw, 3.4rem);
		letter-spacing: 0;
		line-height: 1;
	}

	section > p:not(.eyebrow) {
		color: var(--color-text-muted);
	}

	.plan-list {
		display: grid;
		gap: 12px;
	}

	article {
		align-items: center;
		border-block-start: 1px solid var(--color-border);
		display: flex;
		gap: 16px;
		justify-content: space-between;
		padding-block-start: 14px;
	}

	article div {
		display: grid;
		gap: 4px;
	}

	span {
		color: var(--color-text-muted);
		font-size: 0.78rem;
		font-weight: 750;
		letter-spacing: 0;
		text-transform: uppercase;
	}

	h2 {
		font-size: 1rem;
		letter-spacing: 0;
		margin: 0;
	}

	.actions {
		align-items: center;
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		justify-content: end;
	}

	@media (max-width: 680px) {
		article {
			align-items: start;
			flex-direction: column;
		}

		.actions {
			justify-content: start;
		}
	}
</style>
