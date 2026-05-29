import type { SupabaseClient } from '@supabase/supabase-js';
import { getActiveReleaseQuestions } from '$lib/features/learning/server/index.server';
import type { TopicContent } from '$lib/features/learning/types';
import type {
	QuizQuestionVersion,
	ReviewPracticeQuestion,
	ReviewSelectionReason,
	ReviewSummary
} from '$lib/features/learning/types';
import type { ReviewState } from '../types';
import { getDueSpacedRepetitionItems } from './scheduling.server';

export const REVIEW_ATTEMPT_KIND = 'review' as const;
const QUESTION_VERSION_SELECT =
	'question_id,version,skill_id,device,question_purpose,response_type,difficulty,prompt,choices,choice_order_strategy,fixed_choice_ids,correct_choice_id,correct_choice_ids,correct_numeric_value,correct_numeric_tolerance,sequence_items,accepted_answers,math_template,math_match_mode,accepted_math_answers,explanation';
const REVIEW_POLICY = {
	questionLimit: 8,
	lowSkillAccuracyThreshold: 0.7,
	lowSkillMinimumAttempts: 2,
	reasonLabels: {
		due_spaced_repetition: 'Spaced review due',
		missed_question: 'Review missed questions',
		low_skill_accuracy: (skillLabel: string) => `Practice ${skillLabel}`,
		not_seen_recently: 'Refresh less recent questions'
	}
};

type AttemptAnswerHistory = {
	question_id: string;
	question_version: number;
	skill_id: string;
	skill_label: string;
	is_correct: boolean;
	answered_at: string;
};

type ReviewSelection = QuizQuestionVersion & {
	reason_code: ReviewSelectionReason;
	reason_label: string;
};

type ReviewSessionRow = {
	id: string;
	release_id: string;
	status: 'created' | 'completed';
};

function questionKey(question: Pick<QuizQuestionVersion, 'question_id' | 'version'>) {
	return `${question.question_id}@${question.version}`;
}

function toPracticeQuestion(question: ReviewSelection): ReviewPracticeQuestion {
	return question;
}

async function getAttemptAnswerHistory(
	client: SupabaseClient,
	userId: string,
	releaseId: string
): Promise<AttemptAnswerHistory[]> {
	const { data: attempts, error: attemptsError } = await client
		.from('quiz_attempts')
		.select('id')
		.eq('user_id', userId)
		.eq('release_id', releaseId);

	if (attemptsError) throw new Error(attemptsError.message);
	if (!attempts?.length) return [];

	const { data: answers, error: answersError } = await client
		.from('quiz_attempt_answers')
		.select('question_id,question_version,skill_id,device,is_correct,answered_at')
		.in(
			'attempt_id',
			attempts.map((attempt) => attempt.id)
		);

	if (answersError) throw new Error(answersError.message);
	return (answers ?? []).map((answer) => ({
		question_id: answer.question_id,
		question_version: answer.question_version,
		skill_id: answer.skill_id,
		skill_label: answer.device,
		is_correct: answer.is_correct,
		answered_at: answer.answered_at
	}));
}

function latestAnswerByQuestion(history: AttemptAnswerHistory[]) {
	const latest = new Map<string, AttemptAnswerHistory>();
	for (const answer of history) {
		const key = `${answer.question_id}@${answer.question_version}`;
		const current = latest.get(key);
		if (!current || answer.answered_at > current.answered_at) {
			latest.set(key, answer);
		}
	}
	return latest;
}

function addSelection(
	selections: ReviewSelection[],
	selectedKeys: Set<string>,
	question: QuizQuestionVersion | undefined,
	reason_code: ReviewSelectionReason,
	reason_label: string
) {
	if (!question || selections.length >= REVIEW_POLICY.questionLimit) return;
	const key = questionKey(question);
	if (selectedKeys.has(key)) return;

	selectedKeys.add(key);
	selections.push(Object.assign({}, question, { reason_code, reason_label }));
}

