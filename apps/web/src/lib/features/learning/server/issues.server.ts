import type { SupabaseClient } from '@supabase/supabase-js';

const ISSUE_TYPES = new Set(['accuracy', 'clarity', 'typo', 'accessibility', 'technical', 'other']);

export type ReportContentIssueParams = {
	userId: string;
	topicId: string;
	releaseId: string;
	contentType: string;
	contentId: string;
	contentVersion: number | null;
	issueType: string;
	message: string;
};

export type ParsedIssueForm = {
	issueType: string;
	message: string;
};

export type IssueTarget = {
	contentType: 'lesson' | 'quiz' | 'quiz_question';
	contentId: string;
	contentVersion: number;
};

export function parseIssueReportForm(formData: FormData): ParsedIssueForm {
	const issueType = String(formData.get('issueType') ?? 'other');
	const message = String(formData.get('message') ?? '').trim();

	if (!ISSUE_TYPES.has(issueType)) {
		throw new Error('Choose a supported issue type.');
	}

	if (message.length < 3 || message.length > 2000) {
		throw new Error('Issue details must be between 3 and 2000 characters.');
	}

	return { issueType, message };
}

export function encodeIssueTarget(target: IssueTarget): string {
	return `${target.contentType}|${target.contentId}|${target.contentVersion}`;
}

export function parseIssueTarget(value: string): IssueTarget | null {
	const [contentType, contentId, versionValue] = value.split('|');
	const contentVersion = Number(versionValue);
	if (
		(contentType !== 'lesson' && contentType !== 'quiz' && contentType !== 'quiz_question') ||
		!contentId ||
		!Number.isInteger(contentVersion) ||
		contentVersion <= 0
	) {
		return null;
	}

	return {
		contentType,
		contentId,
		contentVersion
	};
}

export async function reportContentIssue(
	client: SupabaseClient,
	params: ReportContentIssueParams
): Promise<string> {
	const { data, error } = await client.rpc('report_content_issue', {
		p_user_id: params.userId,
		p_topic_area_id: params.topicId,
		p_release_id: params.releaseId,
		p_content_type: params.contentType,
		p_content_id: params.contentId,
		p_content_version: params.contentVersion,
		p_issue_type: params.issueType,
		p_message: params.message
	});

	if (error) throw new Error(error.message);
	if (!data) throw new Error('Issue report did not return an id.');
	return data as string;
}
