export type RewardKind = 'badge' | 'title';
export type AchievementCategory = 'learning' | 'practice' | 'review' | 'streak' | 'xp' | 'other';

export type AchievementCardData = {
	key: string;
	name: string;
	description: string;
	category: AchievementCategory;
	categoryLabel: string;
	progressLabel: string;
	progressPercent: number;
	rewardKind: RewardKind | null;
	rewardLabel: string | null;
	earnedAt: string | null;
};

export type AchievementCelebrationItem = {
	eventId: string;
	key: string;
	name: string;
	description: string;
	category: AchievementCategory;
	rewardKind: RewardKind | null;
	rewardLabel: string | null;
	earnedAt: string;
};

export type RewardInventoryCardData = {
	id: string;
	achievementCategory: AchievementCategory;
	rewardKind: RewardKind;
	rewardKey: string;
	rewardLabel: string;
	equipped: boolean;
	earnedAt: string;
};

export type NextAchievementData = Pick<
	AchievementCardData,
	'key' | 'name' | 'progressLabel' | 'progressPercent'
>;

export type StreakWeekDay = {
	date: string;
	label: string;
	ariaLabel: string;
	completed: boolean;
	current: boolean;
};
