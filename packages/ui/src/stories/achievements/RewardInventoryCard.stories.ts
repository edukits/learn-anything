import type { Meta, StoryObj } from '@storybook/sveltekit';
import { RewardInventoryCard, type RewardInventoryCardData } from '../../lib';
import { badgeReward, titleReward } from './fixtures';
import RewardInventoryCardInteractiveStory from './RewardInventoryCardInteractiveStory.svelte';

type RewardInventoryCardStoryArgs = {
	reward: RewardInventoryCardData;
	onEquip?: (reward: RewardInventoryCardData, nextRewardKey: string | null) => void;
};

const meta = {
	title: 'Components/Achievements/RewardInventoryCard',
	component: RewardInventoryCard,
	tags: ['autodocs'],
	args: {
		reward: titleReward
	}
} satisfies Meta<RewardInventoryCardStoryArgs>;

export default meta;
type Story = StoryObj<RewardInventoryCardStoryArgs>;

export const Title: Story = {};

export const InteractiveTitle: StoryObj<typeof RewardInventoryCardInteractiveStory> = {
	render: () => ({
		Component: RewardInventoryCardInteractiveStory
	})
};

export const EquippedTitle: Story = {
	args: {
		reward: {
			...titleReward,
			equipped: true
		}
	}
};

export const Badge: Story = {
	args: {
		reward: badgeReward
	}
};
