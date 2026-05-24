import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { PublicProfile } from '../types';

export const publicProfileInputSchema = z.object({
	display_name: z.string().trim().min(1).max(80),
	avatar_url: z
		.string()
		.trim()
		.max(500)
		.optional()
		.refine((value) => !value || isSafePublicImageUrl(value), {
			message: 'Avatar URL must be an HTTP or HTTPS URL.'
		})
		.transform((value) => (value ? value : null)),
	equipped_title_reward_key: z
		.string()
		.trim()
		.max(80)
		.optional()
		.transform((value) => (value ? value : null)),
	bio: z
		.string()
		.trim()
		.max(240)
		.optional()
		.transform((value) => (value ? value : null)),
	leaderboard_opt_in: z.boolean()
});

export type PublicProfileInput = z.infer<typeof publicProfileInputSchema>;

export async function getPublicProfile(
	client: SupabaseClient,
	userId: string,
	_email?: string | null
): Promise<PublicProfile> {
	const { data, error } = await client
		.from('public_profiles')
		.select('user_id,display_name,avatar_url,title,equipped_title_reward_key,bio,leaderboard_opt_in')
		.eq('user_id', userId)
		.maybeSingle();

	if (error) throw new Error(error.message);
	if (data) return data as PublicProfile;

	return {
		user_id: userId,
		display_name: 'Learner',
		avatar_url: null,
		title: null,
		equipped_title_reward_key: null,
		bio: null,
		leaderboard_opt_in: false
	};
}

export async function upsertPublicProfile(
	client: SupabaseClient,
	userId: string,
	input: PublicProfileInput
): Promise<PublicProfile> {
	const { data, error } = await client
		.from('public_profiles')
		.upsert(
			{
				user_id: userId,
				display_name: input.display_name,
				avatar_url: input.avatar_url,
				equipped_title_reward_key: input.equipped_title_reward_key,
				bio: input.bio,
				leaderboard_opt_in: input.leaderboard_opt_in
			},
			{ onConflict: 'user_id' }
		)
		.select('user_id,display_name,avatar_url,title,equipped_title_reward_key,bio,leaderboard_opt_in')
		.single();

	if (error) throw new Error(error.message);
	return data as PublicProfile;
}

export async function equipPublicProfileTitleReward(
	client: SupabaseClient,
	userId: string,
	rewardKey: string | null
): Promise<void> {
	if (rewardKey) {
		const { data: reward, error: rewardError } = await client
			.from('reward_inventory')
			.select('reward_key,reward_kind')
			.eq('user_id', userId)
			.eq('reward_key', rewardKey)
			.eq('reward_kind', 'title')
			.maybeSingle();

		if (rewardError) throw new Error(rewardError.message);
		if (!reward) throw new Error('Choose an earned title reward.');
	}

	const { error } = await client
		.from('public_profiles')
		.upsert(
			{
				user_id: userId,
				equipped_title_reward_key: rewardKey
			},
			{ onConflict: 'user_id' }
		)
		.select('user_id')
		.single();

	if (error) throw new Error(error.message);
}

function isSafePublicImageUrl(value: string) {
	try {
		const url = new URL(value);
		return url.protocol === 'http:' || url.protocol === 'https:';
	} catch {
		return false;
	}
}
