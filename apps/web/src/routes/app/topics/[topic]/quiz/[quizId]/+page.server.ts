import { error as kitError, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	LearnerMutationError,
	getPathItemProgress,
	getPracticeQuizQuestions,
	getQuiz,
	parseIssueReportForm,
	parseIssueTarget,
	parseSubmittedAnswers,
	reportContentIssue,
	requireProtectedTopic,
	submitQuiz
} from '$lib/features/learning/server/index.server';

export const load: PageServerLoad = async ({ locals, parent, params }) => {
	const { user, content } = await parent();
	const pathProgress = await getPathItemProgress(
		locals.supabase,
		user.id,
		content.release.id,
		content.pathItems
	);
	const itemProgress = pathProgress.find(
		(item) => item.item_type === 'quiz' && item.item_id === params.quizId
	);
	if (!itemProgress) {
		kitError(404, 'Quiz not found in the current topic path.');
	}

	const locked = itemProgress.state === 'locked';
	const quiz = locked ? null : await getQuiz(locals.supabase, content, params.quizId);
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
		const { user, content } = await requireProtectedTopic(locals, params.topic);
		const pathProgress = await getPathItemProgress(
			locals.supabase,
			user.id,
			content.release.id,
			content.pathItems
		);
		const itemProgress = pathProgress.find(
			(item) => item.item_type === 'quiz' && item.item_id === params.quizId
		);
		if (!itemProgress) {
			kitError(404, 'Quiz not found in the current topic path.');
		}

		if (itemProgress.state === 'locked') {
			return fail(403, { error: 'Complete the previous path item before submitting this quiz.' });
		}

		const quiz = await getQuiz(locals.supabase, content, params.quizId);
		const questions = await getPracticeQuizQuestions(locals.supabase, quiz);
		const formData = await request.formData();
		const submission = parseSubmittedAnswers(formData);
		if (!submission.success) {
			return fail(submission.status, { error: submission.error });
		}

		let attemptId: string;
		try {
			const result = await submitQuiz(locals.supabaseService, {
				userId: user.id,
				topicId: content.topic.topic_area_id,
				release: content.release,
				quiz,
				questions,
				answers: submission.answers,
				submissionKey: submission.submissionKey
			});
			attemptId = result.attemptId;
		} catch (error) {
			if (error instanceof LearnerMutationError) {
				return fail(error.status, { error: error.message });
			}

			return fail(500, { error: 'Unable to submit quiz.' });
		}

		throw redirect(303, `/app/topics/${params.topic}/quiz/results?attempt=${attemptId}`);
	},
	reportIssue: async ({ request, locals, params }) => {
		const { user, content } = await requireProtectedTopic(locals, params.topic);
		const formData = await request.formData();

		try {
			const quiz = await getQuiz(locals.supabase, content, params.quizId);
			const questions = await getPracticeQuizQuestions(locals.supabase, quiz);
			const issue = parseIssueReportForm(formData);
			const target = parseIssueTarget(String(formData.get('target') ?? ''));
			if (
				!target ||
				target.contentType !== 'quiz_question' ||
				!questions.some(
					(question) =>
						question.question_id === target.contentId && question.version === target.contentVersion
				)
			) {
				return fail(400, { error: 'Choose a question from this quiz.' });
			}

			await reportContentIssue(locals.supabaseService, {
				userId: user.id,
				topicId: content.topic.topic_area_id,
				releaseId: content.release.id,
				contentType: target.contentType,
				contentId: target.contentId,
				contentVersion: target.contentVersion,
				issueType: issue.issueType,
				message: issue.message
			});
		} catch (error) {
			return fail(400, {
				error: error instanceof Error ? error.message : 'Unable to report content issue.'
			});
		}

		return { issueReported: true };
	}
};
