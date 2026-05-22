<script lang="ts">
	import type { PageProps } from './$types';
	import {
		ActionSubmitter,
		ContentIssueReportForm,
		buildLearningQuizQuestions,
		buildSubmittedAnswersPayload
	} from '$lib/features/learning';
	import { Button, Quiz } from '@learn-anything/ui';
	import type { QuizQuestionResult } from '@learn-anything/ui';
	import { Lock } from '@lucide/svelte';

	let { data, form }: PageProps = $props();
	let topicBaseHref = $derived(`/app/topics/${data.topic.slug}`);

	let answersPayload = $state('[]');
	let submitKey = $state(0);
	let quizQuestions = $derived(buildLearningQuizQuestions(data.questions));
	let issueTargets = $derived(
		data.questions.map((question, index) => ({
			value: `quiz_question|${question.question_id}|${question.version}`,
			label: `Question ${index + 1}: ${question.prompt}`
		}))
	);
	let quizQuestionSetKey = $derived(
		data.questions.map((question) => `${question.question_id}@${question.version}`).join('|')
	);

	function completeQuiz(results: QuizQuestionResult[]) {
		answersPayload = buildSubmittedAnswersPayload(data.questions, results);
		submitKey += 1;
	}
</script>

<main class="page quiz-page">
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
				<Quiz questions={quizQuestions} title={data.quiz.title} oncomplete={completeQuiz} />
			{/key}

			{#if form?.error}
				<p class="message error">{form.error}</p>
			{:else if form?.issueReported}
				<p class="message">Issue report sent.</p>
			{/if}

			<ActionSubmitter
				action="?/submit"
				submitKey={submitKey}
				fields={{
					answers: answersPayload,
					submissionKey: data.submissionKey
				}}
			/>

			<ContentIssueReportForm
				contentType="quiz"
				contentId={data.quiz.quiz_id}
				contentVersion={data.quiz.version}
				targets={issueTargets}
				compact
			/>
		</section>
	{/if}
</main>

<style>
	.quiz-page {
		display: grid;
		gap: 20px;
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

</style>
