import type { SupabaseClient } from '@supabase/supabase-js';
import {
	findPublicTopicDiscoveryBySlug,
	findPublicTopicDiscoveryByTopicId
} from '$lib/features/catalog/server/index.server';
import { groupPathModules } from '$lib/features/learning/modules';
import type {
	ContentRelease,
	LearningPathItem,
	LearningPathVersion,
	LessonVersion,
	PracticeQuizQuestion,
	QuizQuestionVersion,
	QuizVersion,
	ReleaseItem,
	SkillVersion,
	TopicContent,
	TopicModuleVersion
} from '../types';

function requireSingle<T>(value: T | null | undefined, label: string): T {
	if (!value) {
		throw new Error(`Missing ${label}. Import and publish the topic content first.`);
	}

	return value;
}

export async function getLatestTopicRelease(
	client: SupabaseClient,
	topicId: string
): Promise<ContentRelease> {
	const { data, error } = await client
		.from('content_releases')
		.select('id,title,published_at,scope_id')
		.eq('status', 'published')
		.eq('scope_type', 'topic_area')
		.eq('scope_id', topicId)
		.order('published_at', { ascending: false })
		.limit(1)
		.maybeSingle();

	if (error) {
		throw new Error(error.message);
	}

	return requireSingle(data, 'published topic release') as ContentRelease;
}

export async function getReleaseItems(
	client: SupabaseClient,
	releaseId: string
): Promise<ReleaseItem[]> {
	const { data, error } = await client
		.from('content_release_items')
		.select('content_type,content_id,content_version')
		.eq('release_id', releaseId);

	if (error) {
		throw new Error(error.message);
	}

	return data ?? [];
}

function getItemsByType(items: ReleaseItem[], contentType: string) {
	return items.filter((item) => item.content_type === contentType);
}

function versionKey(contentId: string, version: number) {
	return `${contentId}@${version}`;
}

function filterReleaseVersions<T extends { version: number }>(
	rows: T[] | null,
	items: ReleaseItem[],
	idForRow: (row: T) => string
) {
	const releaseKeys = new Set(
		items.map((item) => versionKey(item.content_id, item.content_version))
	);
	return (rows ?? []).filter((row) => releaseKeys.has(versionKey(idForRow(row), row.version)));
}

export async function getTopicContentBySlug(
	client: SupabaseClient,
	topicSlug: string
): Promise<TopicContent | null> {
	const topic = await findPublicTopicDiscoveryBySlug(client, topicSlug);
	if (!topic) return null;

	return getTopicContent(client, topic.topic_area_id);
}

export async function getTopicContent(
	client: SupabaseClient,
	topicId: string
): Promise<TopicContent> {
	const [release, topic] = await Promise.all([
		getLatestTopicRelease(client, topicId),
		findPublicTopicDiscoveryByTopicId(client, topicId)
	]);
	const releaseItems = await getReleaseItems(client, release.id);
	const skillItems = getItemsByType(releaseItems, 'skill');
	const skillIds = skillItems.map((item) => item.content_id);
	const path = await getTopicPath(client, releaseItems);
	const modules = await getTopicModules(
		client,
		releaseItems,
		path.path,
		requireSingle(topic, 'public topic metadata').topic_area_id
	);

	const { data: skills, error: skillsError } = await client
		.from('skill_versions')
		.select('skill_id,version,name,summary')
		.in('skill_id', skillIds)
		.order('name');

	if (skillsError) throw new Error(skillsError.message);

	return {
		release,
		releaseItems,
		path: path.path,
		pathItems: path.pathItems,
		modules,
		pathModules: groupPathModules(modules, path.pathItems),
		skills: filterReleaseVersions(
			skills as SkillVersion[] | null,
			skillItems,
			(skill) => skill.skill_id
		),
		topic: requireSingle(topic, 'public topic metadata')
	};
}

