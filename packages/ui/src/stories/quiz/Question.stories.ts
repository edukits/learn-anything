import type { Meta, StoryObj } from '@storybook/sveltekit';
import MultiQuestionSubmitStory from './MultiQuestionSubmitStory.svelte';
import QuestionContentCasesStory from './QuestionContentCasesStory.svelte';
import QuestionStateGalleryStory from './QuestionStateGalleryStory.svelte';
import QuizQuestionStory from './QuizQuestionStory.svelte';

const defaultQuestion = {
	eyebrow: 'Physics',
	question: 'Question 1',
	description:
		'A satellite detects a large spaceship coming towards it at $60\\text{ km/h}$ and a tiny asteroid coming from the exact opposite direction at $100\\text{ km/h}$.\n\nHow quickly is the asteroid approaching the spaceship?',
	options: [
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
	],
	value: null,
	name: 'retention-question',
	correctValue: '100',
	showSubmitButton: true,
	submitted: false
};

const contentCaseIds = [
	'short',
	'long-options',
	'rich-content',
	'code-block',
	'many-options',
	'long-prompt'
];
const contentCaseLabels = {
	short: 'Short prompt',
	'long-options': 'Long options',
	'rich-content': 'Markdown and math',
	'code-block': 'Code block prompt',
	'many-options': 'Many options',
	'long-prompt': 'Long scenario'
};

const meta = {
	title: 'Components/Quiz/Question',
	component: QuizQuestionStory,
	tags: ['autodocs'],
	args: defaultQuestion,
	argTypes: {
		value: {
			control: 'select',
			options: [null, ...defaultQuestion.options.map((option) => option.value)]
		},
		interactionMode: {
			control: 'inline-radio',
			options: ['submit', 'instant-submit']
		},
		submitted: {
			control: 'boolean'
		},
		showSubmitButton: {
			control: 'boolean'
		},
		disabled: {
			control: 'boolean'
		}
	}
} satisfies Meta<typeof QuizQuestionStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const MultipleSelect: Story = {
	args: {
		eyebrow: 'Learning science',
		question: 'Which strategies usually improve long-term recall?',
		description: 'Select every strategy that applies.',
		name: 'retention-multiple-select',
		showSubmitButton: true,
		submitted: false,
		response: {
			type: 'multiple-select',
			value: ['retrieval'],
			correctValues: ['retrieval', 'spacing'],
			options: [
				{
					value: 'retrieval',
					label: 'Retrieval practice',
					description: 'Trying to answer from memory before checking notes.'
				},
				{
					value: 'spacing',
					label: 'Spaced repetition',
					description: 'Reviewing material across multiple sessions with time between them.'
				},
				{
					value: 'highlighting',
					label: 'Highlighting',
					description: 'Marking sentences while reading a chapter.'
				},
				{
					value: 'rereading',
					label: 'Rereading',
					description: 'Reading the same passage several times in a row.'
				}
			]
		}
	}
};

export const ShortAnswer: Story = {
	args: {
		eyebrow: 'Physics',
		question: 'What unit is used to measure force?',
		description: 'Use the singular SI unit name.',
		name: 'force-unit-short-answer',
		showSubmitButton: true,
		submitted: false,
		response: {
			type: 'short-answer',
			value: '',
			placeholder: 'Type the unit',
			acceptedAnswers: ['newton', 'N'],
			matchMode: 'case-insensitive'
		}
	}
};

export const NumericAnswer: Story = {
	args: {
		eyebrow: 'Physics',
		question: 'A cyclist travels 1.2 kilometers in 4 minutes. What is their average speed?',
		description: 'Answer in meters per second or an equivalent listed unit.',
		name: 'average-speed-numeric',
		showSubmitButton: true,
		submitted: false,
		response: {
			type: 'numeric',
			value: '',
			unit: 'm/s',
			placeholder: '0.0',
			unitConfig: {
				mode: 'select',
				side: 'right',
				value: 'm/s',
				options: [
					{
						value: 'm/s',
						label: 'm/s',
						aliases: ['meters per second'],
						multiplier: 1
					},
					{
						value: 'km/h',
						label: 'km/h',
						aliases: ['kilometers per hour'],
						multiplier: 1 / 3.6
					}
				]
			},
			acceptedValues: [
				{
					value: 5,
					unit: 'm/s',
					tolerance: { type: 'relative', value: 0.01 },
					precision: { type: 'significant-figures', value: 2, mode: 'at-least' },
					feedback: 'Within 1% and with enough precision.'
				}
			]
		}
	}
};

