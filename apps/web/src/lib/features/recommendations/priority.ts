import type { RecommendationItem, RecommendationReason } from './types';

export type RecommendationSignal = {
	id: string;
	topicId: string;
	topicName: string;
	targetUrl: string;
	reason: RecommendationReason;
	description: string;
	dueAt?: Date | null;
	weakSkillAccuracy?: number | null;
	isNewLearner?: boolean;
	dailyGoalCompleted?: boolean;
	skippedToday?: boolean;
};

const reasonRank: Record<RecommendationReason, number> = {
	due_review: 0,
	continue_path: 1,
	weak_skill: 2,
	new_topic: 3,
	daily_goal_stretch: 4
};

export function prioritizeRecommendations(
	signals: RecommendationSignal[],
	now = new Date()
): RecommendationItem[] {
	return signals
		.filter((signal) => !signal.skippedToday)
		.map((signal) => ({
			id: signal.id,
			reason: signal.reason,
			topicId: signal.topicId,
			targetUrl: signal.targetUrl,
			priority: scoreSignal(signal, now),
			title: titleForSignal(signal),
			description: signal.description
		}))
		.toSorted((a, b) => a.priority - b.priority || a.title.localeCompare(b.title));
}

export function scoreSignal(signal: RecommendationSignal, now = new Date()) {
	let score = reasonRank[signal.reason] * 100;

	if (signal.reason === 'due_review' && signal.dueAt) {
		const overdueDays = Math.max(
			0,
			Math.floor((now.getTime() - signal.dueAt.getTime()) / 86_400_000)
		);
		score -= Math.min(30, overdueDays * 5);
	}

	if (
		signal.reason === 'weak_skill' &&
		signal.weakSkillAccuracy !== null &&
		signal.weakSkillAccuracy !== undefined
	) {
		score -= Math.round((1 - signal.weakSkillAccuracy) * 20);
	}

	if (signal.reason === 'new_topic' && signal.isNewLearner) {
		score -= 25;
	}

	if (signal.reason === 'daily_goal_stretch' && !signal.dailyGoalCompleted) {
		score += 200;
	}

	return score;
}

function titleForSignal(signal: RecommendationSignal) {
	if (signal.reason === 'due_review') return `Review ${signal.topicName}`;
	if (signal.reason === 'weak_skill') return `Practice ${signal.topicName}`;
	if (signal.reason === 'new_topic') return `Start ${signal.topicName}`;
	if (signal.reason === 'daily_goal_stretch') return `Stretch in ${signal.topicName}`;
	return `Continue ${signal.topicName}`;
}
