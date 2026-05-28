import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { loadAndValidateRun, writeValidationReport } from '../../../tools/content/content-run.mjs';
import { artifactFiles, compactObject, slugify, snakeId, writeJson, writeJsonl } from './utils.mjs';

const schemaVersion = 1;

function one(value, fallback) {
	return value === undefined || value === null || value === '' ? fallback : value;
}

function versionedBase(id, runId, sourceRefs) {
	return {
		id,
		version: 1,
		content_run_id: runId,
		schema_version: schemaVersion,
		source_refs: sourceRefs
	};
}

function skillId(topicSlug, skill) {
	return (
		skill.id ?? `skill_${snakeId(topicSlug)}_${snakeId(skill.slug ?? skill.name ?? skill.device)}`
	);
}

function normalizeSkills(topicSlug, reviewedItems, syllabus) {
	const skills = new Map();
	for (const item of [...(syllabus?.syllabus ?? []), ...reviewedItems]) {
		const candidates = [
			...(item.skills ?? []),
			...(item.skill_slugs ?? []).map((slug) => ({ slug, name: slug.replaceAll('-', ' ') })),
			...(item.skill_ids ?? []).map((id) => ({ id, slug: id.replace(/^skill_/, ''), name: id })),
			...(item.questions ?? []).map((question) => question.skill).filter(Boolean),
			...(item.questions ?? [])
				.map((question) =>
					question.skill_slug
						? { slug: question.skill_slug, name: question.skill_slug.replaceAll('-', ' ') }
						: null
				)
				.filter(Boolean),
			...(item.interactions ?? [])
				.flatMap((interaction) => interaction.questions ?? [])
				.map((question) =>
					question.skill_slug
						? { slug: question.skill_slug, name: question.skill_slug.replaceAll('-', ' ') }
						: null
				)
				.filter(Boolean)
		];
		for (const candidate of candidates) {
			const id = skillId(topicSlug, candidate);
			if (!skills.has(id)) {
				const name = one(candidate.name, one(candidate.device, candidate.slug ?? id));
				skills.set(id, {
					id,
					slug: slugify(candidate.slug ?? name),
					name,
					device: one(candidate.device, name),
					summary: one(candidate.summary, `Practice ${name}.`)
				});
			}
		}
	}
	return [...skills.values()];
}

function itemSlug(item, index) {
	return slugify(item.slug ?? item.focus ?? item.title ?? `${item.type}-${index + 1}`);
}

function choiceIdForIndex(index) {
	if (index >= 0 && index < 26) {
		return String.fromCharCode('a'.charCodeAt(0) + index);
	}
	return `choice-${index + 1}`;
}

function normalizeChoices(question) {
	if (!question.choices) {
		return undefined;
	}
	return question.choices.map((choice, index) =>
		typeof choice === 'string' ? { id: choiceIdForIndex(index), label: choice } : choice
	);
}

function choiceIdAtIndex(choices, index) {
	return Number.isInteger(index) ? choices?.[index]?.id : undefined;
}

function sequenceIdFor(label, index, seen) {
	const base = slugify(label) || `item-${index + 1}`;
	if (!seen.has(base)) {
		seen.add(base);
		return base;
	}
	const id = `${base}-${index + 1}`;
	seen.add(id);
	return id;
}

function normalizeSequenceItems(question) {
	if (!question.sequence_items) {
		return undefined;
	}
	const seen = new Set();
	return question.sequence_items.map((item, index) => {
		if (typeof item !== 'string') {
			seen.add(item.id);
			return item;
		}
		return { id: sequenceIdFor(item, index, seen), label: item };
	});
}

function normalizeModuleRecords({ input, modules, syllabus, runId, sourceRefs }) {
	const topic = input.topic;
	const plannedModules = modules?.modules ?? syllabus?.modules ?? [];
	const sourceModules =
		plannedModules.length > 0
			? plannedModules
			: [
					{
						slug: topic.learning_path.slug ?? `${topic.topic.slug}-module`,
						title: topic.learning_path.title ?? topic.topic.name,
						description: topic.learning_path.summary ?? syllabus.summary ?? topic.topic.summary,
						content_responsibility:
							topic.learning_path.summary ?? syllabus.summary ?? topic.topic.summary
					}
				];

	return sourceModules.map((module, index) => {
		const title = one(module.title ?? module.name, `Module ${index + 1}`);
		const slug = slugify(module.slug ?? title);
		const id = module.id ?? `module_${snakeId(topic.topic.slug)}_${snakeId(slug)}`;
		return Object.assign(versionedBase(id, runId, sourceRefs), {
			topic_area_id: topic.topic.id,
			slug,
			title,
			description: one(module.description, module.summary ?? title),
			content_responsibility: one(
				module.content_responsibility,
				module.responsibility ?? module.description ?? module.summary ?? title
			),
			ordering: Number.isInteger(module.ordering) ? module.ordering : index + 1
		});
	});
}

