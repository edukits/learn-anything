import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeAvatarOptions } from '../avatar';
import type { LeaderboardEntry, WeeklyLeagueMembership } from '../types';

type LeaderboardRow = {
	rank: number | string;
	entry_key: string;
	display_name: string;
	avatar_options: unknown;
	title: string | null;
	bio: string | null;
	xp_points: number | string;
	activity_count: number | string;
	league_key: string | null;
	is_viewer: boolean;
};

export async function ensureWeeklyLeagueMembership(
	client: SupabaseClient,
	userId: string,
	topicId: string | null = null
): Promise<WeeklyLeagueMembership> {
	const { data, error } = topicId
		? await client.rpc('ensure_weekly_topic_league_membership', {
				p_user_id: userId,
				p_topic_area_id: topicId
			})
		: await client.rpc('ensure_weekly_league_membership', {
				p_user_id: userId
			});

	if (error) throw new Error(error.message);
	const [membership] = data ?? [];
	if (!membership?.period_id || !membership?.league_key) {
		throw new Error('Unable to assign weekly league.');
	}

	return membership as WeeklyLeagueMembership;
}

export async function getWeeklyLeaderboard(
	client: SupabaseClient,
	userId: string,
	topicId: string | null
): Promise<LeaderboardEntry[]> {
	const { data, error } = await client.rpc('get_weekly_leaderboard', {
		p_viewer_user_id: userId,
		p_topic_area_id: topicId,
		p_limit: 25
	});

	if (error) throw new Error(error.message);

	return ((data ?? []) as LeaderboardRow[]).map((row) => ({
		rank: Number(row.rank),
		entry_key: row.entry_key,
		display_name: row.display_name,
		avatar_options: normalizeAvatarOptions(row.avatar_options, row.display_name),
		title: row.title,
		bio: row.bio,
		xp_points: Number(row.xp_points),
		activity_count: Number(row.activity_count),
		league_key: row.league_key,
		is_viewer: row.is_viewer
	}));
}
