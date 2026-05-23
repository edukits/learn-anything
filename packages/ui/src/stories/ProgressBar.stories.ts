import type { Meta, StoryObj } from '@storybook/sveltekit';
import ProgressBar from '../lib/components/ProgressBar.svelte';

type ProgressBarStoryArgs = {
	value?: number;
	max?: number;
	size?: 'sm' | 'md' | 'lg';
	h?: number;
	s?: number;
	l?: number;
	sparkThreshold?: number;
	disableSparks?: boolean;
};

const meta = {
	title: 'Components/ProgressBar',
	component: ProgressBar,
	tags: ['autodocs'],
	args: {
		value: 45,
		max: 100,
		size: 'md',
		sparkThreshold: 10,
		disableSparks: false
	},
	argTypes: {
		value: {
			control: { type: 'range', min: 0, max: 100, step: 1 }
		},
		max: {
			control: { type: 'number', min: 1 }
		},
		size: {
			control: 'inline-radio',
			options: ['sm', 'md', 'lg']
		},
		h: {
			control: { type: 'range', min: 0, max: 360, step: 1 },
			description: 'Accent hue (0–360)'
		},
		s: {
			control: { type: 'range', min: 0, max: 100, step: 1 },
			description: 'Accent saturation (%)'
		},
		l: {
			control: { type: 'range', min: 0, max: 100, step: 1 },
			description: 'Accent lightness (%)'
		},
		sparkThreshold: {
			control: { type: 'number', min: 1, max: 100 }
		},
		disableSparks: {
			control: 'boolean'
		}
	}
} satisfies Meta<ProgressBarStoryArgs>;

export default meta;
type Story = StoryObj<ProgressBarStoryArgs>;

export const Default: Story = {};

export const Small: Story = {
	args: {
		size: 'sm',
		value: 30
	}
};

export const Large: Story = {
	args: {
		size: 'lg',
		value: 72
	}
};

export const Full: Story = {
	args: {
		value: 100
	}
};

export const Empty: Story = {
	args: {
		value: 0
	}
};

export const GoldXP: Story = {
	args: {
		value: 60,
		h: 42,
		s: 90,
		l: 50,
		size: 'lg'
	}
};

export const PurpleTheme: Story = {
	args: {
		value: 55,
		h: 270,
		s: 72,
		l: 52
	}
};

export const RedDanger: Story = {
	args: {
		value: 25,
		h: 0,
		s: 78,
		l: 48
	}
};
