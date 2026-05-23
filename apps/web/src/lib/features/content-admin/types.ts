export type ContentQualityMetric = {
	subject_area_id: string | null;
	subject_name: string;
	topic_area_id: string | null;
	topic_name: string;
	release_id: string;
	release_title: string;
	question_purpose: string;
	response_type: string;
	question_count: number;
	answer_count: number;
	correct_rate: number | null;
	open_issue_count: number;
};

export type ContentIssueReport = {
	id: string;
	content_type: string;
	content_id: string;
	content_version: number | null;
	issue_type: string;
	severity: string;
	message: string;
	status: string;
	resolution_notes: string | null;
	created_at: string;
	topic_area_id: string | null;
	release_id: string | null;
};

export type ContentAdminRole = 'reviewer' | 'publisher' | 'owner';

export type ContentReleaseReview = {
	release_id: string;
	review_status: string;
	reviewer_notes: string | null;
	validation_report: Record<string, unknown>;
	diff_report: Record<string, unknown>;
	validation_passed: boolean;
	staging_imported_at: string | null;
	smoke_tested_at: string | null;
	updated_at: string;
	content_release: {
		title: string;
		status: string;
		scope_id: string;
		published_at: string | null;
	} | null;
};
