import type { Meta, StoryObj } from '@storybook/sveltekit';
import Button from '../lib/components/Button.svelte';

type ButtonStoryArgs = {
	disabled?: boolean;
	label?: string;
	size?: 'sm' | 'md' | 'lg';
	variant?: 'primary' | 'secondary' | 'ghost';
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
			options: ['primary', 'secondary', 'ghost']
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

export const Disabled: Story = {
	args: {
		disabled: true
	}
};
