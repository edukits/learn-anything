import type { Meta, StoryObj } from '@storybook/sveltekit';
import { AchievementCelebrationDialog, type AchievementCelebrationItem } from '../../lib';
import { celebrationAchievements } from './fixtures';
import AchievementCelebrationDialogInteractiveStory from './AchievementCelebrationDialogInteractiveStory.svelte';

type AchievementCelebrationDialogStoryArgs = {
	open: boolean;
	achievements: AchievementCelebrationItem[];
	onDismiss?: (achievements: AchievementCelebrationItem[]) => void;
};

const meta = {
	title: 'Components/Achievements/AchievementCelebrationDialog',
	component: AchievementCelebrationDialog,
	tags: ['autodocs'],
	args: {
		open: true,
		achievements: celebrationAchievements
	}
} satisfies Meta<AchievementCelebrationDialogStoryArgs>;

export default meta;
type Story = StoryObj<AchievementCelebrationDialogStoryArgs>;

export const Single: Story = {
	args: {
		achievements: celebrationAchievements.slice(0, 1)
	}
};

export const Multiple: Story = {};

export const Interactive: StoryObj<typeof AchievementCelebrationDialogInteractiveStory> = {
	render: () => ({
		Component: AchievementCelebrationDialogInteractiveStory
	})
};
