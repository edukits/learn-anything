import type { Meta, StoryObj } from '@storybook/sveltekit';
import Button from './Button.svelte';

const meta = {
	title: 'Components/Button',
	component: Button,
	tags: ['autodocs'],
	args: {
		label: 'Start learning',
		size: 'md',
		variant: 'primary'
	},
	argTypes: {
		variant: {
			control: 'inline-radio',
			options: ['primary', 'secondary', 'ghost']
		},
		size: {
			control: 'inline-radio',
			options: ['sm', 'md', 'lg']
		}
	}
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Secondary: Story = {
	args: {
		variant: 'secondary'
	}
};

export const Ghost: Story = {
	args: {
		variant: 'ghost'
	}
};

export const Disabled: Story = {
	args: {
		disabled: true
	}
};