export async function buildReviewSelection(
	client: SupabaseClient,
	userId: string,
	content: TopicContent
): Promise<ReviewSelection[]> {
	const [activeQuestions, history] = await Promise.all([
		getActiveReleaseQuestions(client, content),
		getAttemptAnswerHistory(client, userId, content.release.id)
	]);

	const questionsByKey = new Map(
		activeQuestions.map((question) => [questionKey(question), question])
	);
	const latestByQuestion = latestAnswerByQuestion(history);
	const selections: ReviewSelection[] = [];
	const selectedKeys = new Set<string>();
	const dueItems = await getDueSpacedRepetitionItems(client, userId, new Date(), {
		topicId: content.topic.topic_area_id,
		releaseId: content.release.id,
		limit: REVIEW_POLICY.questionLimit
	});

	for (const dueItem of dueItems) {
		addSelection(
			selections,
			selectedKeys,
			questionsByKey.get(`${dueItem.question_id}@${dueItem.question_version}`),
			'due_spaced_repetition',
			REVIEW_POLICY.reasonLabels.due_spaced_repetition
		);
	}

	if (!history.length) return selections;

	for (const answer of [...latestByQuestion.values()]
		.filter((candidate) => !candidate.is_correct)
		.toSorted((a, b) => b.answered_at.localeCompare(a.answered_at))) {
		addSelection(
			selections,
			selectedKeys,
			questionsByKey.get(`${answer.question_id}@${answer.question_version}`),
			'missed_question',
			REVIEW_POLICY.reasonLabels.missed_question
		);
	}

	const skillStats = new Map<
		string,
		{ skill_id: string; skill_label: string; attempted: number; correct: number }
	>();
	for (const answer of history) {
		const current = skillStats.get(answer.skill_id) ?? {
			skill_id: answer.skill_id,
			skill_label: answer.skill_label,
			attempted: 0,
			correct: 0
		};
		current.attempted += 1;
		if (answer.is_correct) current.correct += 1;
		skillStats.set(answer.skill_id, current);
	}

	for (const stat of [...skillStats.values()]
		.filter(
			(candidate) =>
				candidate.attempted >= REVIEW_POLICY.lowSkillMinimumAttempts &&
				candidate.correct / candidate.attempted < REVIEW_POLICY.lowSkillAccuracyThreshold
		)
		.toSorted((a, b) => a.correct / a.attempted - b.correct / b.attempted)) {
		const question = activeQuestions.find((candidate) => candidate.skill_id === stat.skill_id);
		addSelection(
			selections,
			selectedKeys,
			question,
			'low_skill_accuracy',
			REVIEW_POLICY.reasonLabels.low_skill_accuracy(stat.skill_label)
		);
	}

	for (const question of activeQuestions.toSorted((a, b) => {
		const aSeen = latestByQuestion.get(questionKey(a))?.answered_at ?? '';
		const bSeen = latestByQuestion.get(questionKey(b))?.answered_at ?? '';
		return aSeen.localeCompare(bSeen);
	})) {
		addSelection(
			selections,
			selectedKeys,
			question,
			'not_seen_recently',
			REVIEW_POLICY.reasonLabels.not_seen_recently
		);
	}

	return selections;
}

function summarizeSelection(selection: { reason_label: string }[]): ReviewSummary {
	const reasonLabels = [...new Set(selection.map((question) => question.reason_label))];

	return {
		available: selection.length > 0,
		question_count: selection.length,
		reason_label: reasonLabels[0] ?? null,
		reason_labels: reasonLabels
	};
}

export async function getReviewState(
	client: SupabaseClient,
	userId: string,
	content: TopicContent
): Promise<ReviewState> {
	const reviewSession = await getOpenReviewSession(client, userId, content);
	if (reviewSession) {
		return {
			reviewSession,
			reviewSummary: summarizeSelection(reviewSession.questions)
		};
	}

	const selection = await buildReviewSelection(client, userId, content);

	return {
		reviewSession: null,
		reviewSummary: summarizeSelection(selection)
	};
}

export async function getReviewSummary(
	client: SupabaseClient,
	userId: string,
	content: TopicContent
): Promise<ReviewSummary> {
	return (await getReviewState(client, userId, content)).reviewSummary;
}

export async function createReviewSession(
	client: SupabaseClient,
	userId: string,
	content: TopicContent
): Promise<string> {
	const selection = await buildReviewSelection(client, userId, content);
	if (!selection.length) {
		throw new Error('Complete a quiz or diagnostic before starting adaptive review.');
	}

	const { data, error } = await client.rpc('create_review_session', {
		p_user_id: userId,
		p_topic_area_id: content.topic.topic_area_id,
		p_release_id: content.release.id,
		p_questions: selection.map((question, index) => ({
			question_id: question.question_id,
			question_version: question.version,
			reason_code: question.reason_code,
			reason_label: question.reason_label,
			ordering: index + 1
		}))
	});

	if (error) throw new Error(error.message);

	const [result] = data ?? [];
	if (!result?.review_session_id) {
		throw new Error('Review session creation did not return an id.');
	}

	return result.review_session_id;
}

