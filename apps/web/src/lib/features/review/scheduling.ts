export type SpacedRepetitionGrade = 'again' | 'hard' | 'good' | 'easy';
export type SpacedRepetitionLearningState = 'new' | 'learning' | 'review' | 'mastered';
export type SpacedRepetitionDifficulty = 'easy' | 'medium' | 'hard';

export type SpacedRepetitionState = {
	learningState: SpacedRepetitionLearningState;
	reviewCount: number;
	lapseCount: number;
	consecutiveCorrectCount: number;
	easeFactor: number;
	intervalDays: number;
	dueAt: Date;
	lastReviewedAt: Date | null;
};

export type SpacedRepetitionOutcome = {
	isCorrect: boolean;
	responseTimeMs?: number | null;
	difficulty?: SpacedRepetitionDifficulty;
};

export type SpacedRepetitionResult = SpacedRepetitionState & {
	grade: SpacedRepetitionGrade;
	reviewedAt: Date;
	elapsedDays: number;
	latenessDays: number;
};

export function scheduleSpacedRepetitionReview(
	state: SpacedRepetitionState | null,
	outcome: SpacedRepetitionGrade | SpacedRepetitionOutcome,
	reviewedAt = new Date()
): SpacedRepetitionResult {
	const previous = state ?? {
		learningState: 'new' as const,
		reviewCount: 0,
		lapseCount: 0,
		consecutiveCorrectCount: 0,
		easeFactor: 2.5,
		intervalDays: 0,
		dueAt: reviewedAt,
		lastReviewedAt: null
	};
	const normalizedOutcome =
		typeof outcome === 'string' ? { grade: outcome, difficulty: 'medium' as const } : outcome;
	const elapsedDays = elapsedReviewDays(previous.lastReviewedAt, reviewedAt);
	const latenessDays = Math.max(0, elapsedDays - previous.intervalDays);
	const grade =
		'grade' in normalizedOutcome
			? normalizedOutcome.grade
			: deriveGrade(previous, normalizedOutcome, elapsedDays, latenessDays);
	const difficulty =
		'grade' in normalizedOutcome ? 'medium' : (normalizedOutcome.difficulty ?? 'medium');

	if (grade === 'again') {
		const easeFactor = clampEase(previous.easeFactor - 0.2);
		const intervalDays =
			previous.intervalDays < 7
				? 1
				: Math.max(1, Math.min(7, Math.round(previous.intervalDays * 0.15)));
		return {
			grade,
			reviewedAt,
			elapsedDays,
			latenessDays,
			learningState: 'learning',
			reviewCount: previous.reviewCount + 1,
			lapseCount: previous.lapseCount + 1,
			consecutiveCorrectCount: 0,
			easeFactor,
			intervalDays,
			dueAt: addDays(reviewedAt, intervalDays),
			lastReviewedAt: reviewedAt
		};
	}

	const reviewCount = previous.reviewCount + 1;
	const consecutiveCorrectCount = previous.consecutiveCorrectCount + 1;
	const easeDelta = grade === 'hard' ? -0.05 : grade === 'easy' ? 0.08 : 0.03;
	const easeFactor = clampEase(previous.easeFactor + easeDelta);
	const intervalDays = nextInterval({
		previousIntervalDays: previous.intervalDays,
		consecutiveCorrectCount,
		grade,
		easeFactor,
		difficulty,
		lateBoost: getLateBoost(latenessDays, previous.intervalDays)
	});
	const learningState = nextLearningState(intervalDays);

	return {
		grade,
		reviewedAt,
		elapsedDays,
		latenessDays,
		learningState,
		reviewCount,
		lapseCount: previous.lapseCount,
		consecutiveCorrectCount,
		easeFactor,
		intervalDays,
		dueAt: addDays(reviewedAt, intervalDays),
		lastReviewedAt: reviewedAt
	};
}

export function gradeFromCorrectness(isCorrect: boolean): SpacedRepetitionGrade {
	return isCorrect ? 'good' : 'again';
}

