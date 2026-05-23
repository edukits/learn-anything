import type { Meta, StoryObj } from '@storybook/sveltekit';
import Tabs from '../lib/components/Tabs.svelte';
import type { TabItem } from '../lib/components/Tabs.svelte';

type TabsStoryArgs = {
	items: TabItem[];
	value: string | null;
	ariaLabel?: string;
};

const sampleItems: TabItem[] = [
	{ value: null, label: 'All' },
	{ value: 'streak', label: 'streak' },
	{ value: 'xp', label: 'xp' },
	{ value: 'milestone', label: 'milestone' }
];

const meta = {
	title: 'Components/Controls/Tabs',
	component: Tabs,
	tags: ['autodocs'],
	args: {
		items: sampleItems,
		value: null,
		ariaLabel: 'Filter by category'
	}
} satisfies Meta<TabsStoryArgs>;

export default meta;
type Story = StoryObj<TabsStoryArgs>;

export const Default: Story = {};

export const WithSelection: Story = {
	args: {
		value: 'xp'
	}
};

export const WithDisabledTab: Story = {
	args: {
		items: [
			{ value: null, label: 'All' },
			{ value: 'streak', label: 'streak' },
			{ value: 'xp', label: 'xp', disabled: true },
			{ value: 'milestone', label: 'milestone' }
		],
		value: 'streak'
	}
};
