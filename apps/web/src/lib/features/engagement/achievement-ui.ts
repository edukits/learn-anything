import {
	formatAchievementCategoryLabel,
	normalizeAchievementCategory,
	type AchievementCardData,
	type AchievementCelebrationItem,
	type RewardInventoryCardData,
	type RewardKind
} from '@learn-anything/ui';

type AchievementRowForUi = {
	key: string;
	name: string;
	description: string;
	category: string;
	progress_label: string;
	progress_percent: number;
	reward_kind: RewardKind | null;
	reward_label: string | null;
	earned_at: string | null;
};

type AchievementCelebrationForUi = {
	event_id: string;
	key: string;
	name: string;
	description: string;
	category: string;
	reward_kind: RewardKind | null;
	reward_label: string | null;
	earned_at: string;
};

type RewardInventoryRowForUi = {
	id: string;
	reward_kind: RewardKind;
	reward_key: string;
	reward_label: string;
	equipped: boolean;
	earned_at: string;
};

export function toAchievementCardData(achievement: AchievementRowForUi): AchievementCardData {
	return {
		key: achievement.key,
		name: achievement.name,
		description: achievement.description,
		category: normalizeAchievementCategory(achievement.category),
		categoryLabel: formatAchievementCategoryLabel(achievement.category),
		progressLabel: achievement.progress_label,
		progressPercent: achievement.progress_percent,
		rewardKind: achievement.reward_kind,
		rewardLabel: achievement.reward_label,
		earnedAt: achievement.earned_at
	};
}

export function toAchievementCelebrationItem(
	achievement: AchievementCelebrationForUi
): AchievementCelebrationItem {
	return {
		eventId: achievement.event_id,
		key: achievement.key,
		name: achievement.name,
		description: achievement.description,
		category: normalizeAchievementCategory(achievement.category),
		rewardKind: achievement.reward_kind,
		rewardLabel: achievement.reward_label,
		earnedAt: achievement.earned_at
	};
}

export function toRewardInventoryCardData(reward: RewardInventoryRowForUi): RewardInventoryCardData {
	return {
		id: reward.id,
		rewardKind: reward.reward_kind,
		rewardKey: reward.reward_key,
		rewardLabel: reward.reward_label,
		equipped: reward.equipped,
		earnedAt: reward.earned_at
	};
}
