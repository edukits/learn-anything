import type { ContentAdminRole, ContentReleaseReview } from './types';

const PUBLISHER_ROLES = new Set<ContentAdminRole>(['publisher', 'owner']);

export function canPublishRelease(role: ContentAdminRole, review: ContentReleaseReview): boolean {
	return (
		PUBLISHER_ROLES.has(role) &&
		review.review_status === 'approved' &&
		review.validation_passed &&
		Boolean(review.staging_imported_at) &&
		Boolean(review.smoke_tested_at)
	);
}

export function canRollbackRelease(role: ContentAdminRole, review: ContentReleaseReview): boolean {
	return PUBLISHER_ROLES.has(role) && review.review_status === 'published';
}

export function getDiffSummaryLabel(diffReport: Record<string, unknown>): string {
	const summary = diffReport.summary;
	if (!summary || typeof summary !== 'object') {
		return 'No diff summary';
	}

	const counts = Object.entries(summary as Record<string, unknown>)
		.filter(([, value]) => typeof value === 'number' && value > 0)
		.map(([key, value]) => `${key}: ${value}`);

	return counts.length ? counts.join(' · ') : 'No content changes';
}
