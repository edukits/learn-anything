import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	getDiagnosticAvailability,
	getDiagnosticQuestions,
	getLatestDiagnosticSummary,
	parseSubmittedAnswers,
	requireProtectedTopic,
	submitDiagnostic
} from '$lib/features/learning/server/index.server';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { user, content } = await parent();
	const [questions, latestSummary, availability] = await Promise.all([
		getDiagnosticQuestions(locals.supabase, content),
		getLatestDiagnosticSummary(locals.supabase, user.id, content),
		getDiagnosticAvailability(locals.supabase, user.id, content)
	]);

	return {
		topic: content.topic,
		questions,
		latestSummary,
		availability,
		submissionKey: crypto.randomUUID()
	};
};

export const actions: Actions = {
	submit: async ({ request, locals, params }) => {
		const { user, content } = await requireProtectedTopic(locals, params.topic);
		const formData = await request.formData();
		const submission = parseSubmittedAnswers(formData);
		if (!submission.success) {
			return fail(submission.status, { error: submission.error });
		}

		try {
			return {
				completed: true,
				summary: await submitDiagnostic(locals.supabaseService, {
					userId: user.id,
					content,
					answers: submission.answers,
					submissionKey: submission.submissionKey
				})
			};
		} catch (error) {
			return fail(400, {
				error: error instanceof Error ? error.message : 'Unable to submit diagnostic.'
			});
		}
	}
};
