<script lang="ts">
	import ActionSubmitter from './ActionSubmitter.svelte';
	import LessonCheck from './LessonCheck.svelte';
	import { buildSubmittedAnswersPayload } from '../quiz';
	import type { QuizQuestionResult } from '@learn-anything/ui';
	import type { ActionResult } from '@sveltejs/kit';
	import type { LessonInteraction } from '../types';

	type InlineLessonInteractionProps = {
		interaction: LessonInteraction;
		oncompleted?: (slug: string) => void;
	};

	let { interaction, oncompleted }: InlineLessonInteractionProps = $props();

	let answersPayload = $state('[]');
	let error = $state('');
	let locallyCompleted = $state(false);
	let saving = $state(false);
	let currentSubmissionKey = $state('');
	let submitKey = $state(0);
	let completed = $derived(interaction.completed || locallyCompleted);

	function completeInteraction(results: QuizQuestionResult[]) {
		error = '';
		saving = true;
		answersPayload = buildSubmittedAnswersPayload(interaction.questions, results);
		currentSubmissionKey = `${interaction.submissionKey}:${crypto.randomUUID()}`;
		submitKey += 1;
	}

	function handleSubmitResult(result: ActionResult) {
		saving = false;

		if (result.type === 'success') {
			locallyCompleted = true;
			error = '';
			oncompleted?.(interaction.slug);
			return;
		}

		if (result.type === 'failure') {
			error =
				typeof result.data?.error === 'string' ? result.data.error : 'Unable to submit this check.';
			return;
		}

		error = 'Unable to submit this check.';
	}
</script>

<section class="inline-interaction" data-completed={completed}>
	{#key interaction.slug}
		<LessonCheck
			{interaction}
			saved={completed}
			{saving}
			{error}
			oncomplete={completeInteraction}
		/>
	{/key}

	<ActionSubmitter
		action="?/submitInteraction"
		background
		{submitKey}
		fields={{
			interactionSlug: interaction.slug,
			answers: answersPayload,
			submissionKey: currentSubmissionKey
		}}
		onresult={handleSubmitResult}
	/>
</section>

<style>
	.inline-interaction {
		margin-block: 10px;
	}
</style>
