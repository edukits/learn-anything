<script lang="ts">
	import type { PageProps } from './$types';
	import {
		buildLiteraryDeviceQuizQuestions,
		buildSubmittedAnswersPayload
	} from '$lib/features/literary-devices';
	import { tick } from 'svelte';
	import { Button, Quiz } from '@learn-anything/ui';
	import type { QuizQuestionResult } from '@learn-anything/ui';
	import { Lock } from '@lucide/svelte';

	let { data, form }: PageProps = $props();

	let submitForm = $state<HTMLFormElement>();
	let answersPayload = $state('[]');
	let quizQuestions = $derived(buildLiteraryDeviceQuizQuestions(data.questions));

	async function completeQuiz(results: QuizQuestionResult[]) {
		answersPayload = buildSubmittedAnswersPayload(data.questions, results);
		await tick();
		submitForm?.requestSubmit();
	}
</script>

<main class="page quiz-page">
	{#if data.locked || !data.quiz}
		<section class="locked">
			<Lock size={32} />
			<h1>Quiz locked</h1>
			<p>Complete the previous path item to unlock this quiz.</p>
			<Button href="/app/literary-devices" label="Back to map" />
		</section>
	{:else}
		<section class="quiz-shell">
			<Quiz questions={quizQuestions} title={data.quiz.title} oncomplete={completeQuiz} />

			{#if form?.error}
				<p class="message error">{form.error}</p>
			{/if}

			<form bind:this={submitForm} class="persist-quiz" method="POST" action="?/submit">
				<input type="hidden" name="answers" value={answersPayload} />
				<input type="hidden" name="submissionKey" value={data.submissionKey} />
			</form>
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

	.persist-quiz {
		display: none;
	}
</style>
