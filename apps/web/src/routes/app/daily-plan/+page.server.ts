import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	getDailyPlanForUser,
	logRecommendationDecision
} from '$lib/features/recommendations/server/index.server';
import { requireUser } from '$lib/server/auth/requireUser.server';

export const load: PageServerLoad = async ({ locals }) => {
	const user = await requireUser(locals);
	const dailyPlan = await getDailyPlanForUser(locals.supabase, user.id);

	return {
		enrollments: dailyPlan.enrollments,
		plan: dailyPlan.plan,
		engagement: dailyPlan.engagement
	};
};

export const actions: Actions = {
	skip: async ({ request, locals }) => {
		const user = await requireUser(locals);
		const formData = await request.formData();
		const recommendationId = String(formData.get('recommendationId') ?? '');
		if (!recommendationId) {
			return fail(400, { error: 'Missing recommendation.' });
		}

		try {
			const dailyPlan = await getDailyPlanForUser(locals.supabaseService, user.id, {
				includeSkipped: true
			});
			const recommendation = dailyPlan.plan.items.find((item) => item.id === recommendationId);
			if (!recommendation) {
				return fail(404, { error: 'Recommendation is no longer available.' });
			}

			await logRecommendationDecision(
				locals.supabaseService,
				user.id,
				recommendation,
				'skipped'
			);
		} catch (error) {
			return fail(400, {
				error: error instanceof Error ? error.message : 'Unable to skip recommendation.'
			});
		}

		return { skipped: true };
	}
};
