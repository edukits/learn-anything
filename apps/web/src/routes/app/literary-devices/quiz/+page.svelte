<script lang="ts">
	import { Button, MultipleChoice } from '@learn-anything/ui';
	import { ArrowLeft, ArrowRight, CheckCircle2, Lock } from '@lucide/svelte';

	let { data, form } = $props();

	let currentIndex = $state(0);
	let selections = $state<Record<string, string>>({});
	let submitted = $state<Record<string, boolean>>({});

	let currentQuestion = $derived(data.questions[currentIndex]);
	let currentSelection = $derived(currentQuestion ? (selections[currentQuestion.question_id] ?? null) : null);
	let currentSubmitted = $derived(currentQuestion ? Boolean(submitted[currentQuestion.question_id]) : false);
	let answeredCount = $derived(data.questions.filter((question) => submitted[question.question_id]).length);
	let allAnswered = $derived(answeredCount === data.questions.length);
	let answersPayload = $derived(
		JSON.stringify(
			data.questions.map((question) => ({
				questionId: question.question_id,
				selectedChoiceId: selections[question.question_id] ?? ''
			}))
		)
	);

	function selectAnswer(questionId: string, value: string) {
		selections[questionId] = value;
	}

	function markSubmitted(questionId: string) {
		submitted[questionId] = true;
	}

	function next() {
		currentIndex = Math.min(currentIndex + 1, data.questions.length - 1);
	}

	function previous() {
		currentIndex = Math.max(currentIndex - 1, 0);
	}
</script>

<main class="page quiz-page">
	{#if data.locked}
		<section class="surface locked">
			<Lock size={32} />
			<h1>Quiz locked</h1>
			<p>Complete the intro lesson to unlock mixed practice.</p>
			<Button href="/app/literary-devices/intro" label="Go to lesson" />
		</section>
	{:else if currentQuestion}
		<section class="quiz-shell">
			<div class="quiz-top">
				<div>
					<p class="eyebrow">Question {currentIndex + 1} / {data.questions.length}</p>
					<h1>{data.quiz.title}</h1>
				</div>
				<div class="pill">{answeredCount} answered</div>
			</div>

			<article class="surface question-card">
				<p class="tag">{currentQuestion.device} · {currentQuestion.question_type}</p>
				<h2>{currentQuestion.prompt}</h2>

				<MultipleChoice
					name={`question-${currentQuestion.question_id}`}
					options={currentQuestion.choices.map((choice) => ({ value: choice.id, label: choice.label }))}
					value={currentSelection}
					correctValue={currentQuestion.correct_choice_id}
					interactionMode="instant-submit"
					submitted={currentSubmitted}
					onselect={(value) => selectAnswer(currentQuestion.question_id, value)}
					onsubmit={() => markSubmitted(currentQuestion.question_id)}
				/>

				{#if currentSubmitted}
					<div class="feedback">
						<CheckCircle2 size={22} />
						<p>{currentQuestion.explanation}</p>
					</div>
				{/if}
			</article>

			{#if form?.error}
				<p class="message error">{form.error}</p>
			{/if}

			<div class="quiz-actions">
				<Button variant="secondary" type="button" onclick={previous} disabled={currentIndex === 0}>
					<ArrowLeft size={18} /> Previous
				</Button>
				{#if currentIndex < data.questions.length - 1}
					<Button type="button" onclick={next} disabled={!currentSubmitted}>
						Next <ArrowRight size={18} />
					</Button>
				{:else}
					<form method="POST" action="?/submit">
						<input type="hidden" name="answers" value={answersPayload} />
						<Button type="submit" disabled={!allAnswered} label="Finish quiz" />
					</form>
				{/if}
			</div>
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

	.quiz-top {
		align-items: end;
		display: flex;
		gap: 18px;
		justify-content: space-between;
	}

	h1,
	h2,
	p {
		margin: 0;
	}

	h1 {
		font-size: clamp(2rem, 4vw, 3.4rem);
		letter-spacing: 0;
		line-height: 1;
	}

	h2 {
		font-size: clamp(1.35rem, 3vw, 2.2rem);
		letter-spacing: 0;
		line-height: 1.15;
	}

	.pill,
	.tag {
		background: var(--color-surface-accent);
		border-radius: 999px;
		color: var(--color-text);
		font-size: 0.9rem;
		font-weight: 760;
		padding: 7px 12px;
	}

	.tag {
		inline-size: fit-content;
		text-transform: capitalize;
	}

	.question-card {
		display: grid;
		gap: 22px;
	}

	.feedback {
		align-items: start;
		background: color-mix(in srgb, var(--color-correct), transparent 90%);
		border: 1px solid color-mix(in srgb, var(--color-correct), transparent 55%);
		border-radius: var(--radius-md);
		color: var(--color-text);
		display: grid;
		gap: 10px;
		grid-template-columns: auto 1fr;
		padding: 14px;
	}

	.quiz-actions {
		align-items: center;
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		justify-content: space-between;
	}

	form {
		margin-inline-start: auto;
	}

	@media (max-width: 700px) {
		.quiz-top {
			align-items: start;
			flex-direction: column;
		}

		.quiz-actions {
			justify-content: start;
		}

		form {
			margin-inline-start: 0;
		}
	}
</style>
