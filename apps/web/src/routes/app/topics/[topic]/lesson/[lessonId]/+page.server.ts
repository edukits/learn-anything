import { error as kitError, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	completeLesson,
	getLesson,
	getPathItemProgress,
	parseIssueReportForm,
	reportContentIssue,
	requireProtectedTopic
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
		(item) => item.item_type === 'lesson' && item.item_id === params.lessonId
	);
	if (!itemProgress) {
		kitError(404, 'Lesson not found in the current topic path.');
	}

	const locked = itemProgress.state === 'locked';
	const lesson = locked ? null : await getLesson(locals.supabase, content, params.lessonId);

	return {
		...content,
		lesson,
		itemProgress,
		locked
	};
};

export const actions: Actions = {
	complete: async ({ locals, params }) => {
		const { user, content } = await requireProtectedTopic(locals, params.topic);
		const pathProgress = await getPathItemProgress(
			locals.supabase,
			user.id,
			content.release.id,
			content.pathItems
		);
		const itemProgress = pathProgress.find(
			(item) => item.item_type === 'lesson' && item.item_id === params.lessonId
		);
		if (!itemProgress) {
			kitError(404, 'Lesson not found in the current topic path.');
		}
		if (itemProgress.state === 'locked') {
			return fail(403, { error: 'Complete the previous path item before completing this lesson.' });
		}

		const lesson = await getLesson(locals.supabase, content, params.lessonId);

		try {
			await completeLesson(
				locals.supabaseService,
				user.id,
				content.topic.topic_area_id,
				content.release,
				lesson
			);
		} catch (error) {
			return fail(500, {
				error: error instanceof Error ? error.message : 'Unable to complete lesson.'
			});
		}

		throw redirect(303, `/app/topics/${params.topic}`);
	},
	reportIssue: async ({ request, locals, params }) => {
		const { user, content } = await requireProtectedTopic(locals, params.topic);
		const formData = await request.formData();

		try {
			const lesson = await getLesson(locals.supabase, content, params.lessonId);
			const issue = parseIssueReportForm(formData);
			await reportContentIssue(locals.supabaseService, {
				userId: user.id,
				topicId: content.topic.topic_area_id,
				releaseId: content.release.id,
				contentType: 'lesson',
				contentId: lesson.lesson_id,
				contentVersion: lesson.version,
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
