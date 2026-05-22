import type { SupabaseClient } from '@supabase/supabase-js';
import { getTopicAreaBySlug, listPublicTopics } from './catalog.server';
import type { TopicEnrollment, TopicEnrollmentStatus } from '../types';

type EnrollmentRow = {
	user_id: string;
	topic_area_id: string;
	status: TopicEnrollmentStatus;
	started_at: string;
	updated_at: string;
};

export async function getEnrollments(client: SupabaseClient, userId: string): Promise<TopicEnrollment[]> {
	const { data, error } = await client
		.from('user_topic_enrollments')
		.select('user_id,topic_area_id,status,started_at,updated_at')
		.eq('user_id', userId)
		.order('updated_at', { ascending: false });

	if (error) throw new Error(error.message);

	const rows = (data ?? []) as EnrollmentRow[];
	const topicById = new Map((await listPublicTopics(client)).map((topic) => [topic.topic_area_id, topic]));

	return rows.map((row) =>
		Object.assign({}, row, {
			topic: topicById.get(row.topic_area_id) ?? null,
			topic_slug: topicById.get(row.topic_area_id)?.slug ?? row.topic_area_id,
			topic_name: topicById.get(row.topic_area_id)?.name ?? row.topic_area_id
		})
	);
}

export async function getActiveEnrollments(client: SupabaseClient, userId: string) {
	return (await getEnrollments(client, userId)).filter((enrollment) => enrollment.status === 'active');
}

export async function getActiveTopic(client: SupabaseClient, userId: string) {
	const [activeEnrollment] = await getActiveEnrollments(client, userId);
	return activeEnrollment ?? null;
}

export async function ensureTopicEnrollment(
	client: SupabaseClient,
	userId: string,
	topicSlug: string
): Promise<TopicEnrollment | null> {
	const topicArea = await getTopicAreaBySlug(client, topicSlug);
	if (!topicArea) return null;

	const { data, error } = await client
		.from('user_topic_enrollments')
		.upsert(
			{
				user_id: userId,
				topic_area_id: topicArea.id,
				status: 'active'
			},
			{ onConflict: 'user_id,topic_area_id' }
		)
		.select('user_id,topic_area_id,status,started_at,updated_at')
		.single();

	if (error) throw new Error(error.message);

	const topic = (await listPublicTopics(client)).find((candidate) => candidate.topic_area_id === topicArea.id) ?? null;
	return {
		...((data as EnrollmentRow) ?? {
			user_id: userId,
			topic_area_id: topicArea.id,
			status: 'active',
			started_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		}),
		topic,
		topic_slug: topic?.slug ?? topicSlug,
		topic_name: topic?.name ?? topicSlug
	};
}

export async function getEnrollmentForTopic(client: SupabaseClient, userId: string, topicSlug: string) {
	const topicArea = await getTopicAreaBySlug(client, topicSlug);
	if (!topicArea) return null;

	const { data, error } = await client
		.from('user_topic_enrollments')
		.select('user_id,topic_area_id,status,started_at,updated_at')
		.eq('user_id', userId)
		.eq('topic_area_id', topicArea.id)
		.maybeSingle();

	if (error) throw new Error(error.message);
	if (!data) return null;

	const topic = (await listPublicTopics(client)).find((candidate) => candidate.topic_area_id === topicArea.id) ?? null;
	return {
		...(data as EnrollmentRow),
		topic,
		topic_slug: topic?.slug ?? topicSlug,
		topic_name: topic?.name ?? topicSlug
	} satisfies TopicEnrollment;
}

export async function getDefaultTopicSlug(client: SupabaseClient, userId: string) {
	const activeTopic = await getActiveTopic(client, userId);
	if (activeTopic) return activeTopic.topic_slug;

	const [firstTopic] = await listPublicTopics(client);
	return firstTopic?.slug ?? null;
}
