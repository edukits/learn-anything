import type { Meta, StoryObj } from '@storybook/sveltekit';
import LearningNav from '../../lib/components/navigation/LearningNav.svelte';
import type { NavTopic } from '../../lib/components/navigation/types';

type LearningNavStoryArgs = {
	topics: NavTopic[];
	activeTopicSlug: string;
	currentPathname: string;
	showAdmin: boolean;
	onTopicChange?: (slug: string) => void;
};

const sampleTopics: NavTopic[] = [
	{ id: 'topic-1', slug: 'algebra-basics', name: 'Algebra Basics' },
	{ id: 'topic-2', slug: 'geometry-foundations', name: 'Geometry Foundations' },
	{ id: 'topic-3', slug: 'calculus-intro', name: 'Introduction to Calculus' }
];

const meta = {
	title: 'Navigation/LearningNav',
	component: LearningNav,
	tags: ['autodocs'],
	args: {
		topics: sampleTopics,
		activeTopicSlug: 'algebra-basics',
		currentPathname: '/app/topics/algebra-basics',
		showAdmin: false,
		onTopicChange: (slug: string) => console.log('Topic changed:', slug)
	},
	parameters: {
		layout: 'fullscreen'
	}
} satisfies Meta<LearningNavStoryArgs>;

export default meta;
type Story = StoryObj<LearningNavStoryArgs>;

export const MapActive: Story = {};

export const ReviewActive: Story = {
	args: {
		currentPathname: '/app/topics/algebra-basics/review'
	}
};

export const DailyPlanActive: Story = {
	args: {
		currentPathname: '/app/daily-plan'
	}
};

export const WithAdmin: Story = {
	args: {
		showAdmin: true,
		currentPathname: '/app/content-admin'
	}
};

export const SingleTopic: Story = {
	args: {
		topics: [sampleTopics[0]]
	}
};

export const NoTopics: Story = {
	args: {
		topics: [],
		activeTopicSlug: '',
		currentPathname: '/app'
	}
};
