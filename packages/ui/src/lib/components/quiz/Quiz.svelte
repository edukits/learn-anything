<script lang="ts">
	import Assessment from './Assessment.svelte';
	import type { QuizPageLayout, QuizQuestionData, QuizQuestionResult } from './types';

	type QuizProps = {
		questions: QuizQuestionData[];
		title?: string;
		pages?: QuizPageLayout;
		questionsPerPage?: number;
		celebrations?: boolean;
		class?: string;
		onquestionresult?: (result: QuizQuestionResult) => void;
		oncomplete?: (results: QuizQuestionResult[]) => void;
	};

	let {
		questions,
		title,
		pages,
		questionsPerPage = 1,
		celebrations = true,
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
	{celebrations}
	class={className}
	{onquestionresult}
	{oncomplete}
/>
