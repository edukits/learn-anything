import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { getLiteraryDevicesContent } from '$lib/features/literary-devices/server/content.server';
import {
	LearnerMutationError,
	completeReviewSession
} from '$lib/features/literary-devices/server/mutations.server';
import {
	createReviewSession,
	getReviewSessionById,
	getReviewState
} from '$lib/features/literary-devices/server/review.server';
import { requireUser } from '$lib/server/auth/requireUser.server';

const submittedAnswerSchema = z.object({
	questionId: z.string().min(1),
	selectedChoiceId: z.string().min(1)
});

const submittedAnswersSchema = z.array(submittedAnswerSchema);

export const load: PageServerLoad = async ({ locals }) => {
	const user = await requireUser(locals);
	const content = await getLiteraryDevicesContent(locals.supabase);
	const { reviewSession, reviewSummary } = await getReviewState(locals.supabase, user.id, content);

	return {
		release: content.release,
		reviewSession,
		reviewSummary,
		submissionKey: crypto.randomUUID()
	};
};

export const actions: Actions = {
	start: async ({ locals }) => {
		const user = await requireUser(locals);
		const content = await getLiteraryDevicesContent(locals.supabase);

		try {
			await createReviewSession(locals.supabaseService, user.id, content);
		} catch (error) {
			return fail(400, {
				error: error instanceof Error ? error.message : 'Unable to start review.'
			});
		}

		redirect(303, '/app/literary-devices/review');
	},
	submit: async ({ request, locals }) => {
		const user = await requireUser(locals);
		const content = await getLiteraryDevicesContent(locals.supabase);
		const formData = await request.formData();
		const reviewSessionId = String(formData.get('reviewSessionId') ?? '');
		const reviewSession = reviewSessionId
			? await getReviewSessionById(locals.supabase, user.id, content, reviewSessionId)
			: null;

		if (!reviewSession) {
			return fail(404, { error: 'No active review session was found.' });
		}

		const answersRaw = String(formData.get('answers') ?? '[]');
		const submissionKey = String(formData.get('submissionKey') ?? '');
		let answersJson: unknown;

		try {
			answersJson = JSON.parse(answersRaw);
		} catch {
			return fail(400, { error: 'Submitted answers were not valid JSON.' });
		}

		const parsed = submittedAnswersSchema.safeParse(answersJson);

		if (!parsed.success) {
			return fail(400, { error: 'Submitted answers were not valid.' });
		}

		let attemptId: string;
		try {
			const result = await completeReviewSession(locals.supabaseService, {
				userId: user.id,
				release: content.release,
				reviewSessionId: reviewSession.session.id,
				questions: reviewSession.questions,
				answers: parsed.data,
				submissionKey
			});
			attemptId = result.attemptId;
		} catch (error) {
			if (error instanceof LearnerMutationError) {
				return fail(error.status, { error: error.message });
			}

			return fail(500, { error: 'Unable to complete review.' });
		}

		redirect(303, `/app/literary-devices/quiz/results?attempt=${attemptId}`);
	}
};
