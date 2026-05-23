<script lang="ts">
	import type { PageProps } from './$types';
	import { ArrowRight } from '@lucide/svelte';
	import { pluralize } from '$lib/shared/utils/format';

	let { data }: PageProps = $props();

	const avatarHues = [200, 32, 280, 140, 350, 220, 95, 12];
</script>

<main class="page subjects-page">
	<header class="page-heading">
		<p class="eyebrow">Catalogue</p>
		<h1>Browse subjects</h1>
		<p class="muted">Pick a subject to see its topic paths, then preview or start.</p>
	</header>

	<section class="subject-list" aria-label="Available subjects">
		{#if data.subjects.length === 0}
			<p class="empty muted">No public subjects are available yet.</p>
		{/if}

		{#each data.subjects as subject, i (subject.id)}
			<a
				class="catalogue-row subject"
				href={`/subjects/${subject.slug}`}
				style:--avatar-h={avatarHues[i % avatarHues.length]}
			>
				<span class="avatar" aria-hidden="true">{subject.name.charAt(0)}</span>
				<div class="subject-body">
					<div class="subject-head">
						<h2>{subject.name}</h2>
						<span class="count muted">{pluralize(subject.topicCount, 'topic')}</span>
					</div>
					<p class="muted">{subject.summary}</p>
				</div>
				<span class="row-arrow" aria-hidden="true">
					<ArrowRight size={16} strokeWidth={2.5} />
				</span>
			</a>
		{/each}
	</section>
</main>

<style>
	.subjects-page {
		display: grid;
		gap: 32px;
		padding-block: 48px 72px;
	}

	.page-heading {
		display: grid;
		gap: 8px;
	}

	h1,
	h2,
	p {
		margin: 0;
	}

	h1 {
		font-size: clamp(2.4rem, 5vw, 4.2rem);
		letter-spacing: -0.02em;
		line-height: 1;
	}

	.subject-list {
		display: grid;
		gap: 10px;
	}

	.subject {
		align-items: center;
		gap: 16px;
		grid-template-columns: 44px 1fr auto;
	}

	.avatar {
		align-items: center;
		background: linear-gradient(
			to bottom,
			hsl(var(--avatar-h) 70% 95%),
			hsl(var(--avatar-h) 65% 91%)
		);
		block-size: 44px;
		border: 1px solid hsl(var(--avatar-h) 40% 84%);
		border-radius: var(--radius-md);
		box-shadow: 0 1px 0 inset hsl(var(--avatar-h) 80% 98%);
		color: hsl(var(--avatar-h) 55% 38%);
		display: inline-flex;
		font-family: var(--font-display);
		font-size: 1.15rem;
		font-weight: 600;
		inline-size: 44px;
		justify-content: center;
	}

	.subject-body {
		display: grid;
		gap: 4px;
		min-inline-size: 0;
	}

	.subject-head {
		align-items: baseline;
		display: flex;
		gap: 10px;
	}

	h2 {
		font-size: 1.1rem;
		letter-spacing: -0.005em;
	}

	.count {
		font-size: 0.82rem;
	}

	.subject-body p {
		font-size: 0.95rem;
		line-height: 1.45;
	}

	.row-arrow {
		color: var(--color-text-muted);
		opacity: 0;
		transition:
			opacity var(--transition-ease),
			transform var(--transition-ease),
			color var(--transition-ease);
		transform: translateX(-3px);
	}

	.subject:hover .row-arrow,
	.subject:focus-visible .row-arrow {
		color: var(--color-accent);
		opacity: 1;
		transform: none;
	}

	.empty {
		padding: 20px 0;
	}

	@media (max-width: 640px) {
		.subject {
			grid-template-columns: 40px 1fr;
		}

		.avatar {
			block-size: 40px;
			font-size: 1rem;
			inline-size: 40px;
		}

		.row-arrow {
			display: none;
		}
	}
</style>
