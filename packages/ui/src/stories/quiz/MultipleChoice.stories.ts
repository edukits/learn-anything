import type { Meta, StoryObj } from '@storybook/sveltekit';
import MultipleChoice from '../../lib/components/quiz/MultipleChoice.svelte';
import type { MultipleChoiceOptionData } from '../../lib/components/quiz/types';

const defaultOptions: MultipleChoiceOptionData[] = [
	{
		value: 'retrieval',
		label: 'Retrieval practice',
		description: 'Pulling an answer from memory before checking notes or examples.'
	},
	{
		value: 'highlighting',
		label: 'Highlighting',
		description: 'Marking important sentences while reading a chapter.'
	},
	{
		value: 'rereading',
		label: 'Rereading',
		description: 'Going back through the same passage several times.'
	}
];

const meta = {
	title: 'Components/Quiz/MultipleChoice',
	component: MultipleChoice,
	tags: ['autodocs'],
	args: {
		options: defaultOptions,
		value: 'retrieval',
		name: 'learning-strategy',
		legend: 'Choose a learning strategy'
	},
	argTypes: {
		value: {
			control: 'select',
			options: defaultOptions.map((option) => option.value)
		},
		disabled: {
			control: 'boolean'
		},
		celebrations: {
			control: 'boolean'
		}
	}
} satisfies Meta<typeof MultipleChoice>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const EmptySelection: Story = {
	args: {
		value: null
	}
};

export const Reviewed: Story = {
	args: {
		value: 'retrieval',
		options: [
			{ ...defaultOptions[0], state: 'correct' },
			{ ...defaultOptions[1], state: 'incorrect' },
			defaultOptions[2]
		]
	}
};

export const MixedContent: Story = {
	args: {
		value: 'linear',
		name: 'equation-type',
		legend: 'Choose the equation type',
		options: [
			{
				value: 'linear',
				label: '$ax + b$',
				description: 'A first-degree expression where \\(a\\) and \\(b\\) are constants.'
			},
			{
				value: 'quadratic',
				description: '$ax^2 + bx + c$'
			},
			{
				value: 'exponential',
				label: '$a \\cdot b^x$'
			}
		]
	}
};

export const Disabled: Story = {
	args: {
		disabled: true
	}
};
