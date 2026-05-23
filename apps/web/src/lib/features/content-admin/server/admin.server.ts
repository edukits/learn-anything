import { error as kitError } from '@sveltejs/kit';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
	ContentAdminRole,
	ContentIssueReport,
	ContentQualityMetric,
	ContentReleaseReview
} from '../types';

type AdminRow = {
	user_id: string;
	role: ContentAdminRole;
};

type QualityMetricRow = Omit<
	ContentQualityMetric,
	'question_count' | 'answer_count' | 'correct_rate' | 'open_issue_count'
> & {
	question_count: number | string;
	answer_count: number | string;
	correct_rate: number | string | null;
	open_issue_count: number | string;
};

type ReviewRow = Omit<ContentReleaseReview, 'content_release'> & {
	content_releases:
		| ContentReleaseReview['content_release']
		| ContentReleaseReview['content_release'][]
		| null;
};

export async function getContentAdminRole(
	client: SupabaseClient,
	userId: string
): Promise<AdminRow | null> {
	const { data, error } = await client
		.from('content_admin_users')
		.select('user_id,role')
		.eq('user_id', userId)
		.maybeSingle();

	if (error) throw new Error(error.message);
	return data as AdminRow | null;
}

export async function requireContentAdmin(
	client: SupabaseClient,
	userId: string
): Promise<AdminRow> {
	const admin = await getContentAdminRole(client, userId);
	if (!admin) {
		kitError(403, 'Content admin access required.');
	}

	return admin;
}

export async function getContentQualityDashboard(
	client: SupabaseClient,
	userId: string
): Promise<ContentQualityMetric[]> {
	const { data, error } = await client.rpc('get_content_quality_dashboard', {
		p_admin_user_id: userId
	});

	if (error) throw new Error(error.message);
	return ((data ?? []) as QualityMetricRow[]).map((row) => ({
		subject_area_id: row.subject_area_id,
		subject_name: row.subject_name,
		topic_area_id: row.topic_area_id,
		topic_name: row.topic_name,
		release_id: row.release_id,
		release_title: row.release_title,
		question_purpose: row.question_purpose,
		response_type: row.response_type,
		question_count: Number(row.question_count),
		answer_count: Number(row.answer_count),
		correct_rate: row.correct_rate === null ? null : Number(row.correct_rate),
		open_issue_count: Number(row.open_issue_count)
	}));
}

export async function getOpenContentIssues(
	client: SupabaseClient,
	userId: string
): Promise<ContentIssueReport[]> {
	await requireContentAdmin(client, userId);
	const { data, error } = await client
		.from('content_issue_reports')
		.select(
			'id,content_type,content_id,content_version,issue_type,severity,message,status,resolution_notes,created_at,topic_area_id,release_id'
		)
		.in('status', ['open', 'triaged'])
		.order('created_at', { ascending: false })
		.limit(50);

	if (error) throw new Error(error.message);
	return (data ?? []) as ContentIssueReport[];
}

export async function getContentReleaseReviews(
	client: SupabaseClient,
	userId: string
): Promise<ContentReleaseReview[]> {
	await requireContentAdmin(client, userId);
	const { data, error } = await client
		.from('content_release_reviews')
		.select(
			'release_id,review_status,reviewer_notes,validation_report,diff_report,validation_passed,staging_imported_at,smoke_tested_at,updated_at,content_releases(title,status,scope_id,published_at)'
		)
		.order('updated_at', { ascending: false })
		.limit(50);

	if (error) throw new Error(error.message);
	return ((data ?? []) as unknown as ReviewRow[]).map((row) => ({
		release_id: row.release_id,
		review_status: row.review_status,
		reviewer_notes: row.reviewer_notes,
		validation_report: row.validation_report,
		diff_report: row.diff_report,
		validation_passed: row.validation_passed,
		staging_imported_at: row.staging_imported_at,
		smoke_tested_at: row.smoke_tested_at,
		updated_at: row.updated_at,
		content_release: Array.isArray(row.content_releases)
			? (row.content_releases[0] ?? null)
			: row.content_releases
	}));
}

export async function reviewContentRelease(
	client: SupabaseClient,
	userId: string,
	{
		releaseId,
		decision,
		notes
	}: {
		releaseId: string;
		decision: string;
		notes: string;
	}
) {
	const { error } = await client.rpc('review_content_release', {
		p_admin_user_id: userId,
		p_release_id: releaseId,
		p_decision: decision,
		p_notes: notes
	});

	if (error) throw new Error(error.message);
}

export async function updateContentIssueStatus(
	client: SupabaseClient,
	userId: string,
	{
		issueId,
		status,
		notes
	}: {
		issueId: string;
		status: string;
		notes: string;
	}
) {
	const { error } = await client.rpc('update_content_issue_status', {
		p_admin_user_id: userId,
		p_issue_id: issueId,
		p_status: status,
		p_notes: notes
	});

	if (error) throw new Error(error.message);
}
