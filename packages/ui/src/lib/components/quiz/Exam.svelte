<script lang="ts">
	import Assessment from './Assessment.svelte';
	import type { QuizPageLayout, QuizQuestionData, QuizQuestionResult } from './types';

	type ExamProps = {
		questions: QuizQuestionData[];
		title?: string;
		pages?: QuizPageLayout;
		questionsPerPage?: number | 'all';
		celebrations?: boolean;
		class?: string;
		oncomplete?: (results: QuizQuestionResult[]) => void;
	};

	let {
		questions,
		title,
		pages,
		questionsPerPage = 'all',
		celebrations = true,
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
	{celebrations}
	class={className}
	{oncomplete}
/>
