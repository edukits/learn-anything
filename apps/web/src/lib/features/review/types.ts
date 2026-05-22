import type { ReviewPracticeQuestion, ReviewSummary } from '$lib/features/learning';

export type ReviewSessionSummary = {
	session: {
		id: string;
		release_id: string;
		status: 'created' | 'completed';
	};
	questions: ReviewPracticeQuestion[];
};

export type ReviewState = {
	reviewSession: ReviewSessionSummary | null;
	reviewSummary: ReviewSummary;
};
