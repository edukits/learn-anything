import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	LearnerMutationError,
	completeReviewSession,
	parseSubmittedAnswers,
	requireProtectedTopic
} from '$lib/features/learning/server/index.server';
import {
	createReviewSession,
	getReviewSessionById,
	getReviewState
} from '$lib/features/review/server/index.server';
import { noindexSeo } from '$lib/seo';

export const load: PageServerLoad = async ({ locals, parent, url }) => {
	const { user, content } = await parent();
	const { reviewSession, reviewSummary } = await getReviewState(locals.supabase, user.id, content);

	return {
		release: content.release,
		topic: content.topic,
		reviewSession,
		reviewSummary,
		seo: noindexSeo(`${content.topic.name} review`, url, content.topic.public_summary),
		submissionKey: crypto.randomUUID()
	};
};

export const actions: Actions = {
	start: async ({ locals, params }) => {
		const { user, content } = await requireProtectedTopic(locals, params.topic);

		try {
			await createReviewSession(locals.supabaseService, user.id, content);
		} catch (error) {
			return fail(400, {
				error: error instanceof Error ? error.message : 'Unable to start review.'
			});
		}

		throw redirect(303, `/app/topics/${params.topic}/review`);
	},
	submit: async ({ request, locals, params }) => {
		const { user, content } = await requireProtectedTopic(locals, params.topic);
		const formData = await request.formData();
		const reviewSessionId = String(formData.get('reviewSessionId') ?? '');
		const reviewSession = reviewSessionId
			? await getReviewSessionById(locals.supabase, user.id, content, reviewSessionId)
			: null;

		if (!reviewSession) {
			return fail(404, { error: 'No active review session was found.' });
		}

		const submission = parseSubmittedAnswers(formData);
		if (!submission.success) {
			return fail(submission.status, { error: submission.error });
		}

		let attemptId: string;
		try {
			const result = await completeReviewSession(locals.supabaseService, {
				userId: user.id,
				topicId: content.topic.topic_area_id,
				release: content.release,
				reviewSessionId: reviewSession.session.id,
				questions: reviewSession.questions,
				answers: submission.answers,
				submissionKey: submission.submissionKey
			});
			attemptId = result.attemptId;
		} catch (error) {
			if (error instanceof LearnerMutationError) {
				return fail(error.status, { error: error.message });
			}

			return fail(500, { error: 'Unable to complete review.' });
		}

		throw redirect(303, `/app/topics/${params.topic}/quiz/results?attempt=${attemptId}`);
	}
};
