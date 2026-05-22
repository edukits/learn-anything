import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { z } from 'zod';

const sourceRefSchema = z.object({
	source_id: z.string().min(1),
	path: z.string().min(1).optional(),
	metadata_path: z.string().min(1).optional()
});

const manifestSchema = z.object({
	run_id: z.string().min(1),
	title: z.string().min(1),
	schema_version: z.number().int().positive(),
	authoring_mode: z.enum(['hand-authored', 'generated']),
	subject_area_id: z.string().min(1),
	topic_area_id: z.string().min(1),
	source_refs: z.array(sourceRefSchema),
	artifacts: z.record(z.string(), z.string().min(1))
});

const versionedBase = {
	id: z.string().min(1),
	version: z.number().int().positive(),
	content_run_id: z.string().min(1),
	schema_version: z.number().int().positive(),
	source_refs: z.array(sourceRefSchema)
};

const subjectAreaSchema = z.object({
	...versionedBase,
	slug: z.string().min(1),
	name: z.string().min(1),
	summary: z.string().min(1)
});

const topicAreaSchema = z.object({
	...versionedBase,
	subject_area_id: z.string().min(1),
	slug: z.string().min(1),
	name: z.string().min(1),
	summary: z.string().min(1)
});

const skillSchema = z.object({
	...versionedBase,
	topic_area_id: z.string().min(1),
	slug: z.string().min(1),
	name: z.string().min(1),
	device: z.string().min(1),
	summary: z.string().min(1)
});

const lessonSchema = z.object({
	...versionedBase,
	topic_area_id: z.string().min(1),
	slug: z.string().min(1),
	title: z.string().min(1),
	summary: z.string().min(1),
	body_markdown: z.string().min(1),
	skill_ids: z.array(z.string().min(1)).min(1),
	estimated_minutes: z.number().int().positive(),
	sort_order: z.number().int().positive()
});

const quizSchema = z.object({
	...versionedBase,
	topic_area_id: z.string().min(1),
	slug: z.string().min(1),
	title: z.string().min(1),
	description: z.string().min(1),
	kind: z.enum(['practice', 'assessment']),
	question_count: z.number().int().positive()
});

const choiceSchema = z.object({
	id: z.string().min(1),
	label: z.string().min(1)
});

const questionSchema = z.object({
	...versionedBase,
	topic_area_id: z.string().min(1),
	skill_id: z.string().min(1),
	device: z.string().min(1),
	question_type: z.enum(['recognition', 'application']),
	difficulty: z.enum(['easy', 'medium', 'hard']),
	prompt: z.string().min(1),
	choices: z.array(choiceSchema).min(2),
	correct_choice_id: z.string().min(1),
	explanation: z.string().min(1)
});

const quizQuestionLinkSchema = z.object({
	quiz_id: z.string().min(1),
	quiz_version: z.number().int().positive(),
	question_id: z.string().min(1),
	question_version: z.number().int().positive(),
	ordering: z.number().int().positive(),
	weight: z.number().positive()
});

const learningPathItemSchema = z.object({
	item_type: z.enum(['lesson', 'quiz']),
	item_id: z.string().min(1),
	item_version: z.number().int().positive(),
	ordering: z.number().int().positive(),
	required: z.boolean()
});

const learningPathSchema = z.object({
	...versionedBase,
	topic_area_id: z.string().min(1),
	slug: z.string().min(1),
	title: z.string().min(1),
	summary: z.string().min(1),
	items: z.array(learningPathItemSchema).min(1)
});

const releaseItemSchema = z.object({
	content_type: z.enum([
		'subject_area',
		'topic_area',
		'skill',
		'lesson',
		'quiz',
		'quiz_question',
		'learning_path',
		'media_asset'
	]),
	content_id: z.string().min(1),
	content_version: z.number().int().positive()
});

const releaseSchema = z.object({
	id: z.string().min(1),
	slug: z.string().min(1),
	title: z.string().min(1),
	scope_type: z.enum(['subject_area', 'topic_area', 'learning_path', 'content_bundle']),
	scope_id: z.string().min(1),
	status: z.enum(['draft', 'published', 'retired']),
	published_at: z.string().datetime().nullable().optional(),
	content_run_id: z.string().min(1),
	bundle_key: z.string().min(1),
	items: z.array(releaseItemSchema).min(1),
	manifest: z.record(z.string(), z.unknown())
});

