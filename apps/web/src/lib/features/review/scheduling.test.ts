import { describe, expect, test } from 'vitest';
import { scheduleSpacedRepetitionReview } from './scheduling';

const now = new Date('2026-05-22T12:00:00.000Z');

describe('scheduleSpacedRepetitionReview', () => {
	test('starts a new successful item at one day', () => {
		const result = scheduleSpacedRepetitionReview(null, 'good', now);

		expect(result.learningState).toBe('review');
		expect(result.reviewCount).toBe(1);
		expect(result.intervalDays).toBe(1);
		expect(result.dueAt.toISOString()).toBe('2026-05-23T12:00:00.000Z');
	});

	test('uses six days for the second successful repetition', () => {
		const result = scheduleSpacedRepetitionReview(
			{
				learningState: 'review',
				reviewCount: 1,
				lapseCount: 0,
				easeFactor: 2.5,
				intervalDays: 1,
				dueAt: now,
				lastReviewedAt: now
			},
			'good',
			now
		);

		expect(result.reviewCount).toBe(2);
		expect(result.intervalDays).toBe(6);
	});

	test('scales later intervals by ease factor', () => {
		const result = scheduleSpacedRepetitionReview(
			{
				learningState: 'review',
				reviewCount: 2,
				lapseCount: 0,
				easeFactor: 2.5,
				intervalDays: 6,
				dueAt: now,
				lastReviewedAt: now
			},
			'good',
			now
		);

		expect(result.reviewCount).toBe(3);
		expect(result.intervalDays).toBe(15);
	});

	test('resets repetitions after a failed recall', () => {
		const result = scheduleSpacedRepetitionReview(
			{
				learningState: 'review',
				reviewCount: 4,
				lapseCount: 0,
				easeFactor: 2.5,
				intervalDays: 20,
				dueAt: now,
				lastReviewedAt: now
			},
			'again',
			now
		);

		expect(result.learningState).toBe('learning');
		expect(result.reviewCount).toBe(5);
		expect(result.lapseCount).toBe(1);
		expect(result.intervalDays).toBe(1);
		expect(result.easeFactor).toBeLessThan(2.5);
	});

	test('never drops ease factor below the floor', () => {
		const result = scheduleSpacedRepetitionReview(
			{
				learningState: 'review',
				reviewCount: 3,
				lapseCount: 0,
				easeFactor: 1.31,
				intervalDays: 10,
				dueAt: now,
				lastReviewedAt: now
			},
			'again',
			now
		);

		expect(result.easeFactor).toBe(1.3);
	});

	test('easy recall can promote long intervals to mastered', () => {
		const result = scheduleSpacedRepetitionReview(
			{
				learningState: 'review',
				reviewCount: 4,
				lapseCount: 0,
				easeFactor: 2.5,
				intervalDays: 20,
				dueAt: now,
				lastReviewedAt: now
			},
			'easy',
			now
		);

		expect(result.learningState).toBe('mastered');
		expect(result.intervalDays).toBeGreaterThan(21);
	});
});
