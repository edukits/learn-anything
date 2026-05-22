import type { PageServerLoad } from './$types';
import {
	getAchievements,
	getRewardInventory
} from '$lib/features/engagement/server/index.server';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { user } = await parent();
	const [achievements, rewards] = await Promise.all([
		getAchievements(locals.supabase, user.id),
		getRewardInventory(locals.supabase, user.id)
	]);

	return {
		achievements,
		rewards
	};
};
