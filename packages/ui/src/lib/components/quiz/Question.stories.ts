import type { Meta, StoryObj } from '@storybook/sveltekit';
import QuizQuestionStory from './QuizQuestionStory.svelte';
import type { MultipleChoiceOptionData } from './types';

const quizOptions: MultipleChoiceOptionData[] = [
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

export const MultipleChoice: Story = {};

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
