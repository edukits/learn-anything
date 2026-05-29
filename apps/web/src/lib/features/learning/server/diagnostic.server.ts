import type { SupabaseClient } from '@supabase/supabase-js';
import type { PracticeQuizQuestion, QuizQuestionVersion, TopicContent } from '../types';
import { buildValidatedRpcAnswers } from './answer-validation.server';
import { getActiveReleaseQuestions } from './content.server';
import type { SubmittedAnswer } from './submissions.server';

export type DiagnosticOutcomeSummary = {
	attemptId: string;
	questionCount: number;
	correctCount: number;
	score: number;
	outcomes: {
		skill_id: string;
		skill_label: string;
		outcome: 'placed_out' | 'needs_practice' | 'unknown';
		confidence: number;
	}[];
};

export type DiagnosticAvailability = {
	canSubmit: boolean;
	reason: 'available' | 'completed_for_release' | 'no_questions';
};

type DiagnosticAttemptRow = {
	id: string;
	completed_at: string | null;
};

type DiagnosticAnswerRow = {
	question_id: string;
	question_version: number;
	skill_id: string;
	device: string;
	is_correct: boolean;
};

const DIAGNOSTIC_QUESTION_LIMIT = 5;

export async function getDiagnosticQuestions(
	client: SupabaseClient,
	content: TopicContent
): Promise<PracticeQuizQuestion[]> {
	return (await getDiagnosticQuestionVersions(client, content)).map(
		({
			correct_choice_id: _correctChoiceId,
			correct_choice_ids: _correctChoiceIds,
			correct_numeric_value: _correctNumericValue,
			correct_numeric_tolerance: _correctNumericTolerance,
			accepted_answers: _acceptedAnswers,
			math_template: _mathTemplate,
			math_match_mode: _mathMatchMode,
			accepted_math_answers: _acceptedMathAnswers,
			explanation: _explanation,
			...question
		}) => question
	);
}

export async function getLatestDiagnosticSummary(
	client: SupabaseClient,
	userId: string,
	content: TopicContent
): Promise<DiagnosticOutcomeSummary | null> {
	const { data: attempt, error } = await client
		.from('diagnostic_attempts')
		.select('id,completed_at')
		.eq('user_id', userId)
		.eq('topic_area_id', content.topic.topic_area_id)
		.eq('release_id', content.release.id)
		.eq('status', 'completed')
		.order('completed_at', { ascending: false })
		.limit(1)
		.maybeSingle();

	if (error) {
		throw new Error(error.message);
	}

	if (!attempt) return null;
	return summarizeDiagnosticAttempt(client, attempt as DiagnosticAttemptRow);
}

export async function submitDiagnostic(
	client: SupabaseClient,
	{
		userId,
		content,
		answers,
		submissionKey
	}: {
		userId: string;
		content: TopicContent;
		answers: SubmittedAnswer[];
		submissionKey: string;
	}
): Promise<DiagnosticOutcomeSummary> {
	if (!submissionKey) {
		throw new Error('Missing diagnostic submission key.');
	}

	const latestSummary = await getLatestDiagnosticSummary(client, userId, content);
	if (latestSummary) {
		throw new Error('Diagnostic already completed for this content release.');
	}

	const questions = await getDiagnosticQuestionVersions(client, content);
	const rpcAnswers = buildValidatedRpcAnswers(questions, answers, 'diagnostic', {
		includeQuestionMetadata: true
	});

	const { data, error } = await client.rpc('submit_diagnostic_attempt', {
		p_user_id: userId,
		p_topic_area_id: content.topic.topic_area_id,
		p_release_id: content.release.id,
		p_submission_key: submissionKey,
		p_answers: rpcAnswers
	});

	if (error) {
		throw new Error(error.message);
	}

	const [result] = data ?? [];
	if (!result?.attempt_id) {
		throw new Error('Diagnostic submission did not return an attempt.');
	}

	return summarizeDiagnosticAttempt(client, {
		id: result.attempt_id,
		completed_at: new Date().toISOString()
	});
}

