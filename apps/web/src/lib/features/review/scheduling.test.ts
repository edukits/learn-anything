import { describe, expect, test } from 'vitest';
import { scheduleSpacedRepetitionReview } from './scheduling';

const now = new Date('2026-05-22T12:00:00.000Z');

describe('scheduleSpacedRepetitionReview', () => {
	test('starts a new successful item at one day', () => {
		const result = scheduleSpacedRepetitionReview(
			null,
			{ isCorrect: true, responseTimeMs: 20_000, difficulty: 'medium' },
			now
		);

		expect(result.grade).toBe('good');
		expect(result.learningState).toBe('learning');
		expect(result.reviewCount).toBe(1);
		expect(result.consecutiveCorrectCount).toBe(1);
		expect(result.intervalDays).toBe(1);
		expect(result.dueAt.toISOString()).toBe('2026-05-23T12:00:00.000Z');
	});

	test('uses six days for the second successful repetition', () => {
		const result = scheduleSpacedRepetitionReview(
			{
				learningState: 'review',
				reviewCount: 1,
				lapseCount: 0,
				consecutiveCorrectCount: 1,
				easeFactor: 2.5,
				intervalDays: 1,
				dueAt: now,
				lastReviewedAt: now
			},
			{ isCorrect: true, responseTimeMs: 20_000, difficulty: 'medium' },
			now
		);

		expect(result.reviewCount).toBe(2);
		expect(result.consecutiveCorrectCount).toBe(2);
		expect(result.intervalDays).toBe(6);
	});

	test('scales later intervals by ease factor and recovers ease on success', () => {
		const result = scheduleSpacedRepetitionReview(
			{
				learningState: 'review',
				reviewCount: 2,
				lapseCount: 0,
				consecutiveCorrectCount: 2,
				easeFactor: 2.5,
				intervalDays: 6,
				dueAt: now,
				lastReviewedAt: now
			},
			{ isCorrect: true, responseTimeMs: 20_000, difficulty: 'medium' },
			now
		);

		expect(result.reviewCount).toBe(3);
		expect(result.intervalDays).toBe(15);
		expect(result.easeFactor).toBe(2.53);
	});

	test('preserves a short relearning interval after a failed long-interval recall', () => {
		const result = scheduleSpacedRepetitionReview(
			{
				learningState: 'review',
				reviewCount: 4,
				lapseCount: 0,
				consecutiveCorrectCount: 4,
				easeFactor: 2.5,
				intervalDays: 40,
				dueAt: now,
				lastReviewedAt: now
			},
			{ isCorrect: false, responseTimeMs: 12_000, difficulty: 'medium' },
			now
		);

		expect(result.learningState).toBe('learning');
		expect(result.reviewCount).toBe(5);
		expect(result.consecutiveCorrectCount).toBe(0);
		expect(result.lapseCount).toBe(1);
		expect(result.intervalDays).toBe(6);
		expect(result.easeFactor).toBeLessThan(2.5);
	});

	test('never drops ease factor below the floor', () => {
		const result = scheduleSpacedRepetitionReview(
			{
				learningState: 'review',
				reviewCount: 3,
				lapseCount: 0,
				consecutiveCorrectCount: 3,
				easeFactor: 1.31,
				intervalDays: 10,
				dueAt: now,
				lastReviewedAt: now
			},
			{ isCorrect: false, responseTimeMs: 10_000, difficulty: 'medium' },
			now
		);

		expect(result.easeFactor).toBe(1.3);
	});

	test('slow correct recall becomes a hidden hard grade', () => {
		const result = scheduleSpacedRepetitionReview(
			{
				learningState: 'review',
				reviewCount: 4,
				lapseCount: 0,
				consecutiveCorrectCount: 4,
				easeFactor: 2.5,
				intervalDays: 20,
				dueAt: now,
				lastReviewedAt: now
			},
			{ isCorrect: true, responseTimeMs: 45_000, difficulty: 'medium' },
			now
		);

		expect(result.grade).toBe('hard');
		expect(result.intervalDays).toBe(24);
		expect(result.easeFactor).toBe(2.45);
	});

	test('fast repeated correct recall becomes a hidden easy grade', () => {
		const result = scheduleSpacedRepetitionReview(
			{
				learningState: 'review',
				reviewCount: 4,
				lapseCount: 0,
				consecutiveCorrectCount: 4,
				easeFactor: 2.5,
				intervalDays: 20,
				dueAt: now,
				lastReviewedAt: now
			},
			{ isCorrect: true, responseTimeMs: 8_000, difficulty: 'medium' },
			now
		);

		expect(result.grade).toBe('easy');
		expect(result.intervalDays).toBe(67);
	});

	test('overdue correct recall gets a bounded late boost', () => {
		const result = scheduleSpacedRepetitionReview(
			{
				learningState: 'review',
				reviewCount: 4,
				lapseCount: 0,
				consecutiveCorrectCount: 4,
				easeFactor: 2.5,
				intervalDays: 20,
				dueAt: now,
				lastReviewedAt: new Date('2026-04-12T12:00:00.000Z')
			},
			{ isCorrect: true, responseTimeMs: 9_000, difficulty: 'medium' },
			now
		);

		expect(result.grade).toBe('easy');
		expect(result.elapsedDays).toBe(40);
		expect(result.latenessDays).toBe(20);
		expect(result.intervalDays).toBe(84);
	});

	test('easy recall can promote long intervals to mastered at ninety days', () => {
		const result = scheduleSpacedRepetitionReview(
			{
				learningState: 'review',
				reviewCount: 4,
				lapseCount: 0,
				consecutiveCorrectCount: 4,
				easeFactor: 2.5,
				intervalDays: 30,
				dueAt: now,
				lastReviewedAt: now
			},
			{ isCorrect: true, responseTimeMs: 8_000, difficulty: 'easy' },
			now
		);

		expect(result.learningState).toBe('mastered');
		expect(result.intervalDays).toBeGreaterThanOrEqual(90);
	});

	test('caps intervals at three years', () => {
		const result = scheduleSpacedRepetitionReview(
			{
				learningState: 'mastered',
				reviewCount: 12,
				lapseCount: 0,
				consecutiveCorrectCount: 12,
				easeFactor: 3,
				intervalDays: 900,
				dueAt: now,
				lastReviewedAt: now
			},
			{ isCorrect: true, responseTimeMs: 8_000, difficulty: 'easy' },
			now
		);

		expect(result.intervalDays).toBe(1095);
	});
});
