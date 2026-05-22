import type { SupabaseClient } from '@supabase/supabase-js';
import type { SubjectSummary, TopicDiscoveryMetadata } from '../types';

const DISCOVERY_FIELDS =
	'topic_area_id,release_id,slug,name,public_summary,preview_markdown,app_path,level_label,estimated_minutes,lesson_count,quiz_count,covered_skill_ids,covered_devices,content_releases!inner(published_at,status)';

type TopicDiscoveryRow = Omit<TopicDiscoveryMetadata, 'covered_skill_labels'> & {
	covered_devices: string[];
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

type TopicAreaRow = {
	id: string;
	slug: string;
	subject_area_id: string;
};

type SubjectVersionRow = {
	subject_area_id: string;
	version: number;
	name: string;
	summary: string;
	subject_areas: { slug: string } | { slug: string }[] | null;
};

function getDiscoveryRelease(row: TopicDiscoveryRow) {
	return Array.isArray(row.content_releases)
		? (row.content_releases[0] ?? null)
		: row.content_releases;
}

function latestPublishedTopic(rows: TopicDiscoveryRow[]) {
	return (
		rows.toSorted((a, b) => {
			const aPublishedAt = getDiscoveryRelease(a)?.published_at ?? '';
			const bPublishedAt = getDiscoveryRelease(b)?.published_at ?? '';
			return bPublishedAt.localeCompare(aPublishedAt);
		})[0] ?? null
	);
}

function withGenericAppPath(topic: TopicDiscoveryMetadata): TopicDiscoveryMetadata {
	return {
		...topic,
		app_path: `/app/topics/${topic.slug}`
	};
}

function toTopicDiscoveryMetadata(row: TopicDiscoveryRow): TopicDiscoveryMetadata {
	const { content_releases: _contentReleases, covered_devices, ...topic } = row;
	return withGenericAppPath({
		...topic,
		covered_skill_labels: covered_devices
	});
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

	const latest = latestPublishedTopic((data ?? []) as unknown as TopicDiscoveryRow[]);
	return latest ? toTopicDiscoveryMetadata(latest) : null;
}

export function findPublicTopicDiscoveryBySlug(client: SupabaseClient, slug: string) {
	return findPublicTopicDiscovery(client, 'slug', slug);
}

export function findPublicTopicDiscoveryByTopicId(client: SupabaseClient, topicAreaId: string) {
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
	for (const topic of (data ?? []) as unknown as TopicDiscoveryRow[]) {
		const current = latestByTopic.get(topic.topic_area_id);
		if (!current || latestPublishedTopic([topic, current]) === topic) {
			latestByTopic.set(topic.topic_area_id, topic);
		}
	}

	return [...latestByTopic.values()]
		.map(toTopicDiscoveryMetadata)
		.toSorted((a, b) => a.name.localeCompare(b.name));
}

export async function getTopicAreaBySlug(
	client: SupabaseClient,
	slug: string
): Promise<TopicAreaRow | null> {
	const { data, error } = await client
		.from('topic_areas')
		.select('id,slug,subject_area_id')
		.eq('slug', slug)
		.maybeSingle();

	if (error) throw new Error(error.message);
	return data as TopicAreaRow | null;
}

export async function listSubjects(client: SupabaseClient): Promise<SubjectSummary[]> {
	const [{ data: subjects, error: subjectsError }, topics] = await Promise.all([
		client
			.from('subject_area_versions')
			.select('subject_area_id,version,name,summary,subject_areas!inner(slug)')
			.order('name'),
		listPublicTopics(client)
	]);

	if (subjectsError) throw new Error(subjectsError.message);

	const latestBySubject = new Map<string, SubjectVersionRow>();
	for (const subject of (subjects ?? []) as unknown as SubjectVersionRow[]) {
		const current = latestBySubject.get(subject.subject_area_id);
		if (!current || subject.version > current.version) {
			latestBySubject.set(subject.subject_area_id, subject);
		}
	}

	const topicAreaRows = await listTopicAreasForTopics(
		client,
		topics.map((topic) => topic.topic_area_id)
	);
	const topicCountBySubject = new Map<string, number>();
	for (const topic of topicAreaRows) {
		topicCountBySubject.set(
			topic.subject_area_id,
			(topicCountBySubject.get(topic.subject_area_id) ?? 0) + 1
		);
	}

	return [...latestBySubject.values()]
		.map((subject) => {
			const subjectArea = Array.isArray(subject.subject_areas)
				? subject.subject_areas[0]
				: subject.subject_areas;
			return {
				id: subject.subject_area_id,
				slug: subjectArea?.slug ?? subject.subject_area_id,
				name: subject.name,
				summary: subject.summary,
				topicCount: topicCountBySubject.get(subject.subject_area_id) ?? 0
			};
		})
		.filter((subject) => subject.topicCount > 0)
		.toSorted((a, b) => a.name.localeCompare(b.name));
}

export async function getSubjectBySlug(
	client: SupabaseClient,
	slug: string
): Promise<{ subject: SubjectSummary; topics: TopicDiscoveryMetadata[] } | null> {
	const subjects = await listSubjects(client);
	const subject = subjects.find((candidate) => candidate.slug === slug);
	if (!subject) return null;

	const topics = await listPublicTopics(client);
	const topicAreas = await listTopicAreasForTopics(
		client,
		topics.map((topic) => topic.topic_area_id)
	);
	const topicAreaById = new Map(topicAreas.map((topic) => [topic.id, topic]));

	return {
		subject,
		topics: topics.filter(
			(topic) => topicAreaById.get(topic.topic_area_id)?.subject_area_id === subject.id
		)
	};
}

async function listTopicAreasForTopics(
	client: SupabaseClient,
	topicAreaIds: string[]
): Promise<TopicAreaRow[]> {
	if (!topicAreaIds.length) return [];

	const { data, error } = await client
		.from('topic_areas')
		.select('id,slug,subject_area_id')
		.in('id', topicAreaIds);

	if (error) throw new Error(error.message);
	return (data ?? []) as TopicAreaRow[];
}
