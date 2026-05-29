import type { PublicAvatarOptions } from './avatar';

export type PublicProfile = {
	user_id: string;
	display_name: string;
	avatar_options: PublicAvatarOptions;
	title: string | null;
	equipped_title_reward_key: string | null;
	bio: string | null;
	leaderboard_opt_in: boolean;
};

export type LeaderboardEntry = {
	rank: number;
	entry_key: string;
	display_name: string;
	avatar_options: PublicAvatarOptions;
	title: string | null;
	bio: string | null;
	xp_points: number;
	activity_count: number;
	league_key: string | null;
	is_viewer: boolean;
};

export type WeeklyLeagueMembership = {
	period_id: string;
	league_key: string;
};