const artifactSchemas = {
	subject_areas: subjectAreaSchema,
	topic_areas: topicAreaSchema,
	skills: skillSchema,
	lessons: lessonSchema,
	quizzes: quizSchema,
	questions: questionSchema,
	quiz_question_links: quizQuestionLinkSchema,
	learning_paths: learningPathSchema,
	releases: releaseSchema
};

async function readJson(path) {
	return JSON.parse(await readFile(path, 'utf8'));
}

async function readJsonl(path) {
	const body = await readFile(path, 'utf8');
	return body
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean)
		.map((line, index) => {
			try {
				return JSON.parse(line);
			} catch (error) {
				throw new Error(`${path}:${index + 1}: ${error.message}`);
			}
		});
}

function keyFor(record) {
	return `${record.id}@${record.version}`;
}

function refKey(id, version) {
	return `${id}@${version}`;
}

function assertUnique(records, name, failures) {
	const seen = new Set();
	for (const record of records) {
		const key = keyFor(record);
		if (seen.has(key)) {
			failures.push(`${name} contains duplicate ${key}`);
		}
		seen.add(key);
	}
}

function assertRun(records, runId, name, failures) {
	for (const record of records) {
		if (record.content_run_id !== runId) {
			failures.push(`${name} ${record.id ?? record.quiz_id} references ${record.content_run_id}, expected ${runId}`);
		}
	}
}

function has(map, id, version) {
	return map.has(refKey(id, version));
}

