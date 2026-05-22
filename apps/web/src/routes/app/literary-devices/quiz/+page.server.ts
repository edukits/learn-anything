import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import {
	getLiteraryDevicesContent,
	getQuizQuestions,
	getUserProgress,
	LITERARY_DEVICES_TOPIC_ID
} from '$lib/server/content';

const submittedAnswerSchema = z.object({
	questionId: z.string().min(1),
	selectedChoiceId: z.string().min(1)
});

const submittedAnswersSchema = z.array(submittedAnswerSchema);

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { user } = await parent();
	const content = await getLiteraryDevicesContent(locals.supabase);
	const progress = await getUserProgress(locals.supabase, user.id, content.release.id);
	const questions = await getQuizQuestions(locals.supabase, content.quiz);

	return {
		...content,
		progress,
		questions,
		locked: !progress.intro_lesson_completed
	};
};

export const actions: Actions = {
	submit: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();

		if (!user) {
			redirect(303, '/sign-in');
		}

		const content = await getLiteraryDevicesContent(locals.supabase);
		const progress = await getUserProgress(locals.supabase, user.id, content.release.id);

		if (!progress.intro_lesson_completed) {
			return fail(403, { error: 'Complete the intro lesson before submitting the quiz.' });
		}

		const questions = await getQuizQuestions(locals.supabase, content.quiz);
		const formData = await request.formData();
		const answersRaw = String(formData.get('answers') ?? '[]');
		let answersJson: unknown;

		try {
			answersJson = JSON.parse(answersRaw);
		} catch {
			return fail(400, { error: 'Submitted answers were not valid JSON.' });
		}

		const parsed = submittedAnswersSchema.safeParse(answersJson);

		if (!parsed.success) {
			return fail(400, { error: 'Submitted answers were not valid.' });
		}

		const answersByQuestion = new Map(parsed.data.map((answer) => [answer.questionId, answer.selectedChoiceId]));

		if (answersByQuestion.size !== questions.length) {
			return fail(400, { error: 'Answer every question before submitting the quiz.' });
		}

		const gradedAnswers = questions.map((question) => {
			const selectedChoiceId = answersByQuestion.get(question.question_id);
			const validChoiceIds = new Set(question.choices.map((choice) => choice.id));

			if (!selectedChoiceId || !validChoiceIds.has(selectedChoiceId)) {
				throw new Error(`Invalid answer for ${question.question_id}.`);
			}

			return {
				question,
				selectedChoiceId,
				isCorrect: selectedChoiceId === question.correct_choice_id
			};
		});

		const correctCount = gradedAnswers.filter((answer) => answer.isCorrect).length;
		const score = Math.round((correctCount / questions.length) * 10000) / 100;

		const { data: attempt, error: attemptError } = await locals.supabaseService
			.from('quiz_attempts')
			.insert({
				user_id: user.id,
				quiz_id: content.quiz.quiz_id,
				quiz_version: content.quiz.version,
				release_id: content.release.id,
				score,
				correct_count: correctCount,
				question_count: questions.length
			})
			.select('id')
			.single();

		if (attemptError) {
			return fail(500, { error: attemptError.message });
		}

		const { error: answersError } = await locals.supabaseService.from('quiz_attempt_answers').insert(
			gradedAnswers.map(({ question, selectedChoiceId, isCorrect }) => ({
				attempt_id: attempt.id,
				user_id: user.id,
				question_id: question.question_id,
				question_version: question.version,
				skill_id: question.skill_id,
				device: question.device,
				selected_choice_id: selectedChoiceId,
				correct_choice_id: question.correct_choice_id,
				is_correct: isCorrect
			}))
		);

		if (answersError) {
			return fail(500, { error: answersError.message });
		}

		const current = await getUserProgress(locals.supabaseService, user.id, content.release.id);
		const bestScore = Math.max(current.best_score ?? 0, score);
		const { error: progressError } = await locals.supabaseService.from('user_progress').upsert(
			{
				user_id: user.id,
				topic_area_id: LITERARY_DEVICES_TOPIC_ID,
				release_id: content.release.id,
				intro_lesson_completed: true,
				quiz_completed: true,
				latest_attempt_id: attempt.id,
				latest_score: score,
				best_score: bestScore,
				total_attempts: current.total_attempts + 1
			},
			{ onConflict: 'user_id,topic_area_id,release_id' }
		);

		if (progressError) {
			return fail(500, { error: progressError.message });
		}

		redirect(303, `/app/literary-devices/quiz/results?attempt=${attempt.id}`);
	}
};
