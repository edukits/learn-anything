<script lang="ts">
	import type { PageProps } from './$types';
	import {
		ActionSubmitter,
		ContentIssueReportForm,
		FocusedQuizLayout,
		buildLearningQuizQuestions,
		buildSubmittedAnswersPayload
	} from '$lib/features/learning';
	import { Button, Quiz } from '@learn-anything/ui';
	import type { QuizQuestionResult } from '@learn-anything/ui';
	import { Popover } from 'bits-ui';
	import { Flag, Lock } from '@lucide/svelte';

	let { data, form }: PageProps = $props();
	let topicBaseHref = $derived(`/app/topics/${data.topic.slug}`);

	let answersPayload = $state('[]');
	let submitKey = $state(0);
	let currentQuestionIndex = $state(0);
	let quizQuestions = $derived(
		buildLearningQuizQuestions(data.questions, {
			instantFeedback: true,
			shuffleSeed: data.submissionKey
		})
	);
	let issueTargets = $derived(
		data.questions.map((question, index) => ({
			value: `quiz_question|${question.question_id}|${question.version}`,
			label: `Question ${index + 1}: ${question.prompt}`
		}))
	);
	let currentIssueTarget = $derived(
		issueTargets[currentQuestionIndex] ? [issueTargets[currentQuestionIndex]] : []
	);
	let quizQuestionSetKey = $derived(
		data.questions.map((question) => `${question.question_id}@${question.version}`).join('|')
	);

	function completeQuiz(results: QuizQuestionResult[]) {
		answersPayload = buildSubmittedAnswersPayload(data.questions, results);
		submitKey += 1;
	}
</script>

<FocusedQuizLayout exitHref={topicBaseHref}>
	<main class="quiz-page">
		{#if data.locked || !data.quiz}
			<section class="locked">
				<Lock size={32} />
				<h1>Quiz locked</h1>
				<p>Complete the previous path item to unlock this quiz.</p>
				<Button href={topicBaseHref} label="Back to map" />
			</section>
		{:else}
			<section class="quiz-shell">
				{#key quizQuestionSetKey}
					<Quiz
						questions={quizQuestions}
						title={data.quiz.title}
						bind:currentPageIndex={currentQuestionIndex}
						oncomplete={completeQuiz}
					/>
				{/key}

				{#if form?.error}
					<p class="message error">{form.error}</p>
				{:else if form?.issueReported}
					<p class="message">Issue report sent.</p>
				{/if}

				<ActionSubmitter
					action="?/submit"
					{submitKey}
					fields={{
						answers: answersPayload,
						submissionKey: data.submissionKey
					}}
				/>

				<div class="quiz-actions">
					<Popover.Root>
						<Popover.Trigger class="report-trigger" aria-label="Report an issue">
							<Flag size={16} strokeWidth={2.25} aria-hidden="true" />
						</Popover.Trigger>
						<Popover.Portal>
							<Popover.Content class="report-popover" sideOffset={8} side="top" align="start">
								<ContentIssueReportForm
									contentType="quiz"
									contentId={data.quiz.quiz_id}
									contentVersion={data.quiz.version}
									targets={currentIssueTarget}
									compact
								/>
							</Popover.Content>
						</Popover.Portal>
					</Popover.Root>
				</div>
			</section>
		{/if}
	</main>
</FocusedQuizLayout>

<style>
	.quiz-page {
		display: grid;
		gap: 20px;
		inline-size: 100%;
	}

	.locked {
		align-items: start;
		display: grid;
		gap: 14px;
		padding: 28px;
	}

	.locked h1,
	.locked p {
		margin: 0;
	}

	.quiz-shell {
		display: grid;
		gap: 2rem;
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

	.quiz-actions {
		display: flex;
		justify-content: flex-start;
	}

	:global(.report-trigger) {
		align-items: center;
		appearance: none;
		background: transparent;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		color: var(--color-text-muted);
		cursor: pointer;
		display: inline-flex;
		justify-content: center;
		min-block-size: 2.5rem;
		min-inline-size: 2.5rem;
		transition:
			color 120ms ease-out,
			border-color 120ms ease-out;
	}

	:global(.report-trigger:hover) {
		border-color: var(--color-text-muted);
		color: var(--color-text);
	}

	:global(.report-trigger:focus-visible) {
		outline: 3px solid color-mix(in srgb, var(--color-focus), transparent 40%);
		outline-offset: 2px;
	}

	:global(.report-popover) {
		background: var(--color-surface-raised);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		box-shadow: 0 8px 24px hsl(0 0% 0% / 0.12);
		padding: 4px;
		width: min(360px, 90vw);
		z-index: 50;
	}
</style>
