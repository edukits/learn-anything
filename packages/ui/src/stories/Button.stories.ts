import type { Meta, StoryObj } from '@storybook/sveltekit';
import Button from '../lib/components/Button.svelte';

type ButtonStoryArgs = {
	disabled?: boolean;
	label?: string;
	size?: 'sm' | 'md' | 'lg';
	variant?: 'primary' | 'secondary' | 'ghost' | 'success' | 'danger' | 'warning';
};

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
			options: ['primary', 'secondary', 'ghost', 'success', 'danger', 'warning']
		},
		size: {
			control: 'inline-radio',
			options: ['sm', 'md', 'lg']
		}
	}
} satisfies Meta<ButtonStoryArgs>;

export default meta;
type Story = StoryObj<ButtonStoryArgs>;

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

export const Success: Story = {
	args: {
		variant: 'success',
		label: 'Confirm'
	}
};

export const Danger: Story = {
	args: {
		variant: 'danger',
		label: 'Delete'
	}
};

export const Warning: Story = {
	args: {
		variant: 'warning',
		label: 'Proceed with caution'
	}
};

export const Disabled: Story = {
	args: {
		disabled: true
	}
};
