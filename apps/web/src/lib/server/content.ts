import type { SupabaseClient } from '@supabase/supabase-js';

export const LITERARY_DEVICES_TOPIC_ID = 'topic_literary_devices';
export const INTRO_LESSON_ID = 'lesson_lit_devices_intro';
export const MIXED_QUIZ_ID = 'quiz_lit_devices_mixed_practice';

export type Choice = {
	id: string;
	label: string;
};

export type SkillVersion = {
	skill_id: string;
	version: number;
	name: string;
	device: string;
	summary: string;
};

export type LessonVersion = {
	lesson_id: string;
	version: number;
	title: string;
	summary: string;
	body_markdown: string;
	skill_ids: string[];
	estimated_minutes: number;
};

export type QuizVersion = {
	quiz_id: string;
	version: number;
	title: string;
	description: string;
	question_count: number;
};

export type QuizQuestionVersion = {
	question_id: string;
	version: number;
	skill_id: string;
	device: string;
	question_type: 'recognition' | 'application';
	difficulty: 'easy' | 'medium' | 'hard';
	prompt: string;
	choices: Choice[];
	correct_choice_id: string;
	explanation: string;
	ordering: number;
};

export type ContentRelease = {
	id: string;
	title: string;
	published_at: string;
	scope_id: string;
};

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
};

export type DeviceStat = {
	device: string;
	attempted: number;
	correct: number;
};

type ReleaseItem = {
	content_type: string;
	content_id: string;
	content_version: number;
};

function requireSingle<T>(value: T | null, label: string): T {
	if (!value) {
		throw new Error(`Missing ${label}. Import and publish the Literary Devices v1 content first.`);
	}

	return value;
}

function asNumber(value: unknown): number | null {
	if (value === null || value === undefined) {
		return null;
	}

	return Number(value);
}

export async function getLatestLiteraryDevicesRelease(client: SupabaseClient): Promise<ContentRelease> {
	const { data, error } = await client
		.from('content_releases')
		.select('id,title,published_at,scope_id')
		.eq('status', 'published')
		.eq('scope_type', 'topic_area')
		.eq('scope_id', LITERARY_DEVICES_TOPIC_ID)
		.order('published_at', { ascending: false })
		.limit(1)
		.maybeSingle();

	if (error) {
		throw new Error(error.message);
	}

	return requireSingle(data, 'published Literary Devices release') as ContentRelease;
}

export async function getReleaseItems(client: SupabaseClient, releaseId: string): Promise<ReleaseItem[]> {
	const { data, error } = await client
		.from('content_release_items')
		.select('content_type,content_id,content_version')
		.eq('release_id', releaseId);

	if (error) {
		throw new Error(error.message);
	}

	return data ?? [];
}

function getVersion(items: ReleaseItem[], contentType: string, contentId: string) {
	const item = items.find((candidate) => candidate.content_type === contentType && candidate.content_id === contentId);

	if (!item) {
		throw new Error(`Release is missing ${contentType} ${contentId}.`);
	}

	return item.content_version;
}

export async function getLiteraryDevicesContent(client: SupabaseClient) {
	const release = await getLatestLiteraryDevicesRelease(client);
	const releaseItems = await getReleaseItems(client, release.id);
	const lessonVersion = getVersion(releaseItems, 'lesson', INTRO_LESSON_ID);
	const quizVersion = getVersion(releaseItems, 'quiz', MIXED_QUIZ_ID);
	const skillIds = releaseItems.filter((item) => item.content_type === 'skill').map((item) => item.content_id);

	const [{ data: lesson, error: lessonError }, { data: quiz, error: quizError }, { data: skills, error: skillsError }] =
		await Promise.all([
			client
				.from('lesson_versions')
				.select('lesson_id,version,title,summary,body_markdown,skill_ids,estimated_minutes')
				.eq('lesson_id', INTRO_LESSON_ID)
				.eq('version', lessonVersion)
				.maybeSingle(),
			client
				.from('quiz_versions')
				.select('quiz_id,version,title,description,question_count')
				.eq('quiz_id', MIXED_QUIZ_ID)
				.eq('version', quizVersion)
				.maybeSingle(),
			client
				.from('skill_versions')
				.select('skill_id,version,name,device,summary')
				.in('skill_id', skillIds)
				.eq('version', 1)
				.order('name')
		]);

	if (lessonError) throw new Error(lessonError.message);
	if (quizError) throw new Error(quizError.message);
	if (skillsError) throw new Error(skillsError.message);

	return {
		release,
		releaseItems,
		lesson: requireSingle(lesson, 'intro lesson') as LessonVersion,
		quiz: requireSingle(quiz, 'mixed quiz') as QuizVersion,
		skills: (skills ?? []) as SkillVersion[]
	};
}

