export type EngagementSummary = {
	daily_xp_goal: number;
	xp_today: number;
	xp_total: number;
	current_streak: number;
	longest_streak: number;
	last_activity_date: string | null;
	daily_goal_percent: number;
	daily_goal_remaining: number;
};
