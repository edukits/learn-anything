import type { SupabaseClient } from '@supabase/supabase-js';
import type {
	ContentRelease,
	LearningPathVersion,
	LessonVersion,
	LiteraryDevicesPathItem,
	PracticeQuizQuestion,
	QuizQuestionVersion,
	QuizVersion,
	SkillVersion,
	TopicDiscoveryMetadata
} from '../types';

export const LITERARY_DEVICES_TOPIC_ID = 'topic_literary_devices';
const DISCOVERY_FIELDS =
	'topic_area_id,release_id,slug,name,public_summary,preview_markdown,app_path,level_label,estimated_minutes,lesson_count,quiz_count,covered_skill_ids,covered_devices,content_releases!inner(published_at,status)';

export type ReleaseItem = {
	content_type: string;
	content_id: string;
	content_version: number;
};

export type LiteraryDevicesContent = {
	release: ContentRelease;
	releaseItems: ReleaseItem[];
	path: LearningPathVersion;
	pathItems: LiteraryDevicesPathItem[];
	skills: SkillVersion[];
};

type TopicDiscoveryRow = TopicDiscoveryMetadata & {
	content_releases:
		| {
				published_at: string | null;
				status: 'published' | 'draft' | 'retired';
		  }
		| {
				published_at: string | null;
				status: 'published' | 'draft' | 'retired';
		  }[]
		| null;
};

function requireSingle<T>(value: T | null | undefined, label: string): T {
	if (!value) {
		throw new Error(`Missing ${label}. Import and publish the Literary Devices content first.`);
	}

	return value;
}

export async function getPublicLiteraryDevicesDiscovery(
	client: SupabaseClient
): Promise<TopicDiscoveryMetadata> {
	return requireSingle(
		await findPublicTopicDiscoveryByTopicId(client, LITERARY_DEVICES_TOPIC_ID),
		'public Literary Devices discovery metadata'
	);
}

function latestPublishedTopic(rows: TopicDiscoveryRow[]) {
	return rows.toSorted((a, b) => {
		const aPublishedAt = getDiscoveryRelease(a)?.published_at ?? '';
		const bPublishedAt = getDiscoveryRelease(b)?.published_at ?? '';
		return bPublishedAt.localeCompare(aPublishedAt);
	})[0] ?? null;
}

function getDiscoveryRelease(row: TopicDiscoveryRow) {
	return Array.isArray(row.content_releases) ? (row.content_releases[0] ?? null) : row.content_releases;
}

function toTopicDiscoveryMetadata(row: TopicDiscoveryRow): TopicDiscoveryMetadata {
	const { content_releases: _contentReleases, ...topic } = row;
	return topic;
}

async function findPublicTopicDiscovery(
	client: SupabaseClient,
	filter: 'slug' | 'topic_area_id',
	value: string
): Promise<TopicDiscoveryMetadata | null> {
	const { data, error } = await client
		.from('topic_discovery_metadata')
		.select(DISCOVERY_FIELDS)
		.eq(filter, value)
		.eq('content_releases.status', 'published');

	if (error) {
		throw new Error(error.message);
	}

	const latest = latestPublishedTopic(((data ?? []) as unknown) as TopicDiscoveryRow[]);
	return latest ? toTopicDiscoveryMetadata(latest) : null;
}

export function findPublicTopicDiscoveryBySlug(
	client: SupabaseClient,
	slug: string
): Promise<TopicDiscoveryMetadata | null> {
	return findPublicTopicDiscovery(client, 'slug', slug);
}

export function findPublicTopicDiscoveryByTopicId(
	client: SupabaseClient,
	topicAreaId: string
): Promise<TopicDiscoveryMetadata | null> {
	return findPublicTopicDiscovery(client, 'topic_area_id', topicAreaId);
}

