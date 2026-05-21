<script lang="ts">
	import Assessment from './Assessment.svelte';
	import type { QuizPageLayout, QuizQuestionData, QuizQuestionResult } from './types';

	type ExamProps = {
		questions: QuizQuestionData[];
		title?: string;
		pages?: QuizPageLayout;
		questionsPerPage?: number | 'all';
		class?: string;
		oncomplete?: (results: QuizQuestionResult[]) => void;
	};

	let {
		questions,
		title,
		pages,
		questionsPerPage = 'all',
		class: className = '',
		oncomplete
	}: ExamProps = $props();
</script>

<Assessment
	mode="exam"
	{questions}
	{title}
	{pages}
	{questionsPerPage}
	class={className}
	{oncomplete}
/>
