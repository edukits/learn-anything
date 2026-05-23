<script lang="ts">
	import type { PageProps } from './$types';
	import {
		ActionSubmitter,
		FocusedQuizLayout,
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
	let reviewQuestions = $derived(buildLearningQuizQuestions(questions, { instantFeedback: true }));
	let reviewQuestionSetKey = $derived(
		questions.map((question) => `${question.question_id}@${question.version}`).join('|')
	);
	let reasonLabels = $derived([...new Set(questions.map((question) => question.reason_label))]);

	function completeReview(results: QuizQuestionResult[]) {
		answersPayload = buildSubmittedAnswersPayload(questions, results);
		submitKey += 1;
	}
</script>

<FocusedQuizLayout exitHref={topicBaseHref} exitLabel="Exit review">
	<main class="review-page">
		{#if data.reviewSession}
			<section class="review-shell">
				{#key reviewQuestionSetKey}
					<Quiz questions={reviewQuestions} title="Adaptive review" oncomplete={completeReview} />
				{/key}

				{#if reasonLabels.length}
					<p class="review-context">{reasonLabels.join(' · ')}</p>
				{/if}

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
</FocusedQuizLayout>

<style>
	.review-page,
	.review-shell,
	.empty-review {
		display: grid;
		gap: 20px;
		inline-size: 100%;
	}

	.empty-review {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: clamp(20px, 4vw, 32px);
	}

	.empty-review h1,
	.empty-review p {
		margin: 0;
	}

	.empty-review h1 {
		font-size: clamp(2rem, 4vw, 3.2rem);
		letter-spacing: 0;
		line-height: 1;
	}

	.empty-review p {
		color: var(--color-text-muted);
	}

	.review-context {
		color: var(--color-text-muted);
		font-size: 0.9rem;
		margin: 0;
	}

	.empty-review {
		align-items: start;
		max-width: 680px;
	}
</style>
