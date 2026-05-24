import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

export type AchievementRow = {
	key: string;
	name: string;
	description: string;
	category: string;
	condition_type: AchievementConditionType;
	condition_scope: AchievementConditionScope;
	threshold: number;
	current_metric: number;
	progress_percent: number;
	progress_label: string;
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

export type PendingAchievementCelebration = {
	event_id: string;
	key: string;
	name: string;
	description: string;
	category: string;
	reward_kind: 'badge' | 'title' | null;
	reward_key: string | null;
	reward_label: string | null;
	earned_at: string;
};

export type AchievementConditionType = 'activity_count' | 'xp_total' | 'streak_current';
export type AchievementConditionScope =
	| 'lesson_completed'
	| 'quiz_completed'
	| 'review_completed'
	| null;

export type AchievementDefinitionRow = {
	key: string;
	name: string;
	description: string;
	category: string;
	condition_type: AchievementConditionType;
	condition_scope: AchievementConditionScope;
	threshold: number;
	reward_kind: 'badge' | 'title' | null;
	reward_key: string | null;
	reward_label: string | null;
};

type PendingAchievementEventRow = AchievementEventRow & {
	id: string;
	achievement_definitions: AchievementDefinitionRow | AchievementDefinitionRow[] | null;
};

type AchievementEventRow = {
	achievement_key: string;
	earned_at: string;
};

type AchievementProgressRow = AchievementDefinitionRow & {
	current_metric: number;
	progress_percent: number;
	earned_at: string | null;
};

const rewardKindSchema = z.enum(['badge', 'title']).nullable();
const conditionTypeSchema = z.enum(['activity_count', 'xp_total', 'streak_current']);
const conditionScopeSchema = z.enum(['lesson_completed', 'quiz_completed', 'review_completed']).nullable();
const achievementProgressRowSchema = z.object({
	key: z.string(),
	name: z.string(),
	description: z.string(),
	category: z.string(),
	condition_type: conditionTypeSchema,
	condition_scope: conditionScopeSchema,
	threshold: z.number(),
	current_metric: z.number(),
	progress_percent: z.number(),
	reward_kind: rewardKindSchema,
	reward_key: z.string().nullable(),
	reward_label: z.string().nullable(),
	earned_at: z.string().nullable()
});

const ACHIEVEMENT_DEFINITION_SELECT = `
	key,
	name,
	description,
	category,
	condition_type,
	condition_scope,
	threshold,
	reward_kind,
	reward_key,
	reward_label
`;

export async function getAchievements(
	client: SupabaseClient,
	userId: string
): Promise<AchievementRow[]> {
	const { data, error } = await client.rpc('get_achievement_progress', {
		p_user_id: userId
	});

	if (error) throw new Error(error.message);

	return buildAchievementRows((data ?? []).map(parseAchievementProgressRow));
}

export async function getRewardInventory(
	client: SupabaseClient,
	userId: string
): Promise<RewardInventoryItem[]> {
	const [
		{ data: rewards, error: rewardsError },
		{ data: profile, error: profileError }
	] = await Promise.all([
		client
			.from('reward_inventory')
			.select('id,reward_kind,reward_key,reward_label,earned_at')
			.eq('user_id', userId)
			.order('earned_at', { ascending: false }),
		client
			.from('public_profiles')
			.select('equipped_title_reward_key')
			.eq('user_id', userId)
			.maybeSingle()
	]);

	if (rewardsError) throw new Error(rewardsError.message);
	if (profileError) throw new Error(profileError.message);

	const equippedTitleRewardKey = profile?.equipped_title_reward_key ?? null;

	return ((rewards ?? []) as Omit<RewardInventoryItem, 'equipped'>[]).map((reward) => ({
		id: reward.id,
		reward_kind: reward.reward_kind,
		reward_key: reward.reward_key,
		reward_label: reward.reward_label,
		earned_at: reward.earned_at,
		equipped: reward.reward_kind === 'title' && reward.reward_key === equippedTitleRewardKey
	}));
}

export async function getPendingAchievementCelebrations(
	client: SupabaseClient,
	userId: string
): Promise<PendingAchievementCelebration[]> {
	const { data, error } = await client
		.from('achievement_events')
		.select(
			`
			id,
			achievement_key,
			earned_at,
			achievement_definitions!inner (
				${ACHIEVEMENT_DEFINITION_SELECT}
			)
		`
		)
		.eq('user_id', userId)
		.is('celebration_seen_at', null)
		.order('earned_at', { ascending: true });

	if (error) throw new Error(error.message);

	return ((data ?? []) as PendingAchievementEventRow[]).flatMap((event) => {
		const rawDefinition = Array.isArray(event.achievement_definitions)
			? event.achievement_definitions[0]
			: event.achievement_definitions;
		if (!rawDefinition) return [];
		const definition = parseAchievementDefinitionRow(rawDefinition);

		return {
			event_id: event.id,
			key: definition.key,
			name: definition.name,
			description: definition.description,
			category: definition.category,
			reward_kind: definition.reward_kind,
			reward_key: definition.reward_key,
			reward_label: definition.reward_label,
			earned_at: event.earned_at
		};
	});
}

export async function markAchievementCelebrationsSeen(
	client: SupabaseClient,
	userId: string,
	eventIds: string[]
): Promise<void> {
	if (!eventIds.length) return;

	const { error } = await client
		.from('achievement_events')
		.update({ celebration_seen_at: new Date().toISOString() })
		.eq('user_id', userId)
		.in('id', eventIds);

	if (error) throw new Error(error.message);
}

export function buildAchievementRows(rows: AchievementProgressRow[]): AchievementRow[] {
	return rows
		.map((definition) => {
			return {
				key: definition.key,
				name: definition.name,
				description: definition.description,
				category: definition.category,
				condition_type: definition.condition_type,
				condition_scope: definition.condition_scope,
				threshold: definition.threshold,
				current_metric: definition.current_metric,
				progress_percent: definition.progress_percent,
				progress_label: formatAchievementProgressLabel(definition, definition.current_metric),
				reward_kind: definition.reward_kind,
				reward_key: definition.reward_key,
				reward_label: definition.reward_label,
				earned_at: definition.earned_at
			};
		})
		.toSorted(compareAchievementRows);
}

function compareAchievementRows(a: AchievementRow, b: AchievementRow) {
	if (a.earned_at && b.earned_at) {
		return new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime();
	}
	if (a.earned_at) return -1;
	if (b.earned_at) return 1;

	if (b.progress_percent !== a.progress_percent) {
		return b.progress_percent - a.progress_percent;
	}

	return a.threshold - b.threshold || a.name.localeCompare(b.name);
}

function formatAchievementProgressLabel(
	definition: Pick<AchievementDefinitionRow, 'condition_type' | 'condition_scope' | 'threshold'>,
	currentMetric: number
) {
	const current = Math.min(currentMetric, definition.threshold);
	const unit = getProgressUnit(definition);
	return `${current} / ${definition.threshold} ${unit}`;
}

function getProgressUnit(
	definition: Pick<AchievementDefinitionRow, 'condition_type' | 'condition_scope' | 'threshold'>
) {
	switch (definition.condition_type) {
		case 'xp_total':
			return 'XP';
		case 'streak_current':
			return definition.threshold === 1 ? 'day' : 'days';
		case 'activity_count':
			switch (definition.condition_scope) {
				case 'lesson_completed':
					return definition.threshold === 1 ? 'lesson' : 'lessons';
				case 'quiz_completed':
					return definition.threshold === 1 ? 'quiz' : 'quizzes';
				case 'review_completed':
					return definition.threshold === 1 ? 'review' : 'reviews';
				default:
					throw new Error('Activity achievements require a supported condition scope.');
			}
		default:
			return exhaustiveConditionType(definition.condition_type);
	}
}

function parseAchievementDefinitionRow(value: unknown): AchievementDefinitionRow {
	return achievementProgressRowSchema
		.omit({ current_metric: true, progress_percent: true, earned_at: true })
		.parse(value);
}

function parseAchievementProgressRow(value: unknown): AchievementProgressRow {
	return achievementProgressRowSchema.parse(value);
}

function exhaustiveConditionType(value: never): never {
	throw new Error(`Unsupported achievement condition type: ${value}`);
}