async function getTopicModules(
	client: SupabaseClient,
	releaseItems: ReleaseItem[],
	path: LearningPathVersion,
	topicAreaId: string
): Promise<TopicModuleVersion[]> {
	const defaultModule = {
		topic_module_id: `default:${path.learning_path_id}`,
		version: path.version,
		topic_area_id: topicAreaId,
		slug: 'default',
		title: path.title,
		description: path.summary,
		content_responsibility: path.summary,
		ordering: 1
	} satisfies TopicModuleVersion;
	const moduleItems = getItemsByType(releaseItems, 'topic_module');
	if (!moduleItems.length) {
		return [defaultModule];
	}

	const { data, error } = await client
		.from('topic_module_versions')
		.select(
			'topic_module_id,version,topic_area_id,slug,title,description,content_responsibility,ordering'
		)
		.in(
			'topic_module_id',
			moduleItems.map((item) => item.content_id)
		)
		.order('ordering');

	if (error) throw new Error(error.message);

	const releasedModules = filterReleaseVersions(
		(data ?? []) as TopicModuleVersion[],
		moduleItems,
		(module) => module.topic_module_id
	).toSorted((a, b) => a.ordering - b.ordering);
	return releasedModules.length ? releasedModules : [defaultModule];
}

async function getTopicPath(client: SupabaseClient, releaseItems: ReleaseItem[]) {
	const pathItem = getItemsByType(releaseItems, 'learning_path')[0];
	if (!pathItem) {
		throw new Error('Release is missing a learning path.');
	}

	const [{ data: path, error: pathError }, { data: rawItems, error: itemsError }] =
		await Promise.all([
			client
				.from('learning_path_versions')
				.select('learning_path_id,version,title,summary')
				.eq('learning_path_id', pathItem.content_id)
				.eq('version', pathItem.content_version)
				.maybeSingle(),
			client
				.from('learning_path_items')
				.select('item_type,item_id,item_version,module_id,module_version,ordering,required')
				.eq('learning_path_id', pathItem.content_id)
				.eq('learning_path_version', pathItem.content_version)
				.order('ordering')
		]);

	if (pathError) throw new Error(pathError.message);
	if (itemsError) throw new Error(itemsError.message);

	const items = rawItems ?? [];
	const unsupportedItem = items.find(
		(item) => item.item_type !== 'lesson' && item.item_type !== 'quiz'
	);
	if (unsupportedItem) {
		throw new Error(`Unsupported learning path item type: ${unsupportedItem.item_type}.`);
	}

	const lessonItems = items.filter((item) => item.item_type === 'lesson');
	const quizItems = items.filter((item) => item.item_type === 'quiz');
	const [{ data: lessons, error: lessonsError }, { data: quizzes, error: quizzesError }] =
		await Promise.all([
			lessonItems.length
				? client
						.from('lesson_versions')
						.select('lesson_id,version,title,summary,estimated_minutes')
						.in(
							'lesson_id',
							lessonItems.map((item) => item.item_id)
						)
				: Promise.resolve({ data: [], error: null }),
			quizItems.length
				? client
						.from('quiz_versions')
						.select('quiz_id,version,title,description,question_count')
						.in(
							'quiz_id',
							quizItems.map((item) => item.item_id)
						)
				: Promise.resolve({ data: [], error: null })
		]);

	if (lessonsError) throw new Error(lessonsError.message);
	if (quizzesError) throw new Error(quizzesError.message);

	const lessonByKey = new Map(
		(
			(lessons ?? []) as Pick<
				LessonVersion,
				'lesson_id' | 'version' | 'title' | 'summary' | 'estimated_minutes'
			>[]
		).map((lesson) => [versionKey(lesson.lesson_id, lesson.version), lesson])
	);
	const quizByKey = new Map(
		((quizzes ?? []) as QuizVersion[]).map((quiz) => [versionKey(quiz.quiz_id, quiz.version), quiz])
	);

	return {
		path: requireSingle(path, 'topic learning path') as LearningPathVersion,
		pathItems: items.map((item) => {
			if (item.item_type === 'lesson') {
				const lesson = lessonByKey.get(versionKey(item.item_id, item.item_version));
				if (!lesson)
					throw new Error(`Missing lesson path item ${item.item_id}@${item.item_version}.`);
				return {
					id: `${item.item_type}:${item.item_id}@${item.item_version}`,
					item_type: 'lesson',
					item_id: item.item_id,
					item_version: item.item_version,
					module_id: item.module_id ?? null,
					module_version: item.module_version ?? null,
					ordering: item.ordering,
					required: item.required,
					title: lesson.title,
					summary: lesson.summary,
					estimated_minutes: lesson.estimated_minutes
				} satisfies LearningPathItem;
			}

			const quiz = quizByKey.get(versionKey(item.item_id, item.item_version));
			if (!quiz) throw new Error(`Missing quiz path item ${item.item_id}@${item.item_version}.`);
			return {
				id: `${item.item_type}:${item.item_id}@${item.item_version}`,
				item_type: 'quiz',
				item_id: item.item_id,
				item_version: item.item_version,
				module_id: item.module_id ?? null,
				module_version: item.module_version ?? null,
				ordering: item.ordering,
				required: item.required,
				title: quiz.title,
				description: quiz.description,
				question_count: quiz.question_count
			} satisfies LearningPathItem;
		})
	};
}

