import type { SupabaseClient } from '@supabase/supabase-js';
import type {
	ContentRelease,
	LessonVersion,
	PracticeQuizQuestion,
	QuizQuestionVersion,
	QuizVersion
} from '../types';
import { AnswerValidationError, buildValidatedRpcAnswers } from './answer-validation.server';
import type { RpcAnswer } from './answer-validation.server';
import type { SubmittedAnswer } from './submissions.server';

type CompleteLessonResult = {
	activity_event_id: string;
	xp_awarded: number;
};

type SubmitQuizParams = {
	userId: string;
	topicId: string;
	release: ContentRelease;
	quiz: QuizVersion;
	questions: AnswerableQuestion[];
	answers: SubmittedAnswer[];
	submissionKey: string;
};

type SubmitQuizResult = {
	attemptId: string;
	xpAwarded: number;
};

type CompleteReviewSessionParams = {
	userId: string;
	topicId: string;
	release: ContentRelease;
	reviewSessionId: string;
	questions: AnswerableQuestion[];
	answers: SubmittedAnswer[];
	submissionKey: string;
};

type AnswerableQuestion = PracticeQuizQuestion | QuizQuestionVersion;

export class LearnerMutationError extends Error {
	constructor(
		message: string,
		readonly status = 400
	) {
		super(message);
		this.name = 'LearnerMutationError';
	}
}

export async function completeLesson(
	client: SupabaseClient,
	userId: string,
	topicId: string,
	release: ContentRelease,
	lesson: LessonVersion
): Promise<CompleteLessonResult> {
	const { data, error } = await client.rpc('complete_lesson', {
		p_user_id: userId,
		p_topic_area_id: topicId,
		p_release_id: release.id,
		p_lesson_id: lesson.lesson_id,
		p_lesson_version: lesson.version
	});

	if (error) {
		throw new Error(error.message);
	}

	const [result] = data ?? [];
	if (!result?.activity_event_id) {
		throw new LearnerMutationError('Lesson completion did not return an activity event.', 500);
	}

	return {
		activity_event_id: result.activity_event_id,
		xp_awarded: result?.xp_awarded ?? 0
	};
}

export async function submitQuiz(
	client: SupabaseClient,
	{ userId, topicId, release, quiz, questions, answers, submissionKey }: SubmitQuizParams
): Promise<SubmitQuizResult> {
	if (!submissionKey) {
		throw new LearnerMutationError('Missing quiz submission key.');
	}

	let rpcAnswers: RpcAnswer[];
	try {
		rpcAnswers = buildValidatedRpcAnswers(questions, answers, 'quiz');
	} catch (error) {
		if (error instanceof AnswerValidationError) {
			throw new LearnerMutationError(error.message);
		}
		throw error;
	}

	const { data, error } = await client.rpc('submit_quiz_with_outcomes', {
		p_user_id: userId,
		p_topic_area_id: topicId,
		p_release_id: release.id,
		p_quiz_id: quiz.quiz_id,
		p_quiz_version: quiz.version,
		p_answers: rpcAnswers,
		p_submission_key: submissionKey
	});

	if (error) {
		throw new LearnerMutationError(error.message, 500);
	}

	const [result] = data ?? [];
	if (!result?.attempt_id) {
		throw new LearnerMutationError('Quiz submission did not return an attempt.', 500);
	}

	return {
		attemptId: result.attempt_id,
		xpAwarded: result.xp_awarded ?? 0
	};
}

export async function completeReviewSession(
	client: SupabaseClient,
	{
		userId,
		topicId,
		release,
		reviewSessionId,
		questions,
		answers,
		submissionKey
	}: CompleteReviewSessionParams
): Promise<SubmitQuizResult> {
	if (!submissionKey) {
		throw new LearnerMutationError('Missing review submission key.');
	}

	let rpcAnswers: RpcAnswer[];
	try {
		rpcAnswers = buildValidatedRpcAnswers(questions, answers, 'review');
	} catch (error) {
		if (error instanceof AnswerValidationError) {
			throw new LearnerMutationError(error.message);
		}
		throw error;
	}

	const { data, error } = await client.rpc('complete_review_session_with_outcomes', {
		p_user_id: userId,
		p_topic_area_id: topicId,
		p_release_id: release.id,
		p_review_session_id: reviewSessionId,
		p_answers: rpcAnswers,
		p_submission_key: submissionKey
	});

	if (error) {
		throw new LearnerMutationError(error.message, 500);
	}

	const [result] = data ?? [];
	if (!result?.attempt_id) {
		throw new LearnerMutationError('Review submission did not return an attempt.', 500);
	}

	return {
		attemptId: result.attempt_id,
		xpAwarded: result.xp_awarded ?? 0
	};
}