function lessonRecord({ item, index, topic, runId, sourceRefs, skillLookup }) {
	const slug = itemSlug(item, index);
	const id = item.id ?? `lesson_${snakeId(topic.topic.slug)}_${snakeId(slug)}`;
	const skill_ids =
		item.skill_ids?.map((skill) =>
			typeof skill === 'string' ? skill : skillId(topic.topic.slug, skill)
		) ??
		item.skill_slugs?.map((skillSlug) =>
			skillId(topic.topic.slug, { slug: skillSlug, name: skillSlug })
		) ??
		item.skills?.map((skill) => skillId(topic.topic.slug, skill)) ??
		[skillLookup[0]?.id].filter(Boolean);

	return {
		...versionedBase(id, runId, sourceRefs),
		topic_area_id: topic.topic.id,
		slug,
		title: one(item.title, item.focus ?? 'Lesson'),
		summary: one(item.summary, item.goals ?? item.focus ?? 'Lesson summary'),
		body_markdown: one(item.body_markdown, item.body ?? ''),
		render_blocks: item.render_blocks ?? [
			{ type: 'markdown', markdown: one(item.body_markdown, item.body ?? '') }
		],
		skill_ids,
		estimated_minutes: Number.isInteger(item.estimated_minutes) ? item.estimated_minutes : 5,
		sort_order: index + 1
	};
}

function normalizeQuestion({
	question,
	quiz,
	questionIndex,
	topic,
	runId,
	sourceRefs,
	skillLookup
}) {
	const quizSlug = slugify(quiz.slug ?? quiz.title ?? 'quiz');
	const fallbackSkill = skillLookup[0];
	const skill = question.skill;
	const resolvedSkillId =
		question.skill_id ??
		(question.skill_slug ? skillId(topic.topic.slug, { slug: question.skill_slug }) : undefined) ??
		(skill ? skillId(topic.topic.slug, skill) : fallbackSkill?.id);
	const id =
		question.id ??
		`question_${snakeId(topic.topic.slug)}_${snakeId(quizSlug)}_${String(questionIndex + 1).padStart(2, '0')}`;
	const questionPurpose = question.question_purpose ?? 'application';
	const responseType = question.response_type ?? 'multiple_choice';
	const choices = normalizeChoices(question);
	const sequenceItems = normalizeSequenceItems(question);

	return compactObject({
		...versionedBase(id, runId, sourceRefs),
		topic_area_id: topic.topic.id,
		skill_id: resolvedSkillId,
		device:
			question.device ??
			skill?.device ??
			skill?.name ??
			skillLookup.find((candidate) => candidate.id === resolvedSkillId)?.name ??
			'General',
		question_purpose: questionPurpose,
		response_type: responseType,
		difficulty: question.difficulty ?? 'medium',
		prompt: question.prompt,
		choices,
		choice_order_strategy: question.choice_order_strategy,
		fixed_choice_ids:
			question.fixed_choice_ids ??
			question.fixed_choice_indices?.map((fixedIndex) => choiceIdAtIndex(choices, fixedIndex)),
		correct_choice_id:
			question.correct_choice_id ?? choiceIdAtIndex(choices, question.correct_index),
		correct_choice_ids:
			question.correct_choice_ids ??
			question.correct_indices?.map((correctIndex) => choiceIdAtIndex(choices, correctIndex)),
		correct_numeric_answer: question.correct_numeric_answer,
		sequence_items: sequenceItems,
		accepted_answers: question.accepted_answers,
		grading_rubric: question.grading_rubric,
		explanation: question.explanation
	});
}

function quizRecord({ item, index, topic, runId, sourceRefs }) {
	const slug = itemSlug(item, index);
	const id = item.id ?? `quiz_${snakeId(topic.topic.slug)}_${snakeId(slug)}`;
	const questions = item.questions ?? [];
	return {
		...versionedBase(id, runId, sourceRefs),
		topic_area_id: topic.topic.id,
		slug,
		title: one(item.title, item.focus ?? 'Quiz'),
		description: one(
			item.description,
			item.summary ?? item.goals ?? item.focus ?? 'Quiz description'
		),
		kind: item.kind ?? 'practice',
		question_count: questions.length
	};
}

