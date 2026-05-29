import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import {
	createDefaultAvatarOptions,
	normalizeAvatarOptions,
	publicAvatarOptionsSchema
} from '../avatar';
import type { PublicProfile } from '../types';

export const publicProfileInputSchema = z.object({
	display_name: z.string().trim().min(1).max(80),
	avatar_options: publicAvatarOptionsSchema,
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
		.select('user_id,display_name,avatar_options,title,equipped_title_reward_key,bio,leaderboard_opt_in')
		.eq('user_id', userId)
		.maybeSingle();

	if (error) throw new Error(error.message);
	if (data) {
		const profile = data as Omit<PublicProfile, 'avatar_options'> & { avatar_options: unknown };
		return {
			...profile,
			avatar_options: normalizeAvatarOptions(profile.avatar_options, profile.display_name)
		};
	}

	return {
		user_id: userId,
		display_name: 'Learner',
		avatar_options: createDefaultAvatarOptions(userId, 'Learner'),
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
				avatar_options: input.avatar_options,
				equipped_title_reward_key: input.equipped_title_reward_key,
				bio: input.bio,
				leaderboard_opt_in: input.leaderboard_opt_in
			},
			{ onConflict: 'user_id' }
		)
		.select('user_id,display_name,avatar_options,title,equipped_title_reward_key,bio,leaderboard_opt_in')
		.single();

	if (error) throw new Error(error.message);
	const profile = data as Omit<PublicProfile, 'avatar_options'> & { avatar_options: unknown };
	return {
		...profile,
		avatar_options: normalizeAvatarOptions(profile.avatar_options, profile.display_name)
	};
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
