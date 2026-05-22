import { describe, expect, test } from 'vitest';
import {
	canPublishRelease,
	canRollbackRelease,
	getDiffSummaryLabel
} from './release-controls';
import type { ContentReleaseReview } from './types';

function review(overrides: Partial<ContentReleaseReview> = {}): ContentReleaseReview {
	return {
		release_id: 'release_1',
		review_status: 'approved',
		reviewer_notes: null,
		validation_report: {},
		diff_report: {},
		validation_passed: true,
		staging_imported_at: '2026-05-22T12:00:00.000Z',
		smoke_tested_at: '2026-05-22T12:30:00.000Z',
		updated_at: '2026-05-22T12:30:00.000Z',
		content_release: {
			title: 'Release 1',
			status: 'draft',
			scope_id: 'topic_1',
			published_at: null
		},
		...overrides
	};
}

describe('release controls', () => {
	test('requires publisher role and evidence before publishing', () => {
		expect(canPublishRelease('reviewer', review())).toBe(false);
		expect(canPublishRelease('publisher', review({ validation_passed: false }))).toBe(false);
		expect(canPublishRelease('owner', review({ staging_imported_at: null }))).toBe(false);
		expect(canPublishRelease('publisher', review())).toBe(true);
	});

	test('only publisher roles can roll back published reviews', () => {
		expect(canRollbackRelease('reviewer', review({ review_status: 'published' }))).toBe(false);
		expect(canRollbackRelease('publisher', review({ review_status: 'approved' }))).toBe(false);
		expect(canRollbackRelease('owner', review({ review_status: 'published' }))).toBe(true);
	});

	test('summarizes reviewer-facing diff counts', () => {
		expect(getDiffSummaryLabel({ summary: { added: 2, changed: 1, retired: 0 } })).toBe(
			'added: 2 · changed: 1'
		);
	});
});
