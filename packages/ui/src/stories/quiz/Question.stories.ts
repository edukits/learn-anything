import type { Meta, StoryObj } from '@storybook/sveltekit';
import type { ComponentProps } from 'svelte';
import MultiQuestionSubmitStory from './MultiQuestionSubmitStory.svelte';
import QuizQuestionStory from './QuizQuestionStory.svelte';

type QuizQuestionData = ComponentProps<typeof QuizQuestionStory> & {
	id: string;
};

const quizOptions: ComponentProps<typeof QuizQuestionStory>['options'] = [
	{
		value: '40',
		label: '$40\\text{ km/h}$'
	},
	{
		value: '60',
		label: '$60\\text{ km/h}$'
	},
	{
		value: '100',
		label: '$100\\text{ km/h}$'
	},
	{
		value: '140',
		label: '$140\\text{ km/h}$'
	}
];

const stateDemoOptions: ComponentProps<typeof QuizQuestionStory>['options'] = [
	{
		value: 'retrieval',
		label: 'Retrieval practice',
		description: 'Answering from memory before checking notes.'
	},
	{
		value: 'highlighting',
		label: 'Highlighting',
		description: 'Marking important passages while reading.'
	},
	{
		value: 'rereading',
		label: 'Rereading',
		description: 'Reading the same passage several times in a row.'
	}
];

