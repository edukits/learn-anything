import type { Meta, StoryObj } from '@storybook/sveltekit';
import { StreakWeek } from '../../lib';

type StreakWeekStoryArgs = {
	currentStreak: number;
	currentDate: string;
	ariaLabel?: string;
};

const meta = {
	title: 'Components/Achievements/StreakWeek',
	component: StreakWeek,
	tags: ['autodocs'],
	args: {
		currentStreak: 5,
		currentDate: '2026-05-23'
	},
	parameters: {
		layout: 'centered'
	}
} satisfies Meta<StreakWeekStoryArgs>;

export default meta;
type Story = StoryObj<StreakWeekStoryArgs>;

export const FiveDayStreak: Story = {};

export const NoCurrentStreak: Story = {
	args: {
		currentStreak: 0,
		currentDate: '2026-05-23'
	}
};

export const LongStreak: Story = {
	args: {
		currentStreak: 21,
		currentDate: '2026-05-23'
	}
};
