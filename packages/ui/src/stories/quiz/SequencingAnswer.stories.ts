import type { Meta, StoryObj } from '@storybook/sveltekit';
import SequencingAnswer from '../../lib/components/quiz/SequencingAnswer.svelte';
import type { SequencingItemData } from '../../lib/components/quiz/types';

const defaultItems: SequencingItemData[] = [
	{
		value: 'preview',
		label: 'Preview',
		description: 'Skim headings, examples, and diagrams before reading closely.'
	},
	{
		value: 'question',
		label: 'Question',
		description: 'Turn the section heading into a question to answer from the text.'
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
];

const correctOrder = ['preview', 'question', 'read', 'recall'];

const meta = {
	title: 'Components/Quiz/SequencingAnswer',
	component: SequencingAnswer,
	tags: ['autodocs'],
	args: {
		items: defaultItems,
		value: ['question', 'preview', 'read', 'recall'],
		correctOrder,
		name: 'study-sequence',
		legend: 'Order the study routine'
	},
	argTypes: {
		disabled: {
			control: 'boolean'
		}
	}
} satisfies Meta<typeof SequencingAnswer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CorrectOrder: Story = {
	args: {
		value: correctOrder
	}
};

export const Reviewed: Story = {
	args: {
		value: ['preview', 'read', 'question', 'recall'],
		submitted: true
	}
};

export const SubmitFlow: Story = {
	args: {
		value: ['question', 'preview', 'read', 'recall'],
		showSubmitButton: true
	}
};

export const Disabled: Story = {
	args: {
		disabled: true
	}
};
