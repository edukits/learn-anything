<script lang="ts">
	import Assessment from './Assessment.svelte';
	import type { QuizPageLayout, QuizQuestionData, QuizQuestionResult } from './types';

	type QuizProps = {
		questions: QuizQuestionData[];
		title?: string;
		pages?: QuizPageLayout;
		questionsPerPage?: number;
		class?: string;
		onquestionresult?: (result: QuizQuestionResult) => void;
		oncomplete?: (results: QuizQuestionResult[]) => void;
	};

	let {
		questions,
		title,
		pages,
		questionsPerPage = 1,
		class: className = '',
		onquestionresult,
		oncomplete
	}: QuizProps = $props();
</script>

<Assessment
	mode="quiz"
	{questions}
	{title}
	{pages}
	{questionsPerPage}
	class={className}
	{onquestionresult}
	{oncomplete}
/>
