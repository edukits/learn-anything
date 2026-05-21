import type { Meta, StoryObj } from '@storybook/sveltekit';
import MultipleSelect from '../../lib/components/quiz/MultipleSelect.svelte';
import type { MultipleChoiceOptionData } from '../../lib/components/quiz/types';

const defaultOptions: MultipleChoiceOptionData[] = [
	{
		value: 'retrieval',
		label: 'Retrieval practice',
		description: 'Pulling an answer from memory before checking notes or examples.'
	},
	{
		value: 'spacing',
		label: 'Spaced repetition',
		description: 'Reviewing material across multiple sessions with time between them.'
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
	title: 'Components/Quiz/MultipleSelect',
	component: MultipleSelect,
	tags: ['autodocs'],
	args: {
		options: defaultOptions,
		value: ['retrieval', 'spacing'],
		name: 'learning-strategies',
		legend: 'Choose learning strategies'
	},
	argTypes: {
		disabled: {
			control: 'boolean'
		},
		celebrations: {
			control: 'boolean'
		}
	}
} satisfies Meta<typeof MultipleSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const EmptySelection: Story = {
	args: {
		value: []
	}
};

export const Reviewed: Story = {
	args: {
		value: ['retrieval', 'highlighting'],
		correctValues: ['retrieval', 'spacing'],
		submitted: true
	}
};

export const SubmitFlow: Story = {
	args: {
		value: ['retrieval'],
		correctValues: ['retrieval', 'spacing'],
		showSubmitButton: true
	}
};

export const Disabled: Story = {
	args: {
		disabled: true
	}
};