export async function loadAndValidateRun(manifestPath) {
	const absoluteManifestPath = resolve(manifestPath);
	const manifestDir = dirname(absoluteManifestPath);
	const manifest = manifestSchema.parse(await readJson(absoluteManifestPath));
	const artifacts = {};
	const failures = [];
	const checks = [];

	for (const [name, relativePath] of Object.entries(manifest.artifacts)) {
		const schema = artifactSchemas[name];
		if (!schema) {
			failures.push(`Manifest references unknown artifact type ${name}`);
			continue;
		}

		const rows = await readJsonl(resolve(manifestDir, relativePath));
		artifacts[name] = rows.map((row, index) => {
			const parsed = schema.safeParse(row);
			if (!parsed.success) {
				failures.push(`${name}:${index + 1}: ${z.prettifyError(parsed.error)}`);
				return row;
			}
			return parsed.data;
		});
	}

	const subjectAreas = artifacts.subject_areas ?? [];
	const topicAreas = artifacts.topic_areas ?? [];
	const skills = artifacts.skills ?? [];
	const lessons = artifacts.lessons ?? [];
	const quizzes = artifacts.quizzes ?? [];
	const questions = artifacts.questions ?? [];
	const links = artifacts.quiz_question_links ?? [];
	const learningPaths = artifacts.learning_paths ?? [];
	const releases = artifacts.releases ?? [];

	for (const [name, records] of Object.entries({
		subject_areas: subjectAreas,
		topic_areas: topicAreas,
		skills,
		lessons,
		quizzes,
		questions,
		learning_paths: learningPaths
	})) {
		assertUnique(records, name, failures);
		assertRun(records, manifest.run_id, name, failures);
	}
	assertRun(releases, manifest.run_id, 'releases', failures);

	const subjectMap = new Map(subjectAreas.map((record) => [keyFor(record), record]));
	const topicMap = new Map(topicAreas.map((record) => [keyFor(record), record]));
	const skillMap = new Map(skills.map((record) => [keyFor(record), record]));
	const lessonMap = new Map(lessons.map((record) => [keyFor(record), record]));
	const quizMap = new Map(quizzes.map((record) => [keyFor(record), record]));
	const questionMap = new Map(questions.map((record) => [keyFor(record), record]));
	const pathMap = new Map(learningPaths.map((record) => [keyFor(record), record]));

	for (const topic of topicAreas) {
		if (!has(subjectMap, topic.subject_area_id, 1)) {
			failures.push(`Topic ${topic.id}@${topic.version} references missing subject ${topic.subject_area_id}@1`);
		}
	}

	for (const skill of skills) {
		if (!has(topicMap, skill.topic_area_id, 1)) {
			failures.push(`Skill ${skill.id}@${skill.version} references missing topic ${skill.topic_area_id}@1`);
		}
	}

	for (const lesson of lessons) {
		for (const skillId of lesson.skill_ids) {
			if (!has(skillMap, skillId, 1)) {
				failures.push(`Lesson ${lesson.id}@${lesson.version} references missing skill ${skillId}@1`);
			}
		}
	}

	for (const question of questions) {
		const choiceIds = new Set(question.choices.map((choice) => choice.id));
		if (!choiceIds.has(question.correct_choice_id)) {
			failures.push(`Question ${question.id}@${question.version} has a correct_choice_id not present in choices`);
		}
		if (!has(skillMap, question.skill_id, 1)) {
			failures.push(`Question ${question.id}@${question.version} references missing skill ${question.skill_id}@1`);
		}
	}

	const linkOrderByQuiz = new Map();
	for (const link of links) {
		if (!has(quizMap, link.quiz_id, link.quiz_version)) {
			failures.push(`Quiz link references missing quiz ${link.quiz_id}@${link.quiz_version}`);
		}
		if (!has(questionMap, link.question_id, link.question_version)) {
			failures.push(`Quiz link references missing question ${link.question_id}@${link.question_version}`);
		}
		const quizKey = refKey(link.quiz_id, link.quiz_version);
		const orderSet = linkOrderByQuiz.get(quizKey) ?? new Set();
		if (orderSet.has(link.ordering)) {
			failures.push(`Quiz ${quizKey} has duplicate ordering ${link.ordering}`);
		}
		orderSet.add(link.ordering);
		linkOrderByQuiz.set(quizKey, orderSet);
	}

	for (const quiz of quizzes) {
		const orderSet = linkOrderByQuiz.get(keyFor(quiz)) ?? new Set();
		if (orderSet.size !== quiz.question_count) {
			failures.push(`Quiz ${keyFor(quiz)} declares ${quiz.question_count} questions but has ${orderSet.size} links`);
		}
		for (let ordering = 1; ordering <= quiz.question_count; ordering += 1) {
			if (!orderSet.has(ordering)) {
				failures.push(`Quiz ${keyFor(quiz)} is missing question ordering ${ordering}`);
			}
		}
	}

	for (const learningPath of learningPaths) {
		for (const item of learningPath.items) {
			const itemMap = item.item_type === 'lesson' ? lessonMap : quizMap;
			if (!itemMap.has(refKey(item.item_id, item.item_version))) {
				failures.push(`Learning path ${keyFor(learningPath)} references missing ${item.item_type} ${item.item_id}@${item.item_version}`);
			}
		}
	}

	const contentMaps = {
		subject_area: subjectMap,
		topic_area: topicMap,
		skill: skillMap,
		lesson: lessonMap,
		quiz: quizMap,
		quiz_question: questionMap,
		learning_path: pathMap
	};

	for (const release of releases) {
		if (release.status === 'published' && !release.published_at) {
			failures.push(`Published release ${release.id} is missing published_at`);
		}
		for (const item of release.items) {
			const contentMap = contentMaps[item.content_type];
			if (!contentMap?.has(refKey(item.content_id, item.content_version))) {
				failures.push(`Release ${release.id} references missing ${item.content_type} ${item.content_id}@${item.content_version}`);
			}
		}
	}

	checks.push('JSONL parses successfully');
	checks.push('Records match v1 schemas');
	checks.push('Stable ids and versions are unique');
	checks.push('Question answer keys point to declared choices');
	checks.push('Quiz-to-question references are complete and ordered');
	checks.push('Release items point to imported content versions');

	const counts = Object.fromEntries(
		Object.entries(artifacts).map(([name, records]) => [name, records.length])
	);

	return {
		manifestPath: absoluteManifestPath,
		manifestDir,
		manifest,
		artifacts,
		report: {
			run_id: manifest.run_id,
			valid: failures.length === 0,
			generated_at: new Date().toISOString(),
			counts,
			checks,
			failures
		}
	};
}

export async function writeValidationReport(run, outputPath = resolve(run.manifestDir, 'validation-report.json')) {
	await writeFile(outputPath, `${JSON.stringify(run.report, null, 2)}\n`);
	return outputPath;
}
