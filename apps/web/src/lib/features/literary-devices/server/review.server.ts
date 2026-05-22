import type { SupabaseClient } from '@supabase/supabase-js';
import { LITERARY_DEVICES_TOPIC_ID, getActiveReleaseQuestions } from './content.server';
import type { LiteraryDevicesContent } from './content.server';
import type {
	PracticeQuizQuestion,
	QuizQuestionVersion,
	ReviewPracticeQuestion,
	ReviewSelectionReason,
	ReviewSummary
} from '../types';

export const REVIEW_ATTEMPT_KIND = 'review' as const;
const REVIEW_POLICY = {
	questionLimit: 8,
	lowSkillAccuracyThreshold: 0.7,
	lowSkillMinimumAttempts: 2,
	reasonLabels: {
		missed_question: 'Review missed questions',
		low_skill_accuracy: (device: string) => `Practice ${device}`,
		not_seen_recently: 'Refresh less recent questions'
	}
};

type AttemptAnswerHistory = {
	question_id: string;
	question_version: number;
	skill_id: string;
	device: string;
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

export type ReviewState = {
	reviewSession: { session: ReviewSessionRow; questions: ReviewPracticeQuestion[] } | null;
	reviewSummary: ReviewSummary;
};

function questionKey(question: Pick<QuizQuestionVersion, 'question_id' | 'version'>) {
	return `${question.question_id}@${question.version}`;
}

function toPracticeQuestion(question: ReviewSelection): ReviewPracticeQuestion {
	const {
		correct_choice_id: _correctChoiceId,
		explanation: _explanation,
		reason_code,
		reason_label,
		...practiceQuestion
	} = question;

	return {
		...(practiceQuestion as PracticeQuizQuestion),
		reason_code,
		reason_label
	};
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
		.in('attempt_id', attempts.map((attempt) => attempt.id));

	if (answersError) throw new Error(answersError.message);
	return (answers ?? []) as AttemptAnswerHistory[];
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
	content: LiteraryDevicesContent
): Promise<ReviewSelection[]> {
	const [activeQuestions, history] = await Promise.all([
		getActiveReleaseQuestions(client, content),
		getAttemptAnswerHistory(client, userId, content.release.id)
	]);

	if (!history.length) return [];

	const questionsByKey = new Map(activeQuestions.map((question) => [questionKey(question), question]));
	const latestByQuestion = latestAnswerByQuestion(history);
	const selections: ReviewSelection[] = [];
	const selectedKeys = new Set<string>();

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

	const skillStats = new Map<string, { skill_id: string; device: string; attempted: number; correct: number }>();
	for (const answer of history) {
		const current = skillStats.get(answer.skill_id) ?? {
			skill_id: answer.skill_id,
			device: answer.device,
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
		addSelection(selections, selectedKeys, question, 'low_skill_accuracy', REVIEW_POLICY.reasonLabels.low_skill_accuracy(stat.device));
	}

	for (const question of activeQuestions.toSorted((a, b) => {
		const aSeen = latestByQuestion.get(questionKey(a))?.answered_at ?? '';
		const bSeen = latestByQuestion.get(questionKey(b))?.answered_at ?? '';
		return aSeen.localeCompare(bSeen);
	})) {
		addSelection(selections, selectedKeys, question, 'not_seen_recently', REVIEW_POLICY.reasonLabels.not_seen_recently);
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
	content: LiteraryDevicesContent
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
	content: LiteraryDevicesContent
): Promise<ReviewSummary> {
	return (await getReviewState(client, userId, content)).reviewSummary;
}

export async function createReviewSession(
	client: SupabaseClient,
	userId: string,
	content: LiteraryDevicesContent
): Promise<string> {
	const selection = await buildReviewSelection(client, userId, content);
	if (!selection.length) {
		throw new Error('Complete a quiz before starting adaptive review.');
	}

	const { data, error } = await client.rpc('create_review_session', {
		p_user_id: userId,
		p_topic_area_id: LITERARY_DEVICES_TOPIC_ID,
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
	content: LiteraryDevicesContent
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
	content: LiteraryDevicesContent,
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

async function getReviewSessionQuestions(client: SupabaseClient, reviewSessionId: string): Promise<ReviewPracticeQuestion[]> {
	const { data: reviewQuestions, error: reviewQuestionsError } = await client
		.from('review_session_questions')
		.select('question_id,question_version,reason_code,reason_label,ordering')
		.eq('review_session_id', reviewSessionId)
		.order('ordering');

	if (reviewQuestionsError) throw new Error(reviewQuestionsError.message);
	if (!reviewQuestions?.length) return [];

	const { data: questions, error: questionsError } = await client
		.from('quiz_question_versions')
		.select('question_id,version,skill_id,device,question_type,difficulty,prompt,choices,correct_choice_id,explanation')
		.in('question_id', reviewQuestions.map((question) => question.question_id));

	if (questionsError) throw new Error(questionsError.message);

	const questionsByKey = new Map(
		((questions ?? []) as Omit<QuizQuestionVersion, 'ordering'>[]).map((question) => [
			`${question.question_id}@${question.version}`,
			question
		])
	);

	return reviewQuestions.map((reviewQuestion) => {
		const question = questionsByKey.get(`${reviewQuestion.question_id}@${reviewQuestion.question_version}`);
		if (!question) {
			throw new Error(`Review session references missing question ${reviewQuestion.question_id}@${reviewQuestion.question_version}.`);
		}

		return toPracticeQuestion({
			...question,
			ordering: reviewQuestion.ordering,
			reason_code: reviewQuestion.reason_code as ReviewSelectionReason,
			reason_label: reviewQuestion.reason_label
		});
	});
}