function validateReviewedItems(items) {
	if (items.length === 0) {
		throw new Error('No reviewed items found to bundle.');
	}
	for (const [index, item] of items.entries()) {
		if (item.type !== 'lesson' && item.type !== 'quiz') {
			throw new Error(`Reviewed item ${index + 1} must have type "lesson" or "quiz".`);
		}
		if (item.type === 'lesson' && !item.body_markdown) {
			throw new Error(`Lesson item ${index + 1} is missing body_markdown.`);
		}
		if (item.type === 'lesson' && !(item.render_blocks?.length > 0)) {
			throw new Error(`Lesson item ${index + 1} is missing render_blocks.`);
		}
		if (item.type === 'lesson' && !(item.interactions?.length > 0)) {
			throw new Error(`Lesson item ${index + 1} is missing inline interactions.`);
		}
		if (item.type === 'quiz' && !(item.questions?.length > 0)) {
			throw new Error(`Quiz item ${index + 1} must contain at least one question.`);
		}
	}
}

export async function bundleRun({
	input,
	syllabus,
	modules,
	reviewedItems,
	outDir,
	runId,
	now = new Date()
}) {
	validateReviewedItems(reviewedItems);
	await mkdir(outDir, { recursive: true });

	const topic = input.topic;
	const sourceRefs = input.sourceRefs;
	const publishedAt = now.toISOString();
	const title = `${topic.topic.name} ${runId.replace(/^run_/, '')}`;
	const skills = normalizeSkills(topic.topic.slug, reviewedItems, syllabus);
	const topicModules = normalizeModuleRecords({ input, modules, syllabus, runId, sourceRefs });
	const firstModule = topicModules[0];
	const moduleBySlug = new Map(topicModules.map((topicModule) => [topicModule.slug, topicModule]));
	const moduleById = new Map(topicModules.map((topicModule) => [topicModule.id, topicModule]));
	const lessons = [];
	const quizzes = [];
	const questions = [];
	const links = [];
	const lessonInteractionLinks = [];
	const pathItems = [];

	for (const [index, item] of reviewedItems.entries()) {
		const syllabusItem = syllabus.syllabus?.[index] ?? {};
		const module =
			moduleById.get(item.module_id ?? syllabusItem.module_id) ??
			moduleBySlug.get(item.module_slug ?? syllabusItem.module_slug ?? syllabusItem.module?.slug) ??
			firstModule;
		if (item.type === 'lesson') {
			const lesson = lessonRecord({ item, index, topic, runId, sourceRefs, skillLookup: skills });
			lessons.push(lesson);
			pathItems.push({
				item_type: 'lesson',
				item_id: lesson.id,
				item_version: 1,
				module_id: module?.id,
				module_version: module?.version,
				ordering: index + 1,
				required: true
			});
			for (const interaction of item.interactions ?? []) {
				for (const [questionIndex, question] of interaction.questions.entries()) {
					const record = normalizeQuestion({
						question,
						quiz: {
							slug: `${lesson.slug}-${interaction.slug}`,
							title: `${lesson.title} ${interaction.slug}`
						},
						questionIndex,
						topic,
						runId,
						sourceRefs,
						skillLookup: skills
					});
					questions.push(record);
					lessonInteractionLinks.push({
						lesson_id: lesson.id,
						lesson_version: 1,
						interaction_slug: interaction.slug,
						interaction_type: interaction.type,
						question_id: record.id,
						question_version: 1,
						ordering: questionIndex + 1
					});
				}
			}
			continue;
		}

		const quiz = quizRecord({ item, index, topic, runId, sourceRefs });
		quizzes.push(quiz);
		pathItems.push({
			item_type: 'quiz',
			item_id: quiz.id,
			item_version: 1,
			module_id: module?.id,
			module_version: module?.version,
			ordering: index + 1,
			required: true
		});
		for (const [questionIndex, question] of item.questions.entries()) {
			const record = normalizeQuestion({
				question,
				quiz,
				questionIndex,
				topic,
				runId,
				sourceRefs,
				skillLookup: skills
			});
			questions.push(record);
			links.push({
				quiz_id: quiz.id,
				quiz_version: 1,
				question_id: record.id,
				question_version: 1,
				ordering: questionIndex + 1,
				weight: 1
			});
		}
	}

	const learningPathId =
		topic.learning_path.id ??
		`path_${snakeId(topic.topic.slug)}_${snakeId(runId.replace(/^run_/, ''))}`;
	const releaseId =
		topic.release.id ??
		`release_${snakeId(topic.topic.slug)}_${snakeId(runId.replace(/^run_/, ''))}`;
	const releaseItems = [
		{ content_type: 'subject_area', content_id: topic.subject.id, content_version: 1 },
		{ content_type: 'topic_area', content_id: topic.topic.id, content_version: 1 },
		...topicModules.map((topicModule) => ({
			content_type: 'topic_module',
			content_id: topicModule.id,
			content_version: 1
		})),
		...skills.map((skill) => ({ content_type: 'skill', content_id: skill.id, content_version: 1 })),
		...lessons.map((lesson) => ({
			content_type: 'lesson',
			content_id: lesson.id,
			content_version: 1
		})),
		...quizzes.map((quiz) => ({ content_type: 'quiz', content_id: quiz.id, content_version: 1 })),
		...questions.map((question) => ({
			content_type: 'quiz_question',
			content_id: question.id,
			content_version: 1
		})),
		{ content_type: 'learning_path', content_id: learningPathId, content_version: 1 }
	];

	const artifacts = {
		subject_areas: [
			{
				...versionedBase(topic.subject.id, runId, sourceRefs),
				slug: topic.subject.slug,
				name: topic.subject.name,
				summary: topic.subject.summary
			}
		],
		topic_areas: [
			{
				...versionedBase(topic.topic.id, runId, sourceRefs),
				subject_area_id: topic.subject.id,
				slug: topic.topic.slug,
				name: topic.topic.name,
				summary: topic.topic.summary
			}
		],
		topic_modules: topicModules,
		skills: skills.map((skill) => ({
			...versionedBase(skill.id, runId, sourceRefs),
			topic_area_id: topic.topic.id,
			slug: skill.slug,
			name: skill.name,
			device: skill.device,
			summary: skill.summary
		})),
		lessons,
		quizzes,
		questions,
		quiz_question_links: links,
		lesson_interaction_links: lessonInteractionLinks,
		learning_paths: [
			{
				...versionedBase(learningPathId, runId, sourceRefs),
				topic_area_id: topic.topic.id,
				slug: topic.learning_path.slug ?? `${topic.topic.slug}-path`,
				title: topic.learning_path.title ?? `${topic.topic.name} Path`,
				summary: topic.learning_path.summary ?? syllabus.summary ?? topic.topic.summary,
				items: pathItems
			}
		],
		releases: [
			{
				id: releaseId,
				slug: topic.release.slug ?? `${topic.topic.slug}-${snakeId(runId.replace(/^run_/, ''))}`,
				title: topic.release.title ?? title,
				scope_type: 'topic_area',
				scope_id: topic.topic.id,
				status: topic.release.status ?? 'published',
				published_at: topic.release.published_at ?? publishedAt,
				content_run_id: runId,
				bundle_key: topic.release.bundle_key ?? `${topic.topic.id}:v1`,
				items: releaseItems,
				manifest: {
					review_status: 'approved',
					generated_by: '@learn-anything/content-pipeline',
					rollback: { action: 'retire_release', release_id: releaseId },
					staging: { imported_at: publishedAt, smoke_tested_at: publishedAt }
				}
			}
		],
		topic_discovery_metadata: [
			{
				topic_area_id: topic.topic.id,
				release_id: releaseId,
				slug: topic.topic.slug,
				name: topic.topic.name,
				public_summary: topic.topic.public_summary,
				preview_markdown: topic.topic.preview_markdown,
				app_path: topic.topic.app_path,
				level_label: topic.topic.level_label,
				estimated_minutes:
					topic.topic.estimated_minutes ??
					lessons.reduce((total, lesson) => total + lesson.estimated_minutes, 0) +
						quizzes.reduce((total, quiz) => total + Math.max(quiz.question_count * 2, 5), 0),
				lesson_count: lessons.length,
				quiz_count: quizzes.length,
				covered_skill_ids: skills.map((skill) => skill.id),
				covered_devices: skills.map((skill) => skill.name)
			}
		],
		media_assets: []
	};

	await writeJson(resolve(outDir, 'manifest.json'), {
		run_id: runId,
		title,
		schema_version: schemaVersion,
		authoring_mode: 'generated',
		subject_area_id: topic.subject.id,
		topic_area_id: topic.topic.id,
		source_refs: sourceRefs,
		artifacts: artifactFiles
	});

	await Promise.all(
		Object.entries(artifactFiles).map(([name, file]) =>
			writeJsonl(resolve(outDir, file), artifacts[name] ?? [])
		)
	);

	const run = await loadAndValidateRun(resolve(outDir, 'manifest.json'));
	await writeValidationReport(run);
	return run;
}