export async function getLesson(client: SupabaseClient, content: TopicContent, lessonId: string) {
	const lessonItem = content.pathItems.find(
		(item) => item.item_type === 'lesson' && item.item_id === lessonId
	);
	if (!lessonItem) {
		throw new Error(`Lesson ${lessonId} is not in the latest topic path.`);
	}

	const { data, error } = await client
		.from('lesson_versions')
		.select('lesson_id,version,title,summary,body_markdown,skill_ids,estimated_minutes')
		.eq('lesson_id', lessonId)
		.eq('version', lessonItem.item_version)
		.maybeSingle();

	if (error) throw new Error(error.message);

	return requireSingle(data, `lesson ${lessonId}`) as LessonVersion;
}

export async function getQuiz(client: SupabaseClient, content: TopicContent, quizId: string) {
	const quizItem = content.pathItems.find(
		(item) => item.item_type === 'quiz' && item.item_id === quizId
	);
	if (!quizItem) {
		throw new Error(`Quiz ${quizId} is not in the latest topic path.`);
	}

	const { data, error } = await client
		.from('quiz_versions')
		.select('quiz_id,version,title,description,question_count')
		.eq('quiz_id', quizId)
		.eq('version', quizItem.item_version)
		.maybeSingle();

	if (error) throw new Error(error.message);

	return requireSingle(data, `quiz ${quizId}`) as QuizVersion;
}

async function getQuizQuestionLinks(client: SupabaseClient, quiz: QuizVersion) {
	const { data: links, error: linksError } = await client
		.from('quiz_question_to_quiz')
		.select('question_id,question_version,ordering')
		.eq('quiz_id', quiz.quiz_id)
		.eq('quiz_version', quiz.version)
		.order('ordering');

	if (linksError) {
		throw new Error(linksError.message);
	}

	return links ?? [];
}

async function getQuizQuestionsByLifecycle(
	client: SupabaseClient,
	quiz: QuizVersion,
	lifecycleStatus?: 'active'
): Promise<QuizQuestionVersion[]> {
	const links = await getQuizQuestionLinks(client, quiz);

	if (!links?.length) {
		return [];
	}

	let query = client
		.from('quiz_question_versions')
		.select(
			'question_id,version,skill_id,device,question_purpose,response_type,difficulty,prompt,choices,correct_choice_id,correct_choice_ids,correct_numeric_value,correct_numeric_tolerance,sequence_items,accepted_answers,explanation'
		)
		.in(
			'question_id',
			links.map((link) => link.question_id)
		);

	if (lifecycleStatus) {
		query = query.eq('lifecycle_status', lifecycleStatus);
	}

	const { data: questions, error: questionError } = await query;

	if (questionError) {
		throw new Error(questionError.message);
	}

	const releaseQuestionItems = links.map((link) => ({
		content_type: 'quiz_question',
		content_id: link.question_id,
		content_version: link.question_version
	}));
	const releaseQuestions = filterReleaseVersions(
		(questions ?? []).map((question) => ({
			question_id: question.question_id,
			version: question.version,
			skill_id: question.skill_id,
			skill_label: question.device,
			question_purpose: question.question_purpose,
			response_type: question.response_type,
			difficulty: question.difficulty,
			prompt: question.prompt,
			choices: question.choices,
			correct_choice_id: question.correct_choice_id,
			correct_choice_ids: question.correct_choice_ids ?? [],
			correct_numeric_value: question.correct_numeric_value,
			correct_numeric_tolerance: question.correct_numeric_tolerance ?? 0,
			sequence_items: question.sequence_items ?? [],
			accepted_answers: question.accepted_answers ?? [],
			explanation: question.explanation
		})) as Omit<QuizQuestionVersion, 'ordering'>[] | null,
		releaseQuestionItems,
		(question) => question.question_id
	);
	const questionByKey = new Map(
		releaseQuestions.map((question) => [
			versionKey(question.question_id, question.version),
			question
		])
	);

	return links.map((link) => {
		const question = questionByKey.get(`${link.question_id}@${link.question_version}`);
		if (!question) {
			throw new Error(
				`Quiz references missing question ${link.question_id}@${link.question_version}.`
			);
		}

		return {
			question_id: question.question_id,
			version: question.version,
			skill_id: question.skill_id,
			skill_label: question.skill_label,
			question_purpose: question.question_purpose,
			response_type: question.response_type,
			difficulty: question.difficulty,
			prompt: question.prompt,
			choices: question.choices,
			correct_choice_id: question.correct_choice_id,
			correct_choice_ids: question.correct_choice_ids,
			correct_numeric_value: question.correct_numeric_value,
			correct_numeric_tolerance: question.correct_numeric_tolerance,
			sequence_items: question.sequence_items,
			accepted_answers: question.accepted_answers,
			explanation: question.explanation,
			ordering: link.ordering
		};
	});
}

