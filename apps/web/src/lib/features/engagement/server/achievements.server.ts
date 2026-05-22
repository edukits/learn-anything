import type { SupabaseClient } from '@supabase/supabase-js';

export type AchievementRow = {
	key: string;
	name: string;
	description: string;
	category: string;
	reward_kind: 'badge' | 'title' | null;
	reward_key: string | null;
	reward_label: string | null;
	earned_at: string | null;
};

export type RewardInventoryItem = {
	id: string;
	reward_kind: 'badge' | 'title';
	reward_key: string;
	reward_label: string;
	equipped: boolean;
	earned_at: string;
};

type AchievementDefinitionRow = {
	key: string;
	name: string;
	description: string;
	category: string;
	reward_kind: 'badge' | 'title' | null;
	reward_key: string | null;
	reward_label: string | null;
};

type AchievementEventRow = {
	achievement_key: string;
	earned_at: string;
};

export async function getAchievements(
	client: SupabaseClient,
	userId: string
): Promise<AchievementRow[]> {
	const [{ data: definitions, error: definitionsError }, { data: events, error: eventsError }] =
		await Promise.all([
			client
				.from('achievement_definitions')
				.select('key,name,description,category,reward_kind,reward_key,reward_label')
				.eq('active', true)
				.order('category')
				.order('threshold'),
			client
				.from('achievement_events')
				.select('achievement_key,earned_at')
				.eq('user_id', userId)
				.order('earned_at', { ascending: false })
		]);

	if (definitionsError) throw new Error(definitionsError.message);
	if (eventsError) throw new Error(eventsError.message);

	const earnedAtByKey = new Map(
		((events ?? []) as AchievementEventRow[]).map((event) => [
			event.achievement_key,
			event.earned_at
		])
	);

	return ((definitions ?? []) as AchievementDefinitionRow[]).map((definition) => ({
		key: definition.key,
		name: definition.name,
		description: definition.description,
		category: definition.category,
		reward_kind: definition.reward_kind,
		reward_key: definition.reward_key,
		reward_label: definition.reward_label,
		earned_at: earnedAtByKey.get(definition.key) ?? null
	}));
}

export async function getRewardInventory(
	client: SupabaseClient,
	userId: string
): Promise<RewardInventoryItem[]> {
	const { data, error } = await client
		.from('reward_inventory')
		.select('id,reward_kind,reward_key,reward_label,equipped,earned_at')
		.eq('user_id', userId)
		.order('earned_at', { ascending: false });

	if (error) throw new Error(error.message);
	return (data ?? []) as RewardInventoryItem[];
}
