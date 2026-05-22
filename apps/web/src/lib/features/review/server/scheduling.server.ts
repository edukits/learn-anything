import type { SupabaseClient } from '@supabase/supabase-js';
import {
	gradeFromCorrectness,
	numericGrade,
	scheduleSpacedRepetitionReview,
	type SpacedRepetitionLearningState,
	type SpacedRepetitionState
} from '../scheduling';

export type DueSpacedRepetitionItem = {
	id: string;
	topic_area_id: string;
	release_id: string;
	question_id: string;
	question_version: number;
	skill_id: string;
	due_at: string;
};

type SpacedRepetitionItemRow = {
	id: string;
	state: SpacedRepetitionLearningState | null;
	review_count: number | null;
	lapse_count: number | null;
	ease_factor: number | string | null;
	interval_days: number | null;
	due_at: string;
	last_reviewed_at: string | null;
};

type RecordSpacedRepetitionOutcomeParams = {
	userId: string;
	topicId: string;
	releaseId: string;
	questionId: string;
	questionVersion: number;
	skillId: string;
	isCorrect: boolean;
	source: 'quiz' | 'review' | 'diagnostic' | 'drill';
	sourceKey: string;
	responseTimeMs?: number;
	reviewedAt?: Date;
};

export async function getDueSpacedRepetitionItems(
	client: SupabaseClient,
	userId: string,
	now = new Date(),
	options: {
		topicId?: string;
		releaseId?: string;
		limit?: number;
	} = {}
): Promise<DueSpacedRepetitionItem[]> {
	let query = client
		.from('spaced_repetition_items')
		.select('id,topic_area_id,release_id,question_id,question_version,skill_id,due_at')
		.eq('user_id', userId)
		.lte('due_at', now.toISOString())
		.order('due_at', { ascending: true });

	if (options.topicId) {
		query = query.eq('topic_area_id', options.topicId);
	}

	if (options.releaseId) {
		query = query.eq('release_id', options.releaseId);
	}

	const { data, error } = await query.limit(options.limit ?? 20);

	if (error) {
		throw new Error(error.message);
	}

	return (data ?? []) as DueSpacedRepetitionItem[];
}

export async function recordSpacedRepetitionOutcome(
	client: SupabaseClient,
	params: RecordSpacedRepetitionOutcomeParams
) {
	if (await hasRecordedReviewEvent(client, params.userId, params.sourceKey)) {
		return { recorded: false as const };
	}

	const reviewedAt = params.reviewedAt ?? new Date();
	const grade = gradeFromCorrectness(params.isCorrect);
	const existing = await getSpacedRepetitionItem(
		client,
		params.userId,
		params.questionId,
		params.questionVersion
	);
	const previousState = toSchedulingState(existing, reviewedAt);
	const nextState = scheduleSpacedRepetitionReview(previousState, grade, reviewedAt);
	const itemId = existing?.id ?? crypto.randomUUID();

	const { error: upsertError } = await client.from('spaced_repetition_items').upsert(
		{
			id: itemId,
			user_id: params.userId,
			topic_area_id: params.topicId,
			release_id: params.releaseId,
			question_id: params.questionId,
			question_version: params.questionVersion,
			skill_id: params.skillId,
			state: nextState.learningState,
			repetitions: nextState.reviewCount,
			review_count: nextState.reviewCount,
			lapse_count: nextState.lapseCount,
			ease_factor: nextState.easeFactor,
			interval_days: nextState.intervalDays,
			due_at: nextState.dueAt.toISOString(),
			last_reviewed_at: reviewedAt.toISOString()
		},
		{ onConflict: 'user_id,question_id,question_version' }
	);

	if (upsertError) {
		throw new Error(upsertError.message);
	}

	const { error: eventError } = await client.from('spaced_repetition_reviews').insert({
		item_id: itemId,
		source_key: params.sourceKey,
		user_id: params.userId,
		topic_area_id: params.topicId,
		question_id: params.questionId,
		question_version: params.questionVersion,
		grade: numericGrade(grade),
		grade_label: grade,
		response_time_ms: params.responseTimeMs ?? 0,
		previous_state: serializeState(previousState),
		next_state: serializeState(nextState),
		previous_learning_state: previousState?.learningState ?? 'new',
		new_learning_state: nextState.learningState,
		previous_interval_days: previousState?.intervalDays ?? 0,
		new_interval_days: nextState.intervalDays,
		previous_ease_factor: previousState?.easeFactor ?? 2.5,
		new_ease_factor: nextState.easeFactor,
		source: params.source,
		reviewed_at: reviewedAt.toISOString()
	});

	if (eventError) {
		throw new Error(eventError.message);
	}

	return {
		recorded: true as const,
		itemId,
		grade,
		nextState
	};
}

async function hasRecordedReviewEvent(
	client: SupabaseClient,
	userId: string,
	sourceKey: string
): Promise<boolean> {
	const { data, error } = await client
		.from('spaced_repetition_reviews')
		.select('id')
		.eq('user_id', userId)
		.eq('source_key', sourceKey)
		.maybeSingle();

	if (error) {
		throw new Error(error.message);
	}

	return Boolean(data);
}

async function getSpacedRepetitionItem(
	client: SupabaseClient,
	userId: string,
	questionId: string,
	questionVersion: number
): Promise<SpacedRepetitionItemRow | null> {
	const { data, error } = await client
		.from('spaced_repetition_items')
		.select('id,state,review_count,lapse_count,ease_factor,interval_days,due_at,last_reviewed_at')
		.eq('user_id', userId)
		.eq('question_id', questionId)
		.eq('question_version', questionVersion)
		.maybeSingle();

	if (error) {
		throw new Error(error.message);
	}

	return data as SpacedRepetitionItemRow | null;
}

function toSchedulingState(
	row: SpacedRepetitionItemRow | null,
	fallbackDueAt: Date
): SpacedRepetitionState | null {
	if (!row) return null;

	return {
		learningState: row.state ?? 'new',
		reviewCount: row.review_count ?? 0,
		lapseCount: row.lapse_count ?? 0,
		easeFactor: Number(row.ease_factor ?? 2.5),
		intervalDays: row.interval_days ?? 0,
		dueAt: row.due_at ? new Date(row.due_at) : fallbackDueAt,
		lastReviewedAt: row.last_reviewed_at ? new Date(row.last_reviewed_at) : null
	};
}

function serializeState(state: SpacedRepetitionState | null) {
	if (!state) {
		return {
			learningState: 'new',
			reviewCount: 0,
			lapseCount: 0,
			easeFactor: 2.5,
			intervalDays: 0,
			dueAt: null,
			lastReviewedAt: null
		};
	}

	return {
		learningState: state.learningState,
		reviewCount: state.reviewCount,
		lapseCount: state.lapseCount,
		easeFactor: state.easeFactor,
		intervalDays: state.intervalDays,
		dueAt: state.dueAt.toISOString(),
		lastReviewedAt: state.lastReviewedAt?.toISOString() ?? null
	};
}