export function numericGrade(grade: SpacedRepetitionGrade): 1 | 3 | 4 | 5 {
	if (grade === 'again') return 1;
	if (grade === 'hard') return 3;
	if (grade === 'easy') return 5;
	return 4;
}

function addDays(date: Date, days: number) {
	const next = new Date(date);
	next.setUTCDate(next.getUTCDate() + days);
	return next;
}

function clampEase(easeFactor: number) {
	return Math.min(3, Math.max(1.3, Number(easeFactor.toFixed(2))));
}

function nextInterval({
	previousIntervalDays,
	consecutiveCorrectCount,
	grade,
	easeFactor,
	difficulty,
	lateBoost
}: {
	previousIntervalDays: number;
	consecutiveCorrectCount: number;
	grade: Exclude<SpacedRepetitionGrade, 'again'>;
	easeFactor: number;
	difficulty: SpacedRepetitionDifficulty;
	lateBoost: number;
}) {
	const maxInterval = 1095;
	if (grade === 'hard') {
		if (consecutiveCorrectCount <= 1) return 1;
		return Math.min(maxInterval, Math.max(1, Math.ceil(Math.max(1, previousIntervalDays) * 1.2)));
	}

	if (consecutiveCorrectCount === 1) {
		return Math.min(maxInterval, grade === 'easy' ? 4 : difficulty === 'easy' ? 2 : 1);
	}

	if (consecutiveCorrectCount === 2) {
		const secondInterval = difficulty === 'hard' ? 4 : difficulty === 'easy' ? 8 : 6;
		return Math.min(maxInterval, grade === 'easy' ? Math.max(8, secondInterval) : secondInterval);
	}

	const difficultyMultiplier = difficulty === 'easy' ? 1.15 : difficulty === 'hard' ? 0.85 : 1;
	const gradeMultiplier = grade === 'easy' ? 1.3 : 1;
	const candidate = Math.round(
		Math.max(1, previousIntervalDays) *
			easeFactor *
			gradeMultiplier *
			lateBoost *
			difficultyMultiplier
	);
	const minimumPassingInterval =
		previousIntervalDays >= maxInterval ? maxInterval : previousIntervalDays + 1;
	return Math.min(maxInterval, Math.max(1, minimumPassingInterval, candidate));
}

function nextLearningState(intervalDays: number): SpacedRepetitionLearningState {
	if (intervalDays < 2) return 'learning';
	return intervalDays >= 90 ? 'mastered' : 'review';
}

function deriveGrade(
	previous: SpacedRepetitionState,
	outcome: SpacedRepetitionOutcome,
	elapsedDays: number,
	latenessDays: number
): SpacedRepetitionGrade {
	if (!outcome.isCorrect) return 'again';

	const responseTimeMs = outcome.responseTimeMs ?? 0;
	const hasKnownTiming = responseTimeMs > 0;
	if (hasKnownTiming && responseTimeMs >= 45_000) return 'hard';

	const isOverdueByHalfInterval =
		previous.intervalDays > 0 && latenessDays >= Math.ceil(previous.intervalDays * 0.5);
	const rememberedWhileLate = elapsedDays > previous.intervalDays && isOverdueByHalfInterval;
	const isFast = hasKnownTiming && responseTimeMs <= 10_000;

	if (
		(rememberedWhileLate && (!hasKnownTiming || isFast)) ||
		(isFast && previous.consecutiveCorrectCount >= 2 && outcome.difficulty !== 'hard')
	) {
		return 'easy';
	}

	return 'good';
}

function elapsedReviewDays(lastReviewedAt: Date | null, reviewedAt: Date) {
	if (!lastReviewedAt) return 0;
	return Math.max(0, Math.floor((reviewedAt.getTime() - lastReviewedAt.getTime()) / 86_400_000));
}

function getLateBoost(latenessDays: number, previousIntervalDays: number) {
	if (latenessDays <= 0 || previousIntervalDays <= 0) return 1;
	return 1 + Math.min(0.5, (latenessDays / previousIntervalDays) * 0.25);
}
