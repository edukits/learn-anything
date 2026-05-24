import { Award, BadgeCheck, BookOpen, Brain, Crown, RotateCcw, Sparkles, Star } from '@lucide/svelte';
import type { AchievementCategory, RewardKind } from './types';

export const achievementCategories = ['learning', 'practice', 'review', 'streak', 'xp'] as const;

const categoryIcons: Record<AchievementCategory, typeof Award> = {
	learning: BookOpen,
	practice: Brain,
	review: RotateCcw,
	streak: Star,
	xp: Sparkles,
	other: Award
};

const categoryLabels: Record<AchievementCategory, string> = {
	learning: 'Learning',
	practice: 'Practice',
	review: 'Review',
	streak: 'Streak',
	xp: 'XP',
	other: 'Achievement'
};

const rewardIcons: Record<RewardKind, typeof Award> = {
	badge: BadgeCheck,
	title: Crown
};

const rewardLabels: Record<RewardKind, string> = {
	badge: 'Badge',
	title: 'Title'
};

export function normalizeAchievementCategory(category: string): AchievementCategory {
	return achievementCategories.includes(category as (typeof achievementCategories)[number])
		? (category as AchievementCategory)
		: 'other';
}

export function formatAchievementCategoryLabel(category: string): string {
	return categoryLabels[normalizeAchievementCategory(category)];
}

export function getAchievementCategoryIcon(category: AchievementCategory) {
	return categoryIcons[category];
}

export function getRewardKindIcon(kind: RewardKind | null) {
	return kind ? rewardIcons[kind] : Award;
}

export function getRewardKindLabel(kind: RewardKind | null) {
	return kind ? rewardLabels[kind] : 'Achievement';
}
