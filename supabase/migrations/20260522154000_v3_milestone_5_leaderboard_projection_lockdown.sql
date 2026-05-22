drop policy if exists "Leaderboard entries are readable for opted-in public profiles"
	on public.leaderboard_entries;

comment on table public.leaderboard_entries is
	'Reserved leaderboard projection table. V3 reads leaderboards through get_weekly_leaderboard so public reads stay cohort-scoped and omit stable user identifiers.';
