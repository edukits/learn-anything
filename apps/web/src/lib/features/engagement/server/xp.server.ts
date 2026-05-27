import type { SupabaseClient } from '@supabase/supabase-js';
import type { EngagementSummary } from '../types';

export const DEFAULT_DAILY_XP_GOAL = 50;
export const ENGAGEMENT_TIME_ZONE = 'America/Los_Angeles';
const DAY_PARTS_FORMATTER = new Intl.DateTimeFormat('en-US', {
	timeZone: ENGAGEMENT_TIME_ZONE,
	year: 'numeric',
	month: '2-digit',
	day: '2-digit'
});
const TIME_PARTS_FORMATTER = new Intl.DateTimeFormat('en-US', {
	timeZone: ENGAGEMENT_TIME_ZONE,
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
	hour: '2-digit',
	minute: '2-digit',
	second: '2-digit',
	hourCycle: 'h23'
});

type EngagementXpSummaryRow = {
	xp_total: number | string | null;
	xp_today: number | string | null;
};

function formatTimeZoneDay(date: Date) {
	const parts = DAY_PARTS_FORMATTER.formatToParts(date);
	const part = (type: string) => parts.find((candidate) => candidate.type === type)?.value ?? '01';
	return {
		year: Number(part('year')),
		month: Number(part('month')),
		day: Number(part('day'))
	};
}

export function getEngagementDateValue(date = new Date()) {
	const { year, month, day } = formatTimeZoneDay(date);

	return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getTimeZoneOffsetMs(date: Date) {
	const parts = TIME_PARTS_FORMATTER.formatToParts(date);
	const part = (type: string) => parts.find((candidate) => candidate.type === type)?.value ?? '0';
	const asUtc = Date.UTC(
		Number(part('year')),
		Number(part('month')) - 1,
		Number(part('day')),
		Number(part('hour')),
		Number(part('minute')),
		Number(part('second'))
	);
	return asUtc - date.getTime();
}

function zonedTimeToUtc(
	year: number,
	month: number,
	day: number,
	hour: number,
	minute: number,
	second: number,
	ms = 0
) {
	const guess = Date.UTC(year, month - 1, day, hour, minute, second, ms);
	const offset = getTimeZoneOffsetMs(new Date(guess));
	return new Date(guess - offset);
}

function zonedDayBounds(now = new Date()) {
	const { year, month, day } = formatTimeZoneDay(now);
	return {
		start: zonedTimeToUtc(year, month, day, 0, 0, 0, 0).toISOString(),
		end: zonedTimeToUtc(year, month, day, 23, 59, 59, 999).toISOString()
	};
}

export async function getEngagementSummary(
	client: SupabaseClient,
	userId: string
): Promise<EngagementSummary> {
	const today = zonedDayBounds();
	const [{ data: goal, error: goalError }, { data: streak, error: streakError }, xpSummary] =
		await Promise.all([
			client
				.from('daily_goal_settings')
				.select('user_id,daily_xp_goal')
				.eq('user_id', userId)
				.maybeSingle(),
			client
				.from('streaks')
				.select('current_count,longest_count,last_activity_date')
				.eq('user_id', userId)
				.maybeSingle(),
			getXpSummary(client, userId, today.start, today.end)
		]);

	if (goalError) throw new Error(goalError.message);
	if (streakError) throw new Error(streakError.message);

	const dailyGoal = goal?.daily_xp_goal ?? DEFAULT_DAILY_XP_GOAL;
	const xpToday = xpSummary.xpToday;

	return {
		daily_xp_goal: dailyGoal,
		xp_today: xpToday,
		xp_total: xpSummary.xpTotal,
		current_streak: streak?.current_count ?? 0,
		longest_streak: streak?.longest_count ?? 0,
		last_activity_date: streak?.last_activity_date ?? null,
		daily_goal_percent: Math.min(100, Math.round((xpToday / dailyGoal) * 100)),
		daily_goal_remaining: Math.max(0, dailyGoal - xpToday)
	};
}

async function getXpSummary(client: SupabaseClient, userId: string, start: string, end: string) {
	const { data, error } = await client
		.rpc('get_engagement_xp_summary', {
			p_user_id: userId,
			p_today_start: start,
			p_today_end: end
		})
		.single();

	if (error) throw new Error(error.message);
	const summary = data as EngagementXpSummaryRow | null;

	return {
		xpTotal: Number(summary?.xp_total ?? 0),
		xpToday: Number(summary?.xp_today ?? 0)
	};
}