const quizQuestions: QuizQuestionData[] = [
	{
		id: 'basic-short',
		eyebrow: 'Basic short-answer options',
		question: 'Which planet is known as the Red Planet?',
		options: [
			{
				value: 'a',
				label: 'Earth'
			},
			{
				value: 'b',
				label: 'Mars',
				state: 'correct'
			},
			{
				value: 'c',
				label: 'Venus'
			},
			{
				value: 'd',
				label: 'Jupiter'
			}
		],
		value: null,
		name: 'quiz-basic-short'
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
			},
			{
				value: 'd',
				label:
					'It prevents CSS and JavaScript files from being downloaded, causing the browser to infer layout and interactivity automatically.'
			}
		],
		value: null,
		name: 'quiz-long-options'
	},
	{
		id: 'markdown-inline',
		eyebrow: 'Markdown emphasis in prompt and answers',
		question: 'In JavaScript, what is the main difference between **`==`** and **`===`**?',
		options: [
			{
				value: 'a',
				label: '`==` compares both value and type, while `===` compares only value.'
			},
			{
				value: 'b',
				label: '`==` allows type coercion, while `===` requires both value and type to match.',
				state: 'correct'
			},
			{
				value: 'c',
				label: '`===` is deprecated and should not be used in modern JavaScript.'
			},
			{
				value: 'd',
				label: '`==` only works with strings, while `===` only works with numbers.'
			}
		],
		value: null,
		name: 'quiz-markdown-inline'
	},
	{
		id: 'latex-math',
		eyebrow: 'LaTeX math in prompt and options',
		question: 'Solve for $x$: $$2x + 5 = 17$$',
		options: [
			{
				value: 'a',
				label: '$x = 4$'
			},
			{
				value: 'b',
				label: '$x = 5$'
			},
			{
				value: 'c',
				label: '$x = 6$',
				state: 'correct'
			},
			{
				value: 'd',
				label: '$x = 7$'
			}
		],
		value: null,
		name: 'quiz-latex-math'
	},
	{
		id: 'labels-and-descriptions',
		eyebrow: 'Options with label and description',
		question:
			'Which database index is most appropriate for speeding up equality lookups on a single high-cardinality column?',
		options: [
			{
				value: 'a',
				label: 'B-tree index',
				description: 'A general-purpose index commonly used for equality and range queries.',
				state: 'correct'
			},
			{
				value: 'b',
				label: 'Full-text index',
				description:
					'Optimized for tokenized text search, ranking, stemming, and linguistic matching.'
			},
			{
				value: 'c',
				label: 'Spatial index',
				description:
					'Designed for geometric data such as coordinates, polygons, and bounding boxes.'
			},
			{
				value: 'd',
				label: 'Bitmap index',
				description:
					'Often useful for low-cardinality columns in analytical systems, but less common for transactional high-cardinality lookups.'
			}
		],
		value: null,
		name: 'quiz-labels-and-descriptions'
	},
	{
		id: 'multiline-prompt',
		eyebrow: 'Multiline prompt with code block',
		question:
			'Given the following function:\n\n```ts\nfunction normalize(input?: string) {\n  return input?.trim().toLowerCase() ?? "";\n}\n```\n\nWhat is returned by `normalize("  HELLO  ")`?',
		options: [
			{
				value: 'a',
				label: '`"HELLO"`'
			},
			{
				value: 'b',
				label: '`"hello"`',
				state: 'correct'
			},
			{
				value: 'c',
				label: '`"  hello  "`'
			},
			{
				value: 'd',
				label: '`undefined`'
			}
		],
		value: null,
		name: 'quiz-multiline-prompt'
	},
	{
		id: 'multiline-options',
		eyebrow: 'Multiline option content',
		question:
			'Which sequence best describes a typical request lifecycle in a server-rendered web application?',
		options: [
			{
				value: 'a',
				label:
					'1. Browser sends request\n2. Server fetches data\n3. Server renders HTML\n4. Browser receives and displays page',
				state: 'correct'
			},
			{
				value: 'b',
				label:
					'1. Database renders HTML\n2. Browser compiles SQL\n3. Server downloads CSS\n4. User session is created'
			},
			{
				value: 'c',
				label:
					'1. CSS loads first\n2. HTTP request is skipped\n3. Server mutates the browser DOM\n4. HTML is discarded'
			},
			{
				value: 'd',
				label:
					'1. Browser sends JavaScript to the database\n2. Database runs React\n3. CDN creates user accounts\n4. Server stores pixels'
			}
		],
		value: null,
		name: 'quiz-multiline-options'
	},
	{
		id: 'mixed-markdown-latex',
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
			},
			{
				value: 'd',
				label: "$f'(x) = 0$",
				description: 'That would be true for a constant function, not for $x^2$.'
			}
		],
		value: null,
		name: 'quiz-mixed-markdown-latex'
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
			},
			{
				value: 'd',
				label: 'Ignore support tickets because they are not part of the original metric.'
			}
		],
		value: null,
		name: 'quiz-long-prompt'
	},
	{
		id: 'edge-similar-options',
		eyebrow: 'Subtle differences between options',
		question: 'Which option most accurately defines **idempotency** in API design?',
		options: [
			{
				value: 'a',
				label:
					'An operation is idempotent if making the same request multiple times has the same effect as making it once.',
				state: 'correct'
			},
			{
				value: 'b',
				label:
					'An operation is idempotent if it always returns the exact same response body for every request.'
			},
			{
				value: 'c',
				label: 'An operation is idempotent if it never modifies server-side state.'
			},
			{
				value: 'd',
				label: 'An operation is idempotent if it completes faster after the first request.'
			}
		],
		value: null,
		name: 'quiz-edge-similar-options'
	},
	{
		id: 'special-characters',
		eyebrow: 'Special characters and punctuation',
		question: 'Which string contains characters that commonly need escaping in HTML?',
		options: [
			{
				value: 'a',
				label: '`Tom & Jerry <Cartoon>`',
				state: 'correct'
			},
			{
				value: 'b',
				label: '`plain-text-value`'
			},
			{
				value: 'c',
				label: '`user_name_123`'
			},
			{
				value: 'd',
				label: '`2026-05-20`'
			}
		],
		value: null,
		name: 'quiz-special-characters'
	},
	{
		id: 'none-of-the-above',
		eyebrow: 'None of the above',
		question:
			'Which of the following is a valid CSS property for setting the space between flex items?',
		options: [
			{
				value: 'a',
				label: '`flex-spacing`'
			},
			{
				value: 'b',
				label: '`item-gap`'
			},
			{
				value: 'c',
				label: '`gap`',
				state: 'correct'
			},
			{
				value: 'd',
				label: 'None of the above'
			}
		],
		value: null,
		name: 'quiz-none-of-the-above'
	},
	{
		id: 'all-of-the-above',
		eyebrow: 'All of the above',
		question: 'Which of the following can contribute to poor Core Web Vitals?',
		options: [
			{
				value: 'a',
				label: 'Large render-blocking JavaScript bundles'
			},
			{
				value: 'b',
				label: 'Images without explicit dimensions'
			},
			{
				value: 'c',
				label: 'Slow server response times'
			},
			{
				value: 'd',
				label: 'All of the above',
				state: 'correct'
			}
		],
		value: null,
		name: 'quiz-all-of-the-above'
	},
	{
		id: 'many-options',
		eyebrow: 'More than four options',
		question: 'Which HTTP status code means the requested resource was not found?',
		options: [
			{
				value: 'a',
				label: '200 OK'
			},
			{
				value: 'b',
				label: '201 Created'
			},
			{
				value: 'c',
				label: '301 Moved Permanently'
			},
			{
				value: 'd',
				label: '400 Bad Request'
			},
			{
				value: 'e',
				label: '401 Unauthorized'
			},
			{
				value: 'f',
				label: '403 Forbidden'
			},
			{
				value: 'g',
				label: '404 Not Found',
				state: 'correct'
			},
			{
				value: 'h',
				label: '500 Internal Server Error'
			}
		],
		value: null,
		name: 'quiz-many-options'
	},
	{
		id: 'single-word-options',
		eyebrow: 'Very short labels',
		question: 'Which word is a noun?',
		options: [
			{
				value: 'a',
				label: 'Run'
			},
			{
				value: 'b',
				label: 'Quickly'
			},
			{
				value: 'c',
				label: 'Table',
				state: 'correct'
			},
			{
				value: 'd',
				label: 'Blue'
			}
		],
		value: null,
		name: 'quiz-single-word-options'
	},
	{
		id: 'accessibility-copy',
		eyebrow: 'Accessibility-focused content',
		question:
			'Which option is the best accessible label for a button that removes an item named "Quarterly Budget.xlsx" from a list?',
		options: [
			{
				value: 'a',
				label: 'Delete'
			},
			{
				value: 'b',
				label: 'Remove file'
			},
			{
				value: 'c',
				label: 'Remove Quarterly Budget.xlsx',
				state: 'correct'
			},
			{
				value: 'd',
				label: 'Click here'
			}
		],
		value: null,
		name: 'quiz-accessibility-copy'
	},
	{
		id: 'table-like-markdown',
		eyebrow: 'Markdown table in prompt',
		question:
			'A test produced the following confusion matrix:\n\n|                | Predicted Positive | Predicted Negative |\n|----------------|--------------------|--------------------|\n| Actual Positive | 80                 | 20                 |\n| Actual Negative | 10                 | 90                 |\n\nWhat is the precision?',
		options: [
			{
				value: 'a',
				label: '$\\frac{80}{80 + 10} = 88.9\\%$',
				state: 'correct'
			},
			{
				value: 'b',
				label: '$\\frac{80}{80 + 20} = 80\\%$'
			},
			{
				value: 'c',
				label: '$\\frac{90}{90 + 10} = 90\\%$'
			},
			{
				value: 'd',
				label: '$\\frac{80 + 90}{200} = 85\\%$'
			}
		],
		value: null,
		name: 'quiz-table-like-markdown'
	},
	{
		id: 'option-with-nested-list',
		eyebrow: 'Option descriptions with nested markdown lists',
		question: 'Which migration plan is safest for a production database schema change?',
		options: [
			{
				value: 'a',
				label: 'Single-step destructive migration',
				description:
					'- Drop the old column immediately\n- Deploy new code afterward\n- Hope no rollback is needed'
			},
			{
				value: 'b',
				label: 'Expand-and-contract migration',
				description:
					'- Add the new schema alongside the old one\n- Backfill data\n- Deploy code that reads the new shape\n- Remove the old schema after verification',
				state: 'correct'
			},
			{
				value: 'c',
				label: 'Manual hotfix in production',
				description: '- Edit records directly\n- Skip review\n- Avoid automated checks'
			},
			{
				value: 'd',
				label: 'Disable backups first',
				description: '- Reduces storage use\n- Increases operational risk'
			}
		],
		value: null,
		name: 'quiz-option-with-nested-list'
	},
	{
		id: 'unicode-and-i18n',
		eyebrow: 'Unicode and international text',
		question: 'Which greeting is written in Japanese?',
		options: [
			{
				value: 'a',
				label: 'Hola'
			},
			{
				value: 'b',
				label: 'Bonjour'
			},
			{
				value: 'c',
				label: 'こんにちは',
				state: 'correct'
			},
			{
				value: 'd',
				label: 'Guten Tag'
			}
		],
		value: null,
		name: 'quiz-unicode-and-i18n'
	},
	{
		id: 'negative-question',
		eyebrow: 'Negated prompt',
		question: 'Which of the following is **not** a valid reason to add automated tests?',
		options: [
			{
				value: 'a',
				label: 'To catch regressions before deployment'
			},
			{
				value: 'b',
				label: 'To document expected behavior'
			},
			{
				value: 'c',
				label: 'To make incorrect code correct automatically',
				state: 'correct'
			},
			{
				value: 'd',
				label: 'To support safer refactoring'
			}
		],
		value: null,
		name: 'quiz-negative-question'
	}
];

