<script lang="ts">
	import type { PageProps } from './$types';
	import {
		ActionSubmitter,
		buildLearningQuizQuestions,
		buildSubmittedAnswersPayload
	} from '$lib/features/learning';
	import { Button, Quiz } from '@learn-anything/ui';
	import type { QuizQuestionResult } from '@learn-anything/ui';
	import { ClipboardList } from '@lucide/svelte';

	let { data, form }: PageProps = $props();
	let topicBaseHref = $derived(`/app/topics/${data.topic.slug}`);
	let answersPayload = $state('[]');
	let submitKey = $state(0);
	let diagnosticQuestions = $derived(buildLearningQuizQuestions(data.questions));
	let diagnosticQuestionSetKey = $derived(
		data.questions.map((question) => `${question.question_id}@${question.version}`).join('|')
	);
	let summary = $derived(form?.summary ?? data.latestSummary);

	function completeDiagnostic(results: QuizQuestionResult[]) {
		answersPayload = buildSubmittedAnswersPayload(data.questions, results);
		submitKey += 1;
	}
</script>

<main class="page diagnostic-page">
	<section>
		<ClipboardList size={32} />
		<p class="eyebrow">{data.topic.name}</p>
		<h1>Diagnostic</h1>
		<p>Answer a short fixed assessment to seed mastery and spaced review for this topic.</p>
		{#if summary}
			<div class="summary" aria-live="polite">
				<strong>{summary.score}%</strong>
				<span>{summary.correctCount} of {summary.questionCount} correct</span>
				<ul>
					{#each summary.outcomes as outcome (outcome.skill_id)}
						<li>
							<span>{outcome.skill_label}</span>
							<em>{outcome.outcome.replaceAll('_', ' ')}</em>
						</li>
					{/each}
				</ul>
			</div>
			<Button href={topicBaseHref} label="Open learning path" />
		{/if}
		{#if form?.error}
			<p class="message error">{form.error}</p>
		{/if}
	</section>

	{#if data.availability.canSubmit}
		{#key diagnosticQuestionSetKey}
			<Quiz
				questions={diagnosticQuestions}
				title={`${data.topic.name} diagnostic`}
				oncomplete={completeDiagnostic}
			/>
		{/key}
		<ActionSubmitter
			action="?/submit"
			{submitKey}
			fields={{
				answers: answersPayload,
				submissionKey: data.submissionKey
			}}
		/>
	{:else if data.availability.reason === 'completed_for_release'}
		<section>
			<h2>Diagnostic complete</h2>
			<p>You can retake this diagnostic when a new content release is published.</p>
			<Button href={topicBaseHref} label="Open learning path" />
		</section>
	{:else}
		<section>
			<h2>No diagnostic questions available</h2>
			<p>This topic can still be started from the beginning.</p>
			<Button href={topicBaseHref} label="Open learning path" />
		</section>
	{/if}
</main>

<style>
	.diagnostic-page {
		display: grid;
		gap: 20px;
		max-inline-size: 720px;
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
		font-size: clamp(2rem, 4vw, 3.2rem);
		letter-spacing: 0;
		line-height: 1;
	}

	section > p:not(.eyebrow) {
		color: var(--color-text-muted);
	}

	.summary {
		border-block-start: 1px solid var(--color-border);
		display: grid;
		gap: 8px;
		padding-block-start: 12px;
	}

	.summary strong {
		font-size: 2rem;
		line-height: 1;
	}

	.summary span,
	.summary em {
		color: var(--color-text-muted);
	}

	ul {
		display: grid;
		gap: 6px;
		list-style: none;
		margin: 0;
		padding: 0;
	}

	li {
		align-items: center;
		display: flex;
		gap: 10px;
		justify-content: space-between;
	}

	h2 {
		font-size: 1.1rem;
		letter-spacing: 0;
		margin: 0;
	}
</style>
