import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	getContentQualityDashboard,
	getContentReleaseReviews,
	getOpenContentIssues,
	requireContentAdmin,
	reviewContentRelease,
	updateContentIssueStatus
} from '$lib/features/content-admin/server/index.server';
import { requireUser } from '$lib/server/auth/requireUser.server';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { user } = await parent();
	const signedInUser = user ?? (await requireUser(locals));
	const admin = await requireContentAdmin(locals.supabaseService, signedInUser.id);
	const [qualityMetrics, releaseReviews, openIssues] = await Promise.all([
		getContentQualityDashboard(locals.supabaseService, signedInUser.id),
		getContentReleaseReviews(locals.supabaseService, signedInUser.id),
		getOpenContentIssues(locals.supabaseService, signedInUser.id)
	]);

	return {
		admin,
		openIssues,
		qualityMetrics,
		releaseReviews
	};
};

export const actions: Actions = {
	reviewRelease: async ({ request, locals }) => {
		const user = await requireUser(locals);
		const formData = await request.formData();
		const releaseId = String(formData.get('releaseId') ?? '');
		const decision = String(formData.get('decision') ?? '');
		const notes = String(formData.get('notes') ?? '');

		if (!releaseId || !decision) {
			return fail(400, { error: 'Release and decision are required.' });
		}

		try {
			await reviewContentRelease(locals.supabaseService, user.id, { releaseId, decision, notes });
		} catch (error) {
			return fail(400, {
				error: error instanceof Error ? error.message : 'Unable to update release review.'
			});
		}

		return { saved: true };
	},
	updateIssue: async ({ request, locals }) => {
		const user = await requireUser(locals);
		const formData = await request.formData();
		const issueId = String(formData.get('issueId') ?? '');
		const status = String(formData.get('status') ?? '');
		const notes = String(formData.get('notes') ?? '');

		if (!issueId || !status) {
			return fail(400, { error: 'Issue and status are required.' });
		}

		try {
			await updateContentIssueStatus(locals.supabaseService, user.id, { issueId, status, notes });
		} catch (error) {
			return fail(400, {
				error: error instanceof Error ? error.message : 'Unable to update content issue.'
			});
		}

		return { saved: true };
	}
};