type QuizQuestionId = string;
type QuizStressArgs = ComponentProps<typeof QuizQuestionStory> & {
	quizQuestionId: QuizQuestionId;
};

const quizQuestionLabels = Object.fromEntries(
	quizQuestions.map((quizQuestion) => [quizQuestion.id, quizQuestion.eyebrow ?? quizQuestion.id])
);

function getQuizQuestion(quizQuestionId: QuizQuestionId) {
	return (
		quizQuestions.find((quizQuestion) => quizQuestion.id === quizQuestionId) ?? quizQuestions[0]
	);
}

const meta = {
	title: 'Components/Quiz/Question',
	component: QuizQuestionStory,
	tags: ['autodocs'],
	args: {
		eyebrow: 'Physics',
		question: 'Question 1',
		description:
			'A satellite detects a large spaceship coming towards it at $60\\text{ km/h}$ and a tiny asteroid coming from the exact opposite direction at $100\\text{ km/h}$.\n\nHow quickly is the asteroid approaching the spaceship?',
		options: quizOptions,
		value: null,
		name: 'retention-question'
	},
	argTypes: {
		value: {
			control: 'select',
			options: [null, ...quizOptions.map((option) => option.value)]
		},
		disabled: {
			control: 'boolean'
		}
	}
} satisfies Meta<typeof QuizQuestionStory>;

