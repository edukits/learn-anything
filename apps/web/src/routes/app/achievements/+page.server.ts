import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getAchievements, getRewardInventory } from '$lib/features/engagement/server/index.server';
import { equipPublicProfileTitleReward } from '$lib/features/social/server/index.server';
import { requireUser } from '$lib/server/auth/requireUser.server';
import { noindexSeo } from '$lib/seo';

export const load: PageServerLoad = async ({ locals, parent, url }) => {
	const { user } = await parent();
	const [achievements, rewards] = await Promise.all([
		getAchievements(locals.supabase, user.id),
		getRewardInventory(locals.supabase, user.id)
	]);

	return {
		achievements,
		rewards,
		seo: noindexSeo('Achievements', url)
	};
};

export const actions: Actions = {
	equipTitle: async ({ locals, request }) => {
		const user = await requireUser(locals);
		const formData = await request.formData();
		const rawRewardKey = String(formData.get('rewardKey') ?? '').trim();
		const rewardKey = rawRewardKey ? rawRewardKey : null;

		try {
			await equipPublicProfileTitleReward(locals.supabase, user.id, rewardKey);
		} catch (error) {
			return fail(400, {
				equipError: error instanceof Error ? error.message : 'Unable to equip that title.',
				rewardKey: rawRewardKey
			});
		}

		return {
			equippedTitleRewardKey: rewardKey
		};
	}
};
