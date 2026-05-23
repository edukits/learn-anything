import type { Meta, StoryObj } from '@storybook/sveltekit';
import TopicSelector from '../../lib/components/navigation/TopicSelector.svelte';
import type { NavTopic } from '../../lib/components/navigation/types';

type TopicSelectorStoryArgs = {
	topics: NavTopic[];
	value: string;
	disabled: boolean;
	onchange?: (slug: string) => void;
};

const sampleTopics: NavTopic[] = [
	{ id: 'topic-1', slug: 'algebra-basics', name: 'Algebra Basics' },
	{ id: 'topic-2', slug: 'geometry-foundations', name: 'Geometry Foundations' },
	{ id: 'topic-3', slug: 'calculus-intro', name: 'Introduction to Calculus' }
];

const meta = {
	title: 'Navigation/TopicSelector',
	component: TopicSelector,
	tags: ['autodocs'],
	args: {
		topics: sampleTopics,
		value: 'algebra-basics',
		disabled: false,
		onchange: (slug: string) => console.log('Selected:', slug)
	}
} satisfies Meta<TopicSelectorStoryArgs>;

export default meta;
type Story = StoryObj<TopicSelectorStoryArgs>;

export const Default: Story = {};

export const LongTopicName: Story = {
	args: {
		topics: [
			{
				id: 'topic-long',
				slug: 'advanced-statistical-methods',
				name: 'Advanced Statistical Methods for Data Science'
			},
			...sampleTopics.slice(1)
		],
		value: 'advanced-statistical-methods'
	}
};

export const Disabled: Story = {
	args: {
		disabled: true
	}
};

export const Empty: Story = {
	args: {
		topics: [],
		value: ''
	}
};
