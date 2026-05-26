import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { z } from 'zod';
import {
	getPendingAchievementCelebrations,
	markAchievementCelebrationsSeen
} from '$lib/features/engagement/server/index.server';
import {
	getPathItemProgress,
	getSkillMasteryProjections,
	getUserProgress
} from '$lib/features/learning/server/index.server';
import { getReviewSummary } from '$lib/features/review/server/index.server';
import { requireUser } from '$lib/server/auth/requireUser.server';

const dismissCelebrationsSchema = z.object({
	eventIds: z.array(z.string().uuid()).min(1).max(20)
});

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { user, content } = await parent();
	const [
		progress,
		pathProgress,
		mastery,
		pendingAchievementCelebrations,
		reviewSummary
	] = await Promise.all([
		getUserProgress(locals.supabase, user.id, content.topic.topic_area_id, content.release.id),
		getPathItemProgress(locals.supabase, user.id, content.release.id, content.pathItems),
		getSkillMasteryProjections(locals.supabase, user.id, content.topic.topic_area_id),
		getPendingAchievementCelebrations(locals.supabase, user.id),
		getReviewSummary(locals.supabase, user.id, content)
	]);

	return {
		...content,
		pendingAchievementCelebrations,
		progress,
		mastery,
		pathProgress,
		reviewSummary
	};
};

export const actions: Actions = {
	dismissAchievementCelebrations: async ({ locals, request }) => {
		const user = await requireUser(locals);
		const formData = await request.formData();
		const parsed = dismissCelebrationsSchema.safeParse({
			eventIds: [...new Set(formData.getAll('eventId').map((value) => String(value).trim()))]
		});

		if (!parsed.success) {
			return fail(400, {
				celebrationError: 'Achievement celebration dismissal was invalid.'
			});
		}

		try {
			await markAchievementCelebrationsSeen(locals.supabaseService, user.id, parsed.data.eventIds);
		} catch (error) {
			return fail(400, {
				celebrationError:
					error instanceof Error ? error.message : 'Unable to mark achievement celebrations seen.'
			});
		}

		return {
			achievementCelebrationsDismissed: true
		};
	}
};
