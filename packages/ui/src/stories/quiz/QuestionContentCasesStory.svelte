<script lang="ts">
	import QuizQuestionStory from './QuizQuestionStory.svelte';
	import type { MultipleChoiceOptionData } from '../../lib/components/quiz/types';

	type ContentCase = {
		id: string;
		eyebrow: string;
		question: string;
		description?: string;
		options: MultipleChoiceOptionData[];
		value: string | null;
		name: string;
	};

	type Props = {
		contentCaseId?: string;
		disabled?: boolean;
	};

	const contentCases: ContentCase[] = [
		{
			id: 'short',
			eyebrow: 'Basic short-answer options',
			question: 'Which planet is known as the Red Planet?',
			options: [
				{ value: 'a', label: 'Earth' },
				{ value: 'b', label: 'Mars', state: 'correct' },
				{ value: 'c', label: 'Venus' },
				{ value: 'd', label: 'Jupiter' }
			],
			value: null,
			name: 'quiz-short'
		},
		{
			id: 'long-options',
			eyebrow: 'Very long response labels',
			question:
				'Which answer best explains why HTTP caching can improve perceived application performance?',
			options: [
				{
					value: 'a',
					label:
						'It allows browsers and intermediate caches to reuse previously fetched resources, reducing network requests, latency, server load, and the amount of data transferred.',
					state: 'correct'
				},
				{
					value: 'b',
					label:
						'It forces every request to bypass the browser cache so that the application always receives the newest possible data from the origin server.'
				},
				{
					value: 'c',
					label:
						'It encrypts all assets before storing them locally, which directly increases the rendering speed of JavaScript-heavy pages.'
				}
			],
			value: null,
			name: 'quiz-long-options'
		},
		{
			id: 'rich-content',
			eyebrow: 'Mixed markdown and LaTeX',
			question: 'Which statement about the derivative of $f(x) = x^2$ is correct?',
			options: [
				{
					value: 'a',
					label: "**Correct:** $f'(x) = 2x$",
					description: 'Using the power rule, $\\frac{d}{dx}x^n = nx^{n-1}$.',
					state: 'correct'
				},
				{
					value: 'b',
					label: "*Almost:* $f'(x) = x$",
					description: 'This misses the coefficient introduced by the power rule.'
				},
				{
					value: 'c',
					label: "`Incorrect:` $f'(x) = x^3$",
					description: 'This increases the exponent rather than reducing it.'
				}
			],
			value: null,
			name: 'quiz-rich-content'
		},
		{
			id: 'code-block',
			eyebrow: 'Multiline prompt with code block',
			question:
				'Given the following function:\n\n```ts\nfunction normalize(input?: string) {\n  return input?.trim().toLowerCase() ?? "";\n}\n```\n\nWhat is returned by `normalize("  HELLO  ")`?',
			options: [
				{ value: 'a', label: '`"HELLO"`' },
				{ value: 'b', label: '`"hello"`', state: 'correct' },
				{ value: 'c', label: '`"  hello  "`' },
				{ value: 'd', label: '`undefined`' }
			],
			value: null,
			name: 'quiz-code-block'
		},
		{
			id: 'many-options',
			eyebrow: 'More than four options',
			question: 'Which HTTP status code means the requested resource was not found?',
			options: [
				{ value: 'a', label: '200 OK' },
				{ value: 'b', label: '201 Created' },
				{ value: 'c', label: '301 Moved Permanently' },
				{ value: 'd', label: '400 Bad Request' },
				{ value: 'e', label: '401 Unauthorized' },
				{ value: 'f', label: '403 Forbidden' },
				{ value: 'g', label: '404 Not Found', state: 'correct' },
				{ value: 'h', label: '500 Internal Server Error' }
			],
			value: null,
			name: 'quiz-many-options'
		},
		{
			id: 'long-prompt',
			eyebrow: 'Long prompt with scenario',
			question:
				'A product team ships a new onboarding flow. After launch, completion rate improves from 42% to 48%, but support tickets mentioning account setup also increase by 30%. The team wants to understand whether the new flow is genuinely better or whether it is pushing confused users further into the funnel before they ask for help. Which next step is the most analytically sound?',
			options: [
				{
					value: 'a',
					label: 'Declare the experiment successful because the completion rate increased.'
				},
				{
					value: 'b',
					label:
						'Roll back immediately because any increase in support tickets proves the new flow is worse.'
				},
				{
					value: 'c',
					label:
						'Segment the results, inspect qualitative ticket themes, and compare downstream activation or retention before deciding.',
					state: 'correct'
				}
			],
			value: null,
			name: 'quiz-long-prompt'
		}
	];

	let { contentCaseId = 'short', disabled = false }: Props = $props();
	let contentCase = $derived(
		contentCases.find((candidate) => candidate.id === contentCaseId) ?? contentCases[0]
	);
</script>

<QuizQuestionStory
	eyebrow={contentCase.eyebrow}
	question={contentCase.question}
	description={contentCase.description}
	options={contentCase.options}
	value={contentCase.value}
	name={contentCase.name}
	{disabled}
/>
