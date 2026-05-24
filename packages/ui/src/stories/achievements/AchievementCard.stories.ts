import type { Meta, StoryObj } from '@storybook/sveltekit';
import { AchievementCard, type AchievementCardData } from '../../lib';
import { lessonAchievement, xpAchievement } from './fixtures';

type AchievementCardStoryArgs = {
	achievement: AchievementCardData;
};

const meta = {
	title: 'Components/Achievements/AchievementCard',
	component: AchievementCard,
	tags: ['autodocs'],
	args: {
		achievement: lessonAchievement
	}
} satisfies Meta<AchievementCardStoryArgs>;

export default meta;
type Story = StoryObj<AchievementCardStoryArgs>;

export const Locked: Story = {};

export const NearlyComplete: Story = {
	args: {
		achievement: xpAchievement
	}
};

export const Earned: Story = {
	args: {
		achievement: {
			...lessonAchievement,
			progressLabel: '5 / 5 lessons',
			progressPercent: 100,
			earnedAt: '2026-05-22T14:30:00.000Z'
		}
	}
};