export const NumericCurrency: Story = {
	args: {
		eyebrow: 'Finance',
		question: 'A notebook costs $3.75 and a pen costs $1.20. What is the total?',
		name: 'currency-numeric',
		showSubmitButton: true,
		submitted: false,
		response: {
			type: 'numeric',
			value: '',
			placeholder: '0.00',
			unitConfig: {
				mode: 'fixed',
				side: 'left',
				value: '$'
			},
			acceptedValues: [
				{
					value: 4.95,
					tolerance: { type: 'absolute', value: 0.005 },
					precision: { type: 'decimal-places', value: 2 }
				}
			]
		}
	}
};

export const MathAnswer: Story = {
	args: {
		eyebrow: 'Algebra',
		question: 'Factor $x^2 + 3x + 2$.',
		description: 'Enter an algebraic expression.',
		name: 'factor-expression-math',
		showSubmitButton: true,
		submitted: false,
		response: {
			type: 'math',
			value: '',
			placeholder: 'Type a factored expression',
			acceptedValues: [
				{
					latex: '(x+1)(x+2)',
					feedback: 'Matches the configured factored form.'
				}
			]
		}
	}
};

export const MathVectorTemplate: Story = {
	args: {
		eyebrow: 'Linear algebra',
		question: 'Write the vector with horizontal component 3 and vertical component -2.',
		description: 'The vector structure is part of the answer template.',
		name: 'vector-template-math',
		showSubmitButton: true,
		submitted: false,
		response: {
			type: 'math',
			value: '\\begin{bmatrix}\\placeholder[x]{}\\\\\\placeholder[y]{}\\end{bmatrix}',
			template: '\\begin{bmatrix}\\placeholder[x]{}\\\\\\placeholder[y]{}\\end{bmatrix}',
			acceptedValues: [
				{
					prompts: {
						x: '3',
						y: '-2'
					},
					feedback: 'Both components match the configured vector.'
				}
			]
		}
	}
};

export const Sequencing: Story = {
	args: {
		eyebrow: 'Learning science',
		question: 'Put the study routine in the order that best supports recall.',
		description: 'Drag the cards into sequence, or use the arrow controls.',
		name: 'study-routine-sequencing',
		showSubmitButton: true,
		submitted: false,
		response: {
			type: 'sequencing',
			value: ['question', 'preview', 'read', 'recall'],
			correctOrder: ['preview', 'question', 'read', 'recall'],
			items: [
				{
					value: 'preview',
					label: 'Preview',
					description: 'Skim headings, examples, and diagrams before reading closely.'
				},
				{
					value: 'question',
					label: 'Question',
					description: 'Turn the section heading into a question.'
				},
				{
					value: 'read',
					label: 'Read',
					description: 'Read the section with the question in mind.'
				},
				{
					value: 'recall',
					label: 'Recall',
					description: 'Close the text and retrieve the answer from memory.'
				}
			]
		}
	}
};

export const StateGallery: StoryObj<typeof QuestionStateGalleryStory> = {
	render: () => ({
		Component: QuestionStateGalleryStory
	})
};

export const MultiQuestionSubmitFlow: StoryObj<typeof MultiQuestionSubmitStory> = {
	render: () => ({
		Component: MultiQuestionSubmitStory
	})
};

export const ContentCases: StoryObj<typeof QuestionContentCasesStory> = {
	args: {
		contentCaseId: 'short',
		disabled: false
	},
	argTypes: {
		contentCaseId: {
			control: 'select',
			options: contentCaseIds,
			labels: contentCaseLabels
		},
		disabled: {
			control: 'boolean'
		}
	},
	render: (args) => ({
		Component: QuestionContentCasesStory,
		props: args
	})
};
