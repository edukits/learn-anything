import type { Meta, StoryObj } from '@storybook/sveltekit';
import Select from '../lib/components/Select.svelte';
import type { SelectOption } from '../lib/components/Select.svelte';

type SelectStoryArgs = {
	name?: string;
	options: SelectOption[];
	value: string;
	placeholder?: string;
	disabled?: boolean;
	required?: boolean;
	ariaLabel?: string;
};

const courseOptions: SelectOption[] = [
	{ value: 'algebra', label: 'Algebra foundations' },
	{ value: 'geometry', label: 'Geometry essentials' },
	{ value: 'statistics', label: 'Statistics and probability' },
	{ value: 'calculus', label: 'Calculus preview', disabled: true }
];

const meta = {
	title: 'Components/Controls/Select',
	component: Select,
	tags: ['autodocs'],
	args: {
		name: 'course',
		options: courseOptions,
		value: 'algebra',
		placeholder: 'Choose a course',
		disabled: false,
		required: false,
		ariaLabel: 'Choose a course'
	},
	argTypes: {
		value: {
			control: 'select',
			options: ['', ...courseOptions.map((option) => option.value)]
		}
	}
} satisfies Meta<SelectStoryArgs>;

export default meta;
type Story = StoryObj<SelectStoryArgs>;

export const Default: Story = {};

export const Placeholder: Story = {
	args: {
		value: ''
	}
};

export const LongLabels: Story = {
	args: {
		options: [
			{
				value: 'analysis',
				label: 'Mathematical analysis with limits, continuity, and proof techniques'
			},
			{
				value: 'modeling',
				label: 'Applied modeling for messy real-world measurement problems'
			},
			{
				value: 'review',
				label: 'Adaptive review set generated from recent mistakes'
			}
		],
		value: 'analysis'
	}
};

export const Disabled: Story = {
	args: {
		disabled: true
	}
};
