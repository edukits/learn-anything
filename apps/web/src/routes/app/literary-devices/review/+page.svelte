<script lang="ts">
	import type { PageProps } from './$types';
	import {
		buildLiteraryDeviceQuizQuestions,
		buildSubmittedAnswersPayload
	} from '$lib/features/literary-devices';
	import { tick } from 'svelte';
	import { Button, Quiz } from '@learn-anything/ui';
	import type { QuizQuestionResult } from '@learn-anything/ui';
	import { RotateCcw } from '@lucide/svelte';

	let { data, form }: PageProps = $props();

	let submitForm = $state<HTMLFormElement>();
	let answersPayload = $state('[]');
	let startingReview = $state(false);
	let questions = $derived(data.reviewSession?.questions ?? []);
	let reviewQuestions = $derived(buildLiteraryDeviceQuizQuestions(questions));
	let reasonLabels = $derived([...new Set(questions.map((question) => question.reason_label))]);

	async function completeReview(results: QuizQuestionResult[]) {
		answersPayload = buildSubmittedAnswersPayload(questions, results);
		await tick();
		submitForm?.requestSubmit();
	}
</script>

<main class="page review-page">
	{#if data.reviewSession}
		<section class="review-shell">
			<div class="review-heading">
				<p class="eyebrow">Adaptive review</p>
				<h1>Practice weak devices</h1>
				{#if reasonLabels.length}
					<p>{reasonLabels.join(' · ')}</p>
				{/if}
			</div>

			<Quiz questions={reviewQuestions} title="Adaptive review" oncomplete={completeReview} />

			{#if form?.error}
				<p class="message error">{form.error}</p>
			{/if}

			<form bind:this={submitForm} class="persist-review" method="POST" action="?/submit">
				<input type="hidden" name="reviewSessionId" value={data.reviewSession.session.id} />
				<input type="hidden" name="answers" value={answersPayload} />
				<input type="hidden" name="submissionKey" value={data.submissionKey} />
			</form>
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
				<form method="POST" action="?/start" onsubmit={() => (startingReview = true)}>
					<Button type="submit" label={startingReview ? 'Starting...' : 'Start review'} disabled={startingReview} />
				</form>
			{:else}
				<p>Complete a Literary Devices quiz to unlock personalized review.</p>
				<Button href="/app/literary-devices" label="Back to map" />
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

	.persist-review {
		display: none;
	}
</style>
