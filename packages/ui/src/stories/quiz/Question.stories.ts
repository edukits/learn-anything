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
