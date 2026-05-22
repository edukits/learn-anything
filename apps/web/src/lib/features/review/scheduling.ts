export type SpacedRepetitionGrade = 'again' | 'hard' | 'good' | 'easy';
export type SpacedRepetitionLearningState = 'new' | 'learning' | 'review' | 'mastered';

export type SpacedRepetitionState = {
	learningState: SpacedRepetitionLearningState;
	reviewCount: number;
	lapseCount: number;
	easeFactor: number;
	intervalDays: number;
	dueAt: Date;
	lastReviewedAt: Date | null;
};

export type SpacedRepetitionResult = SpacedRepetitionState & {
	grade: SpacedRepetitionGrade;
	reviewedAt: Date;
};

export function scheduleSpacedRepetitionReview(
	state: SpacedRepetitionState | null,
	grade: SpacedRepetitionGrade,
	reviewedAt = new Date()
): SpacedRepetitionResult {
	const previous = state ?? {
		learningState: 'new' as const,
		reviewCount: 0,
		lapseCount: 0,
		easeFactor: 2.5,
		intervalDays: 0,
		dueAt: reviewedAt,
		lastReviewedAt: null
	};

	if (grade === 'again') {
		const easeFactor = clampEase(previous.easeFactor - 0.2);
		return {
			grade,
			reviewedAt,
			learningState: 'learning',
			reviewCount: previous.reviewCount + 1,
			lapseCount: previous.lapseCount + 1,
			easeFactor,
			intervalDays: 1,
			dueAt: addDays(reviewedAt, 1),
			lastReviewedAt: reviewedAt
		};
	}

	const reviewCount = previous.reviewCount + 1;
	const easeDelta = grade === 'hard' ? -0.05 : grade === 'easy' ? 0.15 : 0;
	const easeFactor = clampEase(previous.easeFactor + easeDelta);
	const intervalDays = nextInterval(previous.intervalDays, reviewCount, grade, easeFactor);
	const learningState = nextLearningState(previous.learningState, grade, intervalDays);

	return {
		grade,
		reviewedAt,
		learningState,
		reviewCount,
		lapseCount: previous.lapseCount,
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
	return Math.max(1.3, Number(easeFactor.toFixed(2)));
}

function nextInterval(
	previousIntervalDays: number,
	reviewCount: number,
	grade: Exclude<SpacedRepetitionGrade, 'again'>,
	easeFactor: number
) {
	if (grade === 'hard') {
		return Math.max(1, Math.ceil(Math.max(1, previousIntervalDays) * 1.2));
	}

	if (reviewCount === 1) {
		return grade === 'easy' ? 4 : 1;
	}

	if (reviewCount === 2) {
		return grade === 'easy' ? 8 : 6;
	}

	const multiplier = grade === 'easy' ? easeFactor * 1.3 : easeFactor;
	return Math.max(1, Math.round(Math.max(1, previousIntervalDays) * multiplier));
}

function nextLearningState(
	previousState: SpacedRepetitionLearningState,
	grade: Exclude<SpacedRepetitionGrade, 'again'>,
	intervalDays: number
): SpacedRepetitionLearningState {
	if (grade === 'hard' && (previousState === 'new' || previousState === 'learning')) {
		return 'learning';
	}

	return intervalDays >= 21 ? 'mastered' : 'review';
}
