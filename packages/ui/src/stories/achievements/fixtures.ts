import type {
	AchievementCardData,
	AchievementCelebrationItem,
	RewardInventoryCardData
} from '../../lib';

export const lessonAchievement: AchievementCardData = {
	key: 'five_lessons',
	name: 'Lesson rhythm',
	description: 'Complete 5 lessons.',
	category: 'learning',
	categoryLabel: 'Learning',
	progressLabel: '2 / 5 lessons',
	progressPercent: 40,
	rewardKind: 'badge',
	rewardLabel: 'Lesson Rhythm',
	earnedAt: null
};

export const xpAchievement: AchievementCardData = {
	key: 'hundred_xp',
	name: '100 XP',
	description: 'Earn 100 total XP.',
	category: 'xp',
	categoryLabel: 'XP',
	progressLabel: '80 / 100 XP',
	progressPercent: 80,
	rewardKind: 'title',
	rewardLabel: 'XP Builder',
	earnedAt: null
};

export const titleReward: RewardInventoryCardData = {
	id: 'reward-title',
	rewardKind: 'title',
	rewardKey: 'title_consistent_learner',
	rewardLabel: 'Consistent Learner',
	equipped: false,
	earnedAt: '2026-05-22T14:30:00.000Z'
};

export const badgeReward: RewardInventoryCardData = {
	id: 'reward-badge',
	rewardKind: 'badge',
	rewardKey: 'badge_first_lesson',
	rewardLabel: 'First Lesson',
	equipped: false,
	earnedAt: '2026-05-21T10:15:00.000Z'
};

export const celebrationAchievements: AchievementCelebrationItem[] = [
	{
		eventId: '11111111-1111-4111-8111-111111111111',
		key: 'five_lessons',
		name: 'Lesson rhythm',
		description: 'Complete 5 lessons.',
		category: 'learning',
		rewardKind: 'badge',
		rewardLabel: 'Lesson Rhythm',
		earnedAt: '2026-05-22T14:30:00.000Z'
	},
	{
		eventId: '22222222-2222-4222-8222-222222222222',
		key: 'hundred_xp',
		name: '100 XP',
		description: 'Earn 100 total XP.',
		category: 'xp',
		rewardKind: 'title',
		rewardLabel: 'XP Builder',
		earnedAt: '2026-05-22T14:31:00.000Z'
	}
];