export function getQuizQuestions(
	client: SupabaseClient,
	quiz: QuizVersion
): Promise<QuizQuestionVersion[]> {
	return getQuizQuestionsByLifecycle(client, quiz);
}

export function getActiveQuizQuestions(
	client: SupabaseClient,
	quiz: QuizVersion
): Promise<QuizQuestionVersion[]> {
	return getQuizQuestionsByLifecycle(client, quiz, 'active');
}

export async function getActiveReleaseQuestions(
	client: SupabaseClient,
	content: TopicContent
): Promise<QuizQuestionVersion[]> {
	const questionItems = getItemsByType(content.releaseItems, 'quiz_question');
	if (!questionItems.length) {
		return [];
	}

	const { data, error } = await client
		.from('quiz_question_versions')
		.select(
			'question_id,version,skill_id,device,question_purpose,response_type,difficulty,prompt,choices,correct_choice_id,correct_choice_ids,correct_numeric_value,correct_numeric_tolerance,sequence_items,accepted_answers,explanation'
		)
		.in(
			'question_id',
			questionItems.map((item) => item.content_id)
		)
		.eq('lifecycle_status', 'active');

	if (error) throw new Error(error.message);

	return filterReleaseVersions(
		(data ?? []).map((question) => ({
			question_id: question.question_id,
			version: question.version,
			skill_id: question.skill_id,
			skill_label: question.device,
			question_purpose: question.question_purpose,
			response_type: question.response_type,
			difficulty: question.difficulty,
			prompt: question.prompt,
			choices: question.choices,
			correct_choice_id: question.correct_choice_id,
			correct_choice_ids: question.correct_choice_ids ?? [],
			correct_numeric_value: question.correct_numeric_value,
			correct_numeric_tolerance: question.correct_numeric_tolerance ?? 0,
			sequence_items: question.sequence_items ?? [],
			accepted_answers: question.accepted_answers ?? [],
			explanation: question.explanation
		})) as Omit<QuizQuestionVersion, 'ordering'>[] | null,
		questionItems,
		(question) => question.question_id
	)
		.map((question, index) => Object.assign(question, { ordering: index + 1 }))
		.toSorted((a, b) => a.question_id.localeCompare(b.question_id));
}

export async function getPracticeQuizQuestions(
	client: SupabaseClient,
	quiz: QuizVersion
): Promise<PracticeQuizQuestion[]> {
	return (await getActiveQuizQuestions(client, quiz)).map(
		({
			correct_choice_id: _correctChoiceId,
			correct_choice_ids: _correctChoiceIds,
			correct_numeric_value: _correctNumericValue,
			correct_numeric_tolerance: _correctNumericTolerance,
			accepted_answers: _acceptedAnswers,
			explanation: _explanation,
			...question
		}) => question
	);
}
