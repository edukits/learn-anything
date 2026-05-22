import type { PageServerLoad } from './$types';
import { getAttemptSkillAccuracyStats, getAttempts, getUserProgress } from '$lib/features/learning/server/index.server';

const completedAtFormatter = new Intl.DateTimeFormat('en-US', {
	dateStyle: 'medium',
	timeStyle: 'short',
	timeZone: 'America/Los_Angeles'
});

export const load: PageServerLoad = async ({ locals, parent, url }) => {
	const { user, content } = await parent();
	const progress = await getUserProgress(locals.supabase, user.id, content.topic.topic_area_id, content.release.id);
	const attempts = await getAttempts(locals.supabase, user.id, content.release.id);
	const requestedAttemptId = url.searchParams.get('attempt');
	const attempt = attempts.find((candidate) => candidate.id === requestedAttemptId) ?? attempts[0] ?? null;
	const skillAccuracy = attempt ? await getAttemptSkillAccuracyStats(locals.supabase, attempt.id) : [];

	return {
		...content,
		progress,
		attempt,
		attemptCompletedAtLabel: attempt ? completedAtFormatter.format(new Date(attempt.completed_at)) : null,
		skillAccuracy
	};
};
