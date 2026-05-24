import type { Meta, StoryObj } from '@storybook/sveltekit';
import { NextAchievementStatus, type NextAchievementData } from '../../lib';
import { xpAchievement } from './fixtures';

type NextAchievementStatusStoryArgs = {
	achievement: NextAchievementData | null;
	href: string;
};

const meta = {
	title: 'Components/Achievements/NextAchievementStatus',
	component: NextAchievementStatus,
	tags: ['autodocs'],
	args: {
		achievement: xpAchievement,
		href: '#'
	}
} satisfies Meta<NextAchievementStatusStoryArgs>;

export default meta;
type Story = StoryObj<NextAchievementStatusStoryArgs>;

export const Default: Story = {};

export const Empty: Story = {
	args: {
		achievement: null
	}
};
