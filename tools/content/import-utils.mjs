function uniqueLessonVersions(lessons) {
	const lessonByKey = new Map();
	for (const lesson of lessons) {
		lessonByKey.set(`${lesson.id}@${lesson.version}`, {
			id: lesson.id,
			version: lesson.version
		});
	}
	return lessonByKey.values();
}

export async function deleteLessonInteractionLinksForLessons(client, lessons) {
	for (const lesson of uniqueLessonVersions(lessons)) {
		const { error } = await client
			.from('lesson_interaction_links')
			.delete()
			.eq('lesson_id', lesson.id)
			.eq('lesson_version', lesson.version);

		if (error) {
			throw new Error(
				`lesson_interaction_links delete ${lesson.id}@${lesson.version}: ${error.message}`
			);
		}
	}
}
