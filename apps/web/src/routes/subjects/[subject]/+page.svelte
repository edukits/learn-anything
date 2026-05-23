<script lang="ts">
	import type { PageProps } from './$types';
	import { ArrowRight, BookOpen, Clock, Layers } from '@lucide/svelte';
	import { pluralize } from '$lib/shared/utils/format';

	let { data }: PageProps = $props();

	type TopicRow = (typeof data.topics)[number];

	let grouped = $derived.by(() => {
		const map = new Map<string, TopicRow[]>();
		for (const topic of data.topics) {
			const key = topic.level_label || 'Other';
			const list = map.get(key);
			if (list) list.push(topic);
			else map.set(key, [topic]);
		}
		return Array.from(map, ([level, topics]) => ({ level, topics }));
	});
</script>

<main class="page subject-page">
	<header class="page-heading">
		<p class="eyebrow">Subject</p>
		<h1>{data.subject.name}</h1>
		<p class="lede muted">{data.subject.summary}</p>
	</header>

	<div class="groups" aria-label={`${data.subject.name} topics`}>
		{#each grouped as group (group.level)}
			<section class="group">
				<div class="group-label">
					<h2>{group.level}</h2>
					<span class="muted">{pluralize(group.topics.length, 'path')}</span>
				</div>

				<div class="topic-list">
					{#each group.topics as topic (topic.topic_area_id)}
						<a
							class="catalogue-row topic"
							href={data.isSignedIn ? topic.app_path : `/topics/${topic.slug}`}
						>
							<div class="topic-body">
								<h3>{topic.name}</h3>
								<p class="muted">{topic.public_summary}</p>
								<div class="fact-inline">
									<span><BookOpen size={14} /> {pluralize(topic.lesson_count, 'lesson')}</span>
									<span><Layers size={14} /> {pluralize(topic.quiz_count, 'quiz', 'quizzes')}</span>
									<span><Clock size={14} /> {topic.estimated_minutes} min</span>
								</div>
							</div>
							<span class="row-arrow" aria-hidden="true">
								<ArrowRight size={16} strokeWidth={2.5} />
							</span>
						</a>
					{/each}
				</div>
			</section>
		{/each}
	</div>
</main>

<style>
	.subject-page {
		display: grid;
		gap: 36px;
		padding-block: 48px 72px;
	}

	.page-heading {
		display: grid;
		gap: 10px;
	}

	h1,
	h2,
	h3,
	p {
		margin: 0;
	}

	h1 {
		font-size: clamp(2.4rem, 5vw, 4.6rem);
		letter-spacing: -0.02em;
		line-height: 1;
	}

	.lede {
		font-size: 1.08rem;
		max-inline-size: 60ch;
	}

	.groups {
		display: grid;
		gap: 36px;
	}

	.group {
		display: grid;
		gap: 14px;
	}

	.group-label {
		align-items: baseline;
		border-block-end: 1px dashed var(--color-border);
		display: flex;
		gap: 12px;
		padding-block-end: 10px;
	}

	.group-label h2 {
		font-size: 0.82rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.group-label span {
		font-size: 0.82rem;
	}

	.topic-list {
		display: grid;
		gap: 10px;
	}

	.topic {
		align-items: center;
		gap: 16px;
		grid-template-columns: 1fr auto;
	}

	.topic-body {
		display: grid;
		gap: 6px;
		min-inline-size: 0;
	}

	h3 {
		font-size: 1.12rem;
		letter-spacing: -0.005em;
	}

	.topic-body p {
		font-size: 0.95rem;
		line-height: 1.45;
		max-inline-size: 65ch;
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

	.topic:hover .row-arrow,
	.topic:focus-visible .row-arrow {
		color: var(--color-accent);
		opacity: 1;
		transform: none;
	}

	@media (max-width: 640px) {
		.row-arrow {
			display: none;
		}
	}
</style>