async function getDiagnosticQuestionVersions(
	client: SupabaseClient,
	content: TopicContent
): Promise<QuizQuestionVersion[]> {
	const { data: diagnosticLinks, error: linksError } = await client
		.from('diagnostic_question_versions')
		.select('question_id,question_version,ordering')
		.eq('topic_area_id', content.topic.topic_area_id)
		.eq('release_id', content.release.id)
		.order('ordering')
		.limit(DIAGNOSTIC_QUESTION_LIMIT);

	if (linksError) {
		throw new Error(linksError.message);
	}

	if (!diagnosticLinks?.length) {
		return [];
	}

	const activeQuestions = await getActiveReleaseQuestions(client, content);
	const activeByKey = new Map(
		activeQuestions.map((question) => [`${question.question_id}@${question.version}`, question])
	);

	return diagnosticLinks.map((link) => {
		const question = activeByKey.get(`${link.question_id}@${link.question_version}`);
		if (!question) {
			throw new Error(
				`Diagnostic references inactive or missing question ${link.question_id}@${link.question_version}.`
			);
		}
		return Object.assign({}, question, { ordering: link.ordering });
	});
}

export async function getDiagnosticAvailability(
	client: SupabaseClient,
	userId: string,
	content: TopicContent
): Promise<DiagnosticAvailability> {
	const [latestSummary, questions] = await Promise.all([
		getLatestDiagnosticSummary(client, userId, content),
		getDiagnosticQuestionVersions(client, content)
	]);

	if (latestSummary) {
		return { canSubmit: false, reason: 'completed_for_release' };
	}

	if (!questions.length) {
		return { canSubmit: false, reason: 'no_questions' };
	}

	return { canSubmit: true, reason: 'available' };
}

async function summarizeDiagnosticAttempt(
	client: SupabaseClient,
	attempt: DiagnosticAttemptRow
): Promise<DiagnosticOutcomeSummary> {
	const { data: answers, error } = await client
		.from('diagnostic_attempt_answers')
		.select('question_id,question_version,skill_id,device,is_correct')
		.eq('diagnostic_attempt_id', attempt.id);

	if (error) {
		throw new Error(error.message);
	}

	const rows = (answers ?? []) as DiagnosticAnswerRow[];
	const correctCount = rows.filter((answer) => answer.is_correct).length;
	const questionCount = rows.length;
	const outcomes = await getStoredPlacementOutcomes(client, attempt.id, rows);

	return {
		attemptId: attempt.id,
		questionCount,
		correctCount,
		score: questionCount ? Math.round((correctCount / questionCount) * 100) : 0,
		outcomes
	};
}

async function getStoredPlacementOutcomes(
	client: SupabaseClient,
	attemptId: string,
	answers: DiagnosticAnswerRow[]
) {
	const { data, error } = await client
		.from('diagnostic_placement_outcomes')
		.select('skill_id,outcome,confidence')
		.eq('diagnostic_attempt_id', attemptId);

	if (error) {
		throw new Error(error.message);
	}

	const skillLabelById = new Map(answers.map((answer) => [answer.skill_id, answer.device]));
	if (data?.length) {
		return data.map((outcome) => ({
			skill_id: outcome.skill_id,
			skill_label: skillLabelById.get(outcome.skill_id) ?? outcome.skill_id,
			outcome: outcome.outcome as 'placed_out' | 'needs_practice' | 'unknown',
			confidence: Number(outcome.confidence)
		}));
	}

	return buildPlacementOutcomes(attemptId, answers).map(
		({ diagnostic_attempt_id: _attemptId, ...outcome }) => outcome
	);
}

function buildPlacementOutcomes(attemptId: string, answers: DiagnosticAnswerRow[]) {
	const bySkill = new Map<
		string,
		{ skill_id: string; skill_label: string; attempted: number; correct: number }
	>();

	for (const answer of answers) {
		const current = bySkill.get(answer.skill_id) ?? {
			skill_id: answer.skill_id,
			skill_label: answer.device,
			attempted: 0,
			correct: 0
		};
		current.attempted += 1;
		if (answer.is_correct) current.correct += 1;
		bySkill.set(answer.skill_id, current);
	}

	return [...bySkill.values()].map((skill) => {
		const accuracy = skill.attempted ? skill.correct / skill.attempted : 0;
		return {
			diagnostic_attempt_id: attemptId,
			skill_id: skill.skill_id,
			skill_label: skill.skill_label,
			outcome:
				skill.attempted === 0
					? ('unknown' as const)
					: accuracy >= 0.8
						? ('placed_out' as const)
						: ('needs_practice' as const),
			confidence: Math.min(1, Number((skill.attempted / 2).toFixed(2)))
		};
	});
}
