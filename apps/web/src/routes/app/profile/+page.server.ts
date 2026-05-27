import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getRewardInventory } from '$lib/features/engagement/server/index.server';
import {
	ensureWeeklyLeagueMembership,
	getPublicProfile,
	publicProfileInputSchema,
	upsertPublicProfile
} from '$lib/features/social/server/index.server';
import { requireUser } from '$lib/server/auth/requireUser.server';
import { noindexSeo } from '$lib/seo';

export const load: PageServerLoad = async ({ locals, parent, url }) => {
	const { user } = await parent();
	const profile = await getPublicProfile(locals.supabase, user.id, user.email);
	const rewards = await getRewardInventory(locals.supabase, user.id);

	return {
		profile,
		seo: noindexSeo('Profile', url),
		titleRewards: rewards.filter((reward) => reward.reward_kind === 'title')
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const user = await requireUser(locals);
		const formData = await request.formData();
		const parsed = publicProfileInputSchema.safeParse({
			display_name: String(formData.get('displayName') ?? ''),
			avatar_url: String(formData.get('avatarUrl') ?? ''),
			equipped_title_reward_key: String(formData.get('titleRewardKey') ?? ''),
			bio: String(formData.get('bio') ?? ''),
			leaderboard_opt_in: formData.get('leaderboardOptIn') === 'on'
		});
		const submittedValues = {
			displayName: String(formData.get('displayName') ?? ''),
			avatarUrl: String(formData.get('avatarUrl') ?? ''),
			titleRewardKey: String(formData.get('titleRewardKey') ?? ''),
			bio: String(formData.get('bio') ?? ''),
			leaderboardOptIn: formData.get('leaderboardOptIn') === 'on'
		};

		if (!parsed.success) {
			return fail(400, { error: 'Profile fields are invalid.', values: submittedValues });
		}

		try {
			const profile = await upsertPublicProfile(locals.supabase, user.id, parsed.data);
			if (profile.leaderboard_opt_in) {
				await ensureWeeklyLeagueMembership(locals.supabaseService, user.id);
			}
		} catch (error) {
			return fail(400, {
				error: error instanceof Error ? error.message : 'Unable to save profile.',
				values: submittedValues
			});
		}

		return { saved: true };
	}
};
