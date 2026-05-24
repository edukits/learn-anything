import type { Meta, StoryObj } from '@storybook/sveltekit';
import GlobalNav from '../../lib/components/navigation/GlobalNav.svelte';
import type { NavSubject, NavUser } from '../../lib/components/navigation/types';

type GlobalNavStoryArgs = {
	subjects: NavSubject[];
	user: NavUser | null;
	currentPathname: string;
	showAdmin: boolean;
};

const sampleSubjects: NavSubject[] = [
	{
		id: '1',
		slug: 'mathematics',
		name: 'Mathematics',
		summary: 'Algebra, geometry, and number theory foundations.'
	},
	{
		id: '2',
		slug: 'science',
		name: 'Science',
		summary: 'Physics, chemistry, and biology for curious minds.'
	},
	{
		id: '3',
		slug: 'history',
		name: 'History',
		summary: 'World events, cultures, and the stories behind them.'
	}
];

const meta = {
	title: 'Components/Navigation/GlobalNav',
	component: GlobalNav,
	tags: ['autodocs'],
	args: {
		subjects: sampleSubjects,
		user: { email: 'learner@example.com' },
		currentPathname: '/app/daily-plan',
		showAdmin: false
	},
	parameters: {
		layout: 'fullscreen'
	}
} satisfies Meta<GlobalNavStoryArgs>;

export default meta;
type Story = StoryObj<GlobalNavStoryArgs>;

export const SignedIn: Story = {};

export const SignedOut: Story = {
	args: {
		user: null,
		currentPathname: '/'
	}
};

export const EmptyCatalogue: Story = {
	args: {
		subjects: []
	}
};

export const OnSubjectPage: Story = {
	args: {
		user: null,
		currentPathname: '/subjects/mathematics'
	}
};

export const AdminUser: Story = {
	args: {
		showAdmin: true,
		currentPathname: '/admin/content'
	}
};