export default meta;
type Story = StoryObj<typeof meta>;
type MultiQuestionStory = StoryObj<typeof MultiQuestionSubmitStory>;

export const MultipleChoice: Story = {};

export const InstantSubmitCorrectSelected: Story = {
	args: {
		eyebrow: 'Instant submit',
		question: 'Which strategy best strengthens long-term recall?',
        description: null,
		options: stateDemoOptions,
		value: null,
		name: 'instant-submit-correct',
		interactionMode: 'instant-submit',
		correctValue: 'retrieval',
		submitted: false
	}
};

export const InstantSubmitIncorrectSelected: Story = {
	args: {
		eyebrow: 'Instant submit',
		question: 'Which strategy best strengthens long-term recall?',
        description: null,
		options: stateDemoOptions,
		value: 'highlighting',
		name: 'instant-submit-incorrect',
		interactionMode: 'instant-submit',
		correctValue: 'retrieval',
		submitted: true
	}
};

export const SubmitBasedBeforeSubmission: Story = {
	args: {
		eyebrow: 'Submit based',
		question: 'Which strategy best strengthens long-term recall?',
        description: null,
		options: stateDemoOptions,
		value: 'highlighting',
		name: 'submit-based-before',
		correctValue: 'retrieval',
		showSubmitButton: true,
		submitted: false
	}
};

export const SubmitBasedCorrectSubmission: Story = {
	args: {
		eyebrow: 'Submit based',
		question: 'Which strategy best strengthens long-term recall?',
        description: null,
        options: stateDemoOptions,
		value: 'retrieval',
		name: 'submit-based-correct',
		correctValue: 'retrieval',
		showSubmitButton: true,
		submitted: true
	}
};

export const SubmitBasedIncorrectSubmission: Story = {
	args: {
		eyebrow: 'Submit based',
		question: 'Which strategy best strengthens long-term recall?',
        description: null,
        options: stateDemoOptions,
		value: 'highlighting',
		name: 'submit-based-incorrect',
		correctValue: 'retrieval',
		showSubmitButton: true,
		submitted: true
	}
};

export const MultiQuestionSubmitFlow: MultiQuestionStory = {
	render: () => ({
		Component: MultiQuestionSubmitStory
	})
};

export const WithSelection: Story = {
	args: {
		value: 'spacing'
	}
};

export const LongMathProblem: Story = {
	args: {
		eyebrow: 'Relative motion',
		question:
			'A satellite detects a large spaceship coming towards it at $60\\text{ km/h}$ and a tiny asteroid coming from the exact opposite direction at $100\\text{ km/h}$.\n\nHow quickly is the asteroid approaching the spaceship?',
		description: 'Use the relative speed of objects moving toward each other: \\( v_1 + v_2 \\).',
		options: [
			{
				value: '40',
				label: '$40\\text{ km/h}$'
			},
			{
				value: '100',
				description: '$100\\text{ km/h}$'
			},
			{
				value: '160',
				label: '$160\\text{ km/h}$',
				description: 'The speeds add because the objects are moving toward one another.'
			}
		],
		value: null,
		name: 'relative-speed-question'
	}
};

export const Disabled: Story = {
	args: {
		value: 'spacing',
		disabled: true
	}
};

export const StressCases: StoryObj<QuizStressArgs> = {
	args: {
		quizQuestionId: 'basic-short',
		disabled: false
	},
	argTypes: {
		quizQuestionId: {
			control: 'select',
			options: quizQuestions.map((quizQuestion) => quizQuestion.id),
			labels: quizQuestionLabels
		},
		disabled: {
			control: 'boolean'
		}
	},
	render: ({ quizQuestionId, disabled }) => {
		const quizQuestion = getQuizQuestion(quizQuestionId);

		return {
			Component: QuizQuestionStory,
			props: {
				eyebrow: quizQuestion.eyebrow,
				question: quizQuestion.question,
				description: quizQuestion.description,
				options: quizQuestion.options,
				value: quizQuestion.value,
				name: quizQuestion.name,
				quizQuestionId,
				disabled
			}
		};
	}
};
