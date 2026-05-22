<script lang="ts">
	import type { PageProps } from './$types';
	import {
		ActionSubmitter,
		buildLearningQuizQuestions,
		buildSubmittedAnswersPayload
	} from '$lib/features/learning';
	import { Button, Quiz } from '@learn-anything/ui';
	import type { QuizQuestionResult } from '@learn-anything/ui';
	import { RotateCcw } from '@lucide/svelte';

	let { data, form }: PageProps = $props();
	let topicBaseHref = $derived(`/app/topics/${data.topic.slug}`);

	let answersPayload = $state('[]');
	let submitKey = $state(0);
	let questions = $derived(data.reviewSession?.questions ?? []);
	let reviewQuestions = $derived(buildLearningQuizQuestions(questions));
	let reviewQuestionSetKey = $derived(
		questions.map((question) => `${question.question_id}@${question.version}`).join('|')
	);
	let reasonLabels = $derived([...new Set(questions.map((question) => question.reason_label))]);

	function completeReview(results: QuizQuestionResult[]) {
		answersPayload = buildSubmittedAnswersPayload(questions, results);
		submitKey += 1;
	}
</script>

<main class="page review-page">
	{#if data.reviewSession}
		<section class="review-shell">
			<div class="review-heading">
				<p class="eyebrow">Adaptive review</p>
				<h1>Practice weak skills</h1>
				{#if reasonLabels.length}
					<p>{reasonLabels.join(' · ')}</p>
				{/if}
			</div>

			{#key reviewQuestionSetKey}
				<Quiz questions={reviewQuestions} title="Adaptive review" oncomplete={completeReview} />
			{/key}

			{#if form?.error}
				<p class="message error">{form.error}</p>
			{/if}

			<ActionSubmitter
				action="?/submit"
				{submitKey}
				fields={{
					reviewSessionId: data.reviewSession.session.id,
					answers: answersPayload,
					submissionKey: data.submissionKey
				}}
			/>
		</section>
	{:else}
		<section class="empty-review">
			<RotateCcw size={32} />
			<h1>Adaptive review</h1>
			{#if data.reviewSummary.available}
				<p>
					{data.reviewSummary.reason_label ?? 'Review recommended'} ·
					{data.reviewSummary.question_count} questions
				</p>
				<form method="POST" action="?/start">
					<Button type="submit" label="Start review" />
				</form>
			{:else}
				<p>Complete a {data.topic.name} quiz or diagnostic to unlock personalized review.</p>
				<Button href={topicBaseHref} label="Back to map" />
			{/if}

			{#if form?.error}
				<p class="message error">{form.error}</p>
			{/if}
		</section>
	{/if}
</main>

<style>
	.review-page,
	.review-shell,
	.empty-review {
		display: grid;
		gap: 20px;
	}

	.review-heading,
	.empty-review {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: clamp(20px, 4vw, 32px);
	}

	.review-heading h1,
	.review-heading p,
	.empty-review h1,
	.empty-review p {
		margin: 0;
	}

	.review-heading {
		display: grid;
		gap: 8px;
	}

	.review-heading h1,
	.empty-review h1 {
		font-size: clamp(2rem, 4vw, 3.2rem);
		letter-spacing: 0;
		line-height: 1;
	}

	.review-heading p:not(.eyebrow),
	.empty-review p {
		color: var(--color-text-muted);
	}

	.empty-review {
		align-items: start;
		max-width: 680px;
	}
</style>
