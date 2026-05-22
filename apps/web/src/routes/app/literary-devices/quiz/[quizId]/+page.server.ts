import { error as kitError, fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import {
	getLiteraryDevicesContent,
	getLiteraryDevicesQuiz,
	getPracticeQuizQuestions
} from '$lib/features/literary-devices/server/content.server';
import { LearnerMutationError, submitQuiz } from '$lib/features/literary-devices/server/mutations.server';
import { getPathItemProgress } from '$lib/features/literary-devices/server/progress.server';
import { requireUser } from '$lib/server/auth/requireUser.server';

const submittedAnswerSchema = z.object({
	questionId: z.string().min(1),
	selectedChoiceId: z.string().min(1)
});

const submittedAnswersSchema = z.array(submittedAnswerSchema);

export const load: PageServerLoad = async ({ locals, params }) => {
	const user = await requireUser(locals);
	const content = await getLiteraryDevicesContent(locals.supabase);
	const pathProgress = await getPathItemProgress(locals.supabase, user.id, content.release.id, content.pathItems);
	const itemProgress = pathProgress.find((item) => item.item_type === 'quiz' && item.item_id === params.quizId);
	if (!itemProgress) {
		kitError(404, 'Quiz not found in the current Literary Devices path.');
	}

	const locked = itemProgress.state === 'locked';
	const quiz = locked ? null : await getLiteraryDevicesQuiz(locals.supabase, content, params.quizId);
	const questions = quiz ? await getPracticeQuizQuestions(locals.supabase, quiz) : [];

	return {
		...content,
		quiz,
		questions,
		locked,
		submissionKey: crypto.randomUUID()
	};
};

export const actions: Actions = {
	submit: async ({ request, locals, params }) => {
		const user = await requireUser(locals);
		const content = await getLiteraryDevicesContent(locals.supabase);
		const pathProgress = await getPathItemProgress(locals.supabase, user.id, content.release.id, content.pathItems);
		const itemProgress = pathProgress.find((item) => item.item_type === 'quiz' && item.item_id === params.quizId);
		if (!itemProgress) {
			kitError(404, 'Quiz not found in the current Literary Devices path.');
		}

		if (itemProgress.state === 'locked') {
			return fail(403, { error: 'Complete the previous path item before submitting this quiz.' });
		}

		const quiz = await getLiteraryDevicesQuiz(locals.supabase, content, params.quizId);
		const questions = await getPracticeQuizQuestions(locals.supabase, quiz);
		const formData = await request.formData();
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
			const result = await submitQuiz(locals.supabaseService, {
				userId: user.id,
				release: content.release,
				quiz,
				questions,
				answers: parsed.data,
				submissionKey
			});
			attemptId = result.attemptId;
		} catch (error) {
			if (error instanceof LearnerMutationError) {
				return fail(error.status, { error: error.message });
			}

			return fail(500, { error: 'Unable to submit quiz.' });
		}

		redirect(303, `/app/literary-devices/quiz/results?attempt=${attemptId}`);
	}
};