export async function listPublicTopics(client: SupabaseClient): Promise<TopicDiscoveryMetadata[]> {
	const { data, error } = await client
		.from('topic_discovery_metadata')
		.select(DISCOVERY_FIELDS)
		.eq('content_releases.status', 'published')
		.order('name');

	if (error) {
		throw new Error(error.message);
	}

	const latestByTopic = new Map<string, TopicDiscoveryRow>();
	for (const topic of ((data ?? []) as unknown) as TopicDiscoveryRow[]) {
		const current = latestByTopic.get(topic.topic_area_id);
		if (!current || latestPublishedTopic([topic, current]) === topic) {
			latestByTopic.set(topic.topic_area_id, topic);
		}
	}

	return [...latestByTopic.values()]
		.map(toTopicDiscoveryMetadata)
		.toSorted((a, b) => a.name.localeCompare(b.name));
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

export async function getLiteraryDevicesLesson(
	client: SupabaseClient,
	content: LiteraryDevicesContent,
	lessonId: string
) {
	const lessonItem = content.pathItems.find((item) => item.item_type === 'lesson' && item.item_id === lessonId);
	if (!lessonItem) {
		throw new Error(`Lesson ${lessonId} is not in the latest Literary Devices path.`);
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

export async function getLiteraryDevicesQuiz(client: SupabaseClient, content: LiteraryDevicesContent, quizId: string) {
	const quizItem = content.pathItems.find((item) => item.item_type === 'quiz' && item.item_id === quizId);
	if (!quizItem) {
		throw new Error(`Quiz ${quizId} is not in the latest Literary Devices path.`);
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
	const releaseKeys = new Set(items.map((item) => versionKey(item.content_id, item.content_version)));
	return (rows ?? []).filter((row) => releaseKeys.has(versionKey(idForRow(row), row.version)));
}

export async function getLiteraryDevicesContent(client: SupabaseClient): Promise<LiteraryDevicesContent> {
	const release = await getLatestLiteraryDevicesRelease(client);
	const releaseItems = await getReleaseItems(client, release.id);
	const skillItems = getItemsByType(releaseItems, 'skill');
	const skillIds = skillItems.map((item) => item.content_id);
	const path = await getLiteraryDevicesPath(client, releaseItems);

	const { data: skills, error: skillsError } = await client
		.from('skill_versions')
		.select('skill_id,version,name,device,summary')
		.in('skill_id', skillIds)
		.order('name');

	if (skillsError) throw new Error(skillsError.message);

	return {
		release,
		releaseItems,
		path: path.path,
		pathItems: path.pathItems,
		skills: filterReleaseVersions(skills as SkillVersion[] | null, skillItems, (skill) => skill.skill_id)
	};
}

async function getLiteraryDevicesPath(client: SupabaseClient, releaseItems: ReleaseItem[]) {
	const pathItem = getItemsByType(releaseItems, 'learning_path')[0];
	if (!pathItem) {
		throw new Error('Release is missing a learning path.');
	}

	const [{ data: path, error: pathError }, { data: rawItems, error: itemsError }] = await Promise.all([
		client
			.from('learning_path_versions')
			.select('learning_path_id,version,title,summary')
			.eq('learning_path_id', pathItem.content_id)
			.eq('version', pathItem.content_version)
			.maybeSingle(),
		client
			.from('learning_path_items')
			.select('item_type,item_id,item_version,ordering,required')
			.eq('learning_path_id', pathItem.content_id)
			.eq('learning_path_version', pathItem.content_version)
			.order('ordering')
	]);

	if (pathError) throw new Error(pathError.message);
	if (itemsError) throw new Error(itemsError.message);

	const items = rawItems ?? [];
	const lessonItems = items.filter((item) => item.item_type === 'lesson');
	const quizItems = items.filter((item) => item.item_type === 'quiz');
	const [{ data: lessons, error: lessonsError }, { data: quizzes, error: quizzesError }] = await Promise.all([
		lessonItems.length
			? client
					.from('lesson_versions')
					.select('lesson_id,version,title,summary,estimated_minutes')
					.in('lesson_id', lessonItems.map((item) => item.item_id))
			: Promise.resolve({ data: [], error: null }),
		quizItems.length
			? client
					.from('quiz_versions')
					.select('quiz_id,version,title,description,question_count')
					.in('quiz_id', quizItems.map((item) => item.item_id))
			: Promise.resolve({ data: [], error: null })
	]);

	if (lessonsError) throw new Error(lessonsError.message);
	if (quizzesError) throw new Error(quizzesError.message);

	const lessonByKey = new Map(
		((lessons ?? []) as Pick<LessonVersion, 'lesson_id' | 'version' | 'title' | 'summary' | 'estimated_minutes'>[]).map((lesson) => [
			versionKey(lesson.lesson_id, lesson.version),
			lesson
		])
	);
	const quizByKey = new Map(
		((quizzes ?? []) as QuizVersion[]).map((quiz) => [versionKey(quiz.quiz_id, quiz.version), quiz])
	);

	return {
		path: requireSingle(path, 'Literary Devices learning path') as LearningPathVersion,
		pathItems: items.map((item) => {
			if (item.item_type === 'lesson') {
				const lesson = lessonByKey.get(versionKey(item.item_id, item.item_version));
				if (!lesson) throw new Error(`Missing lesson path item ${item.item_id}@${item.item_version}.`);
				return {
					id: `${item.item_type}:${item.item_id}@${item.item_version}`,
					item_type: 'lesson',
					item_id: item.item_id,
					item_version: item.item_version,
					ordering: item.ordering,
					required: item.required,
					title: lesson.title,
					summary: lesson.summary,
					estimated_minutes: lesson.estimated_minutes
				} satisfies LiteraryDevicesPathItem;
			}

			const quiz = quizByKey.get(versionKey(item.item_id, item.item_version));
			if (!quiz) throw new Error(`Missing quiz path item ${item.item_id}@${item.item_version}.`);
			return {
				id: `${item.item_type}:${item.item_id}@${item.item_version}`,
				item_type: 'quiz',
				item_id: item.item_id,
				item_version: item.item_version,
				ordering: item.ordering,
				required: item.required,
				title: quiz.title,
				description: quiz.description,
				question_count: quiz.question_count
			} satisfies LiteraryDevicesPathItem;
		})
	};
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
		.select('question_id,version,skill_id,device,question_type,difficulty,prompt,choices,correct_choice_id,explanation')
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
		questions as Omit<QuizQuestionVersion, 'ordering'>[] | null,
		releaseQuestionItems,
		(question) => question.question_id
	);
	const questionByKey = new Map(
		releaseQuestions.map((question) => [versionKey(question.question_id, question.version), question])
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

export function getQuizQuestions(client: SupabaseClient, quiz: QuizVersion): Promise<QuizQuestionVersion[]> {
	return getQuizQuestionsByLifecycle(client, quiz);
}

export function getActiveQuizQuestions(client: SupabaseClient, quiz: QuizVersion): Promise<QuizQuestionVersion[]> {
	return getQuizQuestionsByLifecycle(client, quiz, 'active');
}

export async function getActiveReleaseQuestions(
	client: SupabaseClient,
	content: LiteraryDevicesContent
): Promise<QuizQuestionVersion[]> {
	const questionItems = getItemsByType(content.releaseItems, 'quiz_question');
	if (!questionItems.length) {
		return [];
	}

	const { data, error } = await client
		.from('quiz_question_versions')
		.select('question_id,version,skill_id,device,question_type,difficulty,prompt,choices,correct_choice_id,explanation')
		.in('question_id', questionItems.map((item) => item.content_id))
		.eq('lifecycle_status', 'active');

	if (error) throw new Error(error.message);

		return filterReleaseVersions(data as Omit<QuizQuestionVersion, 'ordering'>[] | null, questionItems, (question) => question.question_id)
		.map((question, index) => Object.assign(question, { ordering: index + 1 }))
		.toSorted((a, b) => a.question_id.localeCompare(b.question_id));
}

export async function getPracticeQuizQuestions(
	client: SupabaseClient,
	quiz: QuizVersion
): Promise<PracticeQuizQuestion[]> {
	return (await getActiveQuizQuestions(client, quiz)).map(
		({ correct_choice_id: _correctChoiceId, explanation: _explanation, ...question }) => question
	);
}