export async function getOpenReviewSession(
	client: SupabaseClient,
	userId: string,
	content: TopicContent
): Promise<{ session: ReviewSessionRow; questions: ReviewPracticeQuestion[] } | null> {
	const { data: session, error: sessionError } = await client
		.from('review_sessions')
		.select('id,release_id,status')
		.eq('user_id', userId)
		.eq('release_id', content.release.id)
		.eq('status', 'created')
		.order('created_at', { ascending: false })
		.limit(1)
		.maybeSingle();

	if (sessionError) throw new Error(sessionError.message);
	if (!session) return null;

	return {
		session: session as ReviewSessionRow,
		questions: await getReviewSessionQuestions(client, session.id)
	};
}

export async function getReviewSessionById(
	client: SupabaseClient,
	userId: string,
	content: TopicContent,
	reviewSessionId: string
): Promise<{ session: ReviewSessionRow; questions: ReviewPracticeQuestion[] } | null> {
	const { data: session, error: sessionError } = await client
		.from('review_sessions')
		.select('id,release_id,status')
		.eq('id', reviewSessionId)
		.eq('user_id', userId)
		.eq('release_id', content.release.id)
		.maybeSingle();

	if (sessionError) throw new Error(sessionError.message);
	if (!session) return null;

	return {
		session: session as ReviewSessionRow,
		questions: await getReviewSessionQuestions(client, session.id)
	};
}

async function getReviewSessionQuestions(
	client: SupabaseClient,
	reviewSessionId: string
): Promise<ReviewPracticeQuestion[]> {
	const { data: reviewQuestions, error: reviewQuestionsError } = await client
		.from('review_session_questions')
		.select('question_id,question_version,reason_code,reason_label,ordering')
		.eq('review_session_id', reviewSessionId)
		.order('ordering');

	if (reviewQuestionsError) throw new Error(reviewQuestionsError.message);
	if (!reviewQuestions?.length) return [];

	const { data: questions, error: questionsError } = await client
		.from('quiz_question_versions')
		.select(QUESTION_VERSION_SELECT)
		.in(
			'question_id',
			reviewQuestions.map((question) => question.question_id)
		);

	if (questionsError) throw new Error(questionsError.message);

	const questionsByKey = new Map(
		(questions ?? []).map((question) => [
			`${question.question_id}@${question.version}`,
			{
				question_id: question.question_id,
				version: question.version,
				skill_id: question.skill_id,
				skill_label: question.device,
				question_purpose: question.question_purpose,
				response_type: question.response_type,
				difficulty: question.difficulty,
				prompt: question.prompt,
				choices: question.choices,
				choice_order_strategy: question.choice_order_strategy ?? 'shuffle',
				fixed_choice_ids: question.fixed_choice_ids ?? [],
				correct_choice_id: question.correct_choice_id,
				correct_choice_ids: question.correct_choice_ids ?? [],
				correct_numeric_value: question.correct_numeric_value,
				correct_numeric_tolerance: question.correct_numeric_tolerance ?? 0,
				sequence_items: question.sequence_items ?? [],
				accepted_answers: question.accepted_answers ?? [],
				math_template: question.math_template,
				math_match_mode: question.math_match_mode ?? 'normalized',
				accepted_math_answers: question.accepted_math_answers ?? [],
				explanation: question.explanation
			} satisfies Omit<QuizQuestionVersion, 'ordering'>
		])
	);

	return reviewQuestions.map((reviewQuestion) => {
		const question = questionsByKey.get(
			`${reviewQuestion.question_id}@${reviewQuestion.question_version}`
		);
		if (!question) {
			throw new Error(
				`Review session references missing question ${reviewQuestion.question_id}@${reviewQuestion.question_version}.`
			);
		}

		return toPracticeQuestion({
			...question,
			ordering: reviewQuestion.ordering,
			reason_code: reviewQuestion.reason_code as ReviewSelectionReason,
			reason_label: reviewQuestion.reason_label
		});
	});
}