export async function getQuizQuestions(client: SupabaseClient, quiz: QuizVersion): Promise<QuizQuestionVersion[]> {
	const { data: links, error: linksError } = await client
		.from('quiz_question_to_quiz')
		.select('question_id,question_version,ordering')
		.eq('quiz_id', quiz.quiz_id)
		.eq('quiz_version', quiz.version)
		.order('ordering');

	if (linksError) {
		throw new Error(linksError.message);
	}

	if (!links?.length) {
		return [];
	}

	const { data: questions, error: questionError } = await client
		.from('quiz_question_versions')
		.select('question_id,version,skill_id,device,question_type,difficulty,prompt,choices,correct_choice_id,explanation')
		.in(
			'question_id',
			links.map((link) => link.question_id)
		);

	if (questionError) {
		throw new Error(questionError.message);
	}

	const questionByKey = new Map(
		(questions ?? []).map((question) => [`${question.question_id}@${question.version}`, question as Omit<QuizQuestionVersion, 'ordering'>])
	);

	return links.map((link) => {
		const question = questionByKey.get(`${link.question_id}@${link.question_version}`);
		if (!question) {
			throw new Error(`Quiz references missing question ${link.question_id}@${link.question_version}.`);
		}

		return {
			question_id: question.question_id,
			version: question.version,
			skill_id: question.skill_id,
			device: question.device,
			question_type: question.question_type,
			difficulty: question.difficulty,
			prompt: question.prompt,
			choices: question.choices,
			correct_choice_id: question.correct_choice_id,
			explanation: question.explanation,
			ordering: link.ordering
		};
	});
}

export async function getUserProgress(
	client: SupabaseClient,
	userId: string,
	releaseId: string
): Promise<UserProgress> {
	const { data, error } = await client
		.from('user_progress')
		.select('intro_lesson_completed,quiz_completed,latest_attempt_id,latest_score,best_score,total_attempts')
		.eq('user_id', userId)
		.eq('topic_area_id', LITERARY_DEVICES_TOPIC_ID)
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

export async function getAttempts(client: SupabaseClient, userId: string, releaseId: string): Promise<AttemptSummary[]> {
	const { data, error } = await client
		.from('quiz_attempts')
		.select('id,score,correct_count,question_count,completed_at')
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
		completed_at: attempt.completed_at
	}));
}

export async function getDeviceStats(client: SupabaseClient, attemptIds: string[]): Promise<DeviceStat[]> {
	if (!attemptIds.length) {
		return [];
	}

	const { data, error } = await client
		.from('quiz_attempt_answers')
		.select('device,is_correct')
		.in('attempt_id', attemptIds);

	if (error) {
		throw new Error(error.message);
	}

	const stats = new Map<string, DeviceStat>();
	for (const answer of data ?? []) {
		const current = stats.get(answer.device) ?? {
			device: answer.device,
			attempted: 0,
			correct: 0
		};
		current.attempted += 1;
		if (answer.is_correct) {
			current.correct += 1;
		}
		stats.set(answer.device, current);
	}

	return [...stats.values()].toSorted((a, b) => a.device.localeCompare(b.device));
}

export async function getAttemptDeviceStats(client: SupabaseClient, attemptId: string): Promise<DeviceStat[]> {
	const { data, error } = await client
		.from('quiz_attempt_answers')
		.select('device,is_correct')
		.eq('attempt_id', attemptId);

	if (error) {
		throw new Error(error.message);
	}

	const stats = new Map<string, DeviceStat>();
	for (const answer of data ?? []) {
		const current = stats.get(answer.device) ?? {
			device: answer.device,
			attempted: 0,
			correct: 0
		};
		current.attempted += 1;
		if (answer.is_correct) {
			current.correct += 1;
		}
		stats.set(answer.device, current);
	}

	return [...stats.values()].toSorted((a, b) => a.device.localeCompare(b.device));
}
