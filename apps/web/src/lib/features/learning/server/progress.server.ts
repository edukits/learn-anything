import type { SupabaseClient } from '@supabase/supabase-js';
import type { LearningPathItem, LearningPathItemProgress } from '../types';

export type UserProgress = {
	intro_lesson_completed: boolean;
	quiz_completed: boolean;
	latest_attempt_id: string | null;
	latest_score: number | null;
	best_score: number | null;
	total_attempts: number;
};

export type AttemptSummary = {
	id: string;
	score: number;
	correct_count: number;
	question_count: number;
	completed_at: string;
	attempt_kind: 'quiz' | 'review';
};

export type SkillAccuracyStat = {
	skill_id: string;
	skill_label: string;
	attempted: number;
	correct: number;
};

export type ActivityHistoryItem = {
	id: string;
	activity_type: 'lesson_completed' | 'quiz_completed' | 'review_completed';
	source_type: string;
	source_id: string;
	source_version: number | null;
	release_id: string;
	metadata: Record<string, unknown>;
	occurred_at: string;
};

function asNumber(value: unknown): number | null {
	if (value === null || value === undefined) {
		return null;
	}

	return Number(value);
}

export async function getUserProgress(
	client: SupabaseClient,
	userId: string,
	topicId: string,
	releaseId: string
): Promise<UserProgress> {
	const { data, error } = await client
		.from('user_progress')
		.select(
			'intro_lesson_completed,quiz_completed,latest_attempt_id,latest_score,best_score,total_attempts'
		)
		.eq('user_id', userId)
		.eq('topic_area_id', topicId)
		.eq('release_id', releaseId)
		.maybeSingle();

	if (error) {
		throw new Error(error.message);
	}

	return {
		intro_lesson_completed: data?.intro_lesson_completed ?? false,
		quiz_completed: data?.quiz_completed ?? false,
		latest_attempt_id: data?.latest_attempt_id ?? null,
		latest_score: asNumber(data?.latest_score),
		best_score: asNumber(data?.best_score),
		total_attempts: data?.total_attempts ?? 0
	};
}

export async function getAttempts(
	client: SupabaseClient,
	userId: string,
	releaseId: string
): Promise<AttemptSummary[]> {
	const { data, error } = await client
		.from('quiz_attempts')
		.select('id,score,correct_count,question_count,completed_at,attempt_kind')
		.eq('user_id', userId)
		.eq('release_id', releaseId)
		.order('completed_at', { ascending: false });

	if (error) {
		throw new Error(error.message);
	}

	return (data ?? []).map((attempt) => ({
		id: attempt.id,
		score: Number(attempt.score),
		correct_count: attempt.correct_count,
		question_count: attempt.question_count,
		completed_at: attempt.completed_at,
		attempt_kind: attempt.attempt_kind
	}));
}

export async function getActivityHistory(
	client: SupabaseClient,
	userId: string,
	topicId?: string
): Promise<ActivityHistoryItem[]> {
	let query = client
		.from('activity_events')
		.select('id,activity_type,source_type,source_id,source_version,release_id,metadata,occurred_at')
		.eq('user_id', userId)
		.order('occurred_at', { ascending: false })
		.limit(50);

	if (topicId) {
		query = query.eq('topic_area_id', topicId);
	}

	const { data, error } = await query;

	if (error) {
		throw new Error(error.message);
	}

	return (data ?? []) as ActivityHistoryItem[];
}

export async function getPathItemProgress(
	client: SupabaseClient,
	userId: string,
	releaseId: string,
	pathItems: LearningPathItem[]
): Promise<LearningPathItemProgress[]> {
	const [{ data: completions, error: completionsError }, { data: attempts, error: attemptsError }] =
		await Promise.all([
			client
				.from('lesson_completions')
				.select('lesson_id,lesson_version')
				.eq('user_id', userId)
				.eq('release_id', releaseId),
			client
				.from('quiz_attempts')
				.select('quiz_id,quiz_version,score,completed_at')
				.eq('user_id', userId)
				.eq('release_id', releaseId)
				.eq('attempt_kind', 'quiz')
				.order('completed_at', { ascending: true })
		]);

	if (completionsError) throw new Error(completionsError.message);
	if (attemptsError) throw new Error(attemptsError.message);

	const completedLessons = new Set(
		(completions ?? []).map((completion) => `${completion.lesson_id}@${completion.lesson_version}`)
	);
	const attemptsByQuiz = new Map<
		string,
		{ latest_score: number | null; best_score: number | null; total_attempts: number }
	>();
	for (const attempt of attempts ?? []) {
		const key = `${attempt.quiz_id}@${attempt.quiz_version}`;
		const current = attemptsByQuiz.get(key) ?? {
			latest_score: null,
			best_score: null,
			total_attempts: 0
		};
		const score = Number(attempt.score);
		current.latest_score = score;
		current.best_score = Math.max(current.best_score ?? 0, score);
		current.total_attempts += 1;
		attemptsByQuiz.set(key, current);
	}

	let blockedByRequiredItem = false;
	let activeRequiredItemFound = false;
	return pathItems.map((item) => {
		const quizStats =
			item.item_type === 'quiz'
				? attemptsByQuiz.get(`${item.item_id}@${item.item_version}`)
				: undefined;
		const completed =
			item.item_type === 'lesson'
				? completedLessons.has(`${item.item_id}@${item.item_version}`)
				: Boolean(quizStats?.total_attempts);
		const state = completed
			? 'completed'
			: blockedByRequiredItem
				? 'locked'
				: !activeRequiredItemFound && item.required
					? 'active'
					: 'available';

		if (!completed && item.required) {
			activeRequiredItemFound = true;
			blockedByRequiredItem = true;
		}

		return {
			...item,
			state,
			latest_score: quizStats?.latest_score ?? null,
			best_score: quizStats?.best_score ?? null,
			total_attempts: quizStats?.total_attempts ?? 0
		};
	});
}

function summarizeSkillAccuracy(
	answers: { skill_id: string; device: string; is_correct: boolean }[]
) {
	const stats = new Map<string, SkillAccuracyStat>();
	for (const answer of answers) {
		const current = stats.get(answer.skill_id) ?? {
			skill_id: answer.skill_id,
			skill_label: answer.device,
			attempted: 0,
			correct: 0
		};
		current.attempted += 1;
		if (answer.is_correct) {
			current.correct += 1;
		}
		stats.set(answer.skill_id, current);
	}

	return [...stats.values()].toSorted((a, b) => a.skill_label.localeCompare(b.skill_label));
}

export async function getSkillAccuracyStats(
	client: SupabaseClient,
	attemptIds: string[]
): Promise<SkillAccuracyStat[]> {
	if (!attemptIds.length) {
		return [];
	}

	const { data, error } = await client
		.from('quiz_attempt_answers')
		.select('skill_id,device,is_correct')
		.in('attempt_id', attemptIds);

	if (error) {
		throw new Error(error.message);
	}

	return summarizeSkillAccuracy(data ?? []);
}

export async function getAttemptSkillAccuracyStats(
	client: SupabaseClient,
	attemptId: string
): Promise<SkillAccuracyStat[]> {
	const { data, error } = await client
		.from('quiz_attempt_answers')
		.select('skill_id,device,is_correct')
		.eq('attempt_id', attemptId);

	if (error) {
		throw new Error(error.message);
	}

	return summarizeSkillAccuracy(data ?? []);
}
