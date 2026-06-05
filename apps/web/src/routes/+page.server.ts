import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { listPublicTopics, listSubjects } from '$lib/features/catalog/server/index.server';
import { absoluteUrl, buildSeo, itemListJsonLd, siteJsonLd } from '$lib/seo';

const FEATURED_LIMIT = 6;

export const load: PageServerLoad = async ({ locals, parent, url }) => {
	const { user } = await parent();
	if (user) {
		redirect(303, '/app');
	}

	const [allSubjects, allTopics] = await Promise.all([
		listSubjects(locals.supabase),
		listPublicTopics(locals.supabase)
	]);

	const subjects = allSubjects.slice(0, FEATURED_LIMIT);
	const topics = allTopics.slice(0, FEATURED_LIMIT);

	const stats = {
		subjectCount: allSubjects.length,
		topicCount: allTopics.length,
		lessonCount: allTopics.reduce((sum, topic) => sum + topic.lesson_count, 0),
		quizCount: allTopics.reduce((sum, topic) => sum + topic.quiz_count, 0)
	};

	return {
		subjects,
		topics,
		stats,
		seo: buildSeo({
			url,
			home: true,
			jsonLd: [
				...siteJsonLd(url),
				...(subjects.length
					? [
							itemListJsonLd(
								'Subjects',
								subjects.map((subject) => ({
									name: subject.name,
									url: absoluteUrl(`/subjects/${subject.slug}`, url),
									description: subject.summary
								}))
							)
						]
					: [])
			]
		})
	};
};
