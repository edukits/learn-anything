#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const runId = 'run_2026_05_22_exam_prep_california_driving_test_v1';
const outDir = resolve('curriculum-artifacts/runs', runId);
const schemaVersion = 1;
const publishedAt = '2026-05-22T13:30:00.000Z';
const subjectId = 'subject_exam_prep';
const topicId = 'topic_california_driving_test';
const releaseId = 'release_exam_prep_california_driving_test_v1';
const sourceRefs = [
	{
		source_id: 'source_exam_prep_california_driving_test_v1',
		path: 'content-sources/exam-prep/california-driving-test/source.md',
		metadata_path: 'content-sources/exam-prep/california-driving-test/metadata.json'
	}
];

const skills = [
	['skill_ca_signs_signals', 'signs-and-signals', 'Signs and Signals', 'Recognize what traffic signs and signals require.'],
	['skill_ca_right_of_way', 'right-of-way', 'Right-of-Way', 'Decide who goes first at intersections and crosswalks.'],
	['skill_ca_safe_spacing', 'safe-spacing', 'Safe Spacing', 'Choose following distance and emergency-vehicle spacing.'],
	['skill_ca_impairment', 'impairment-rules', 'Impairment Rules', 'Apply BAC and impairment rules for safe driving.']
];

const lessons = [
	{
		id: 'lesson_ca_driving_control_rules',
		slug: 'traffic-control-and-yielding',
		title: 'Traffic Control And Yielding',
		summary: 'Review stop signs, yield signs, crosswalks, and four-way stops.',
		skill_ids: ['skill_ca_signs_signals', 'skill_ca_right_of_way'],
		estimated_minutes: 6,
		body_markdown: `# Traffic Control And Yielding

Stop signs require a full stop. Yield signs require slowing down and giving right-of-way to people or vehicles already in the conflict area.

At a four-way stop, the first vehicle to stop goes first. If two vehicles arrive at the same time, the driver on the left yields to the driver on the right.

Pedestrians in marked or unmarked crosswalks have right-of-way. A driver should slow early, stop when required, and avoid pressuring the pedestrian.`
	},
	{
		id: 'lesson_ca_driving_safe_choices',
		slug: 'safe-spacing-and-impairment',
		title: 'Safe Spacing And Impairment',
		summary: 'Practice following distance, emergency vehicle response, and BAC limits.',
		skill_ids: ['skill_ca_safe_spacing', 'skill_ca_impairment'],
		estimated_minutes: 6,
		body_markdown: `# Safe Spacing And Impairment

A three-second following distance is a common minimum in good conditions. Add more space in rain, fog, darkness, heavy traffic, or when following a motorcycle.

When an emergency vehicle is stopped with flashing lights, slow down and move over when it is safe.

For most adult drivers, a blood alcohol concentration of 0.08 percent or higher is illegal. A driver can still be unsafe below that level if impaired.`
	}
];

const quizzes = [
	{
		id: 'quiz_ca_driving_control_rules',
		slug: 'traffic-control-check',
		title: 'Traffic Control Check',
		description: 'Use signs, signals, and right-of-way rules.',
		questionIds: [
			'question_ca_signs_stop_1',
			'question_ca_right_of_way_1',
			'question_ca_right_of_way_sequence_1',
			'question_ca_crosswalk_short_1'
		]
	},
	{
		id: 'quiz_ca_driving_safe_choices',
		slug: 'safe-driving-check',
		title: 'Safe Driving Check',
		description: 'Practice spacing, emergency response, and impairment rules.',
		questionIds: [
			'question_ca_spacing_numeric_1',
			'question_ca_emergency_select_1',
			'question_ca_impairment_numeric_1',
			'question_ca_impairment_short_1'
		]
	}
];

const questions = [
	{
		id: 'question_ca_signs_stop_1',
		skill_id: 'skill_ca_signs_signals',
		device: 'Signs and Signals',
		question_type: 'recognition',
		difficulty: 'easy',
		prompt: 'What must you do at a stop sign?',
		choices: [
			['a', 'Slow only if another vehicle is present.'],
			['b', 'Make a full stop before proceeding when safe.'],
			['c', 'Tap the brakes and continue.'],
			['d', 'Stop only if turning left.']
		],
		correct_choice_id: 'b',
		explanation: 'A stop sign requires a full stop before entering or crossing when it is safe.'
	},
	{
		id: 'question_ca_right_of_way_1',
		skill_id: 'skill_ca_right_of_way',
		device: 'Right-of-Way',
		question_type: 'multiple_select',
		difficulty: 'medium',
		prompt: 'Which drivers or road users should you yield to? Select all that apply.',
		choices: [
			['pedestrian', 'A pedestrian already in a crosswalk.'],
			['first_stop', 'A driver who reached a four-way stop before you.'],
			['left_same_time', 'A driver on your left who arrived at the same time.'],
			['through_traffic', 'Traffic already in the intersection.']
		],
		correct_choice_ids: ['pedestrian', 'first_stop', 'through_traffic'],
		explanation: 'Yield to pedestrians in crosswalks, traffic already in the intersection, and the driver who arrived first at a four-way stop.'
	},
	{
		id: 'question_ca_right_of_way_sequence_1',
		skill_id: 'skill_ca_right_of_way',
		device: 'Right-of-Way',
		question_type: 'sequencing',
		difficulty: 'medium',
		prompt: 'Put the four-way stop decision steps in order.',
		sequence_items: [
			['stop', 'Come to a full stop.'],
			['first', 'Check who arrived first.'],
			['right', 'If tied, yield to the driver on your right.'],
			['proceed', 'Proceed only when it is your turn and safe.']
		],
		explanation: 'A full stop comes first, then arrival order, then the right-side tie rule, then proceeding safely.'
	},
	{
		id: 'question_ca_crosswalk_short_1',
		skill_id: 'skill_ca_right_of_way',
		device: 'Right-of-Way',
		question_type: 'short_answer',
		difficulty: 'easy',
		prompt: 'In one word, what should you do for a pedestrian in a crosswalk?',
		accepted_answers: ['yield', 'stop'],
		explanation: 'Drivers must yield, and often stop, for pedestrians in crosswalks.'
	},
	{
		id: 'question_ca_spacing_numeric_1',
		skill_id: 'skill_ca_safe_spacing',
		device: 'Safe Spacing',
		question_type: 'numeric_answer',
		difficulty: 'easy',
		prompt: 'What minimum following distance in seconds is commonly recommended in good conditions?',
		correct_numeric_answer: { value: 3, tolerance: 0 },
		explanation: 'Three seconds is a common minimum in good conditions; use more when conditions are poor.'
	},
	{
		id: 'question_ca_emergency_select_1',
		skill_id: 'skill_ca_safe_spacing',
		device: 'Safe Spacing',
		question_type: 'multiple_select',
		difficulty: 'medium',
		prompt: 'When an emergency vehicle is stopped with flashing lights, what should you do when safe?',
		choices: [
			['slow', 'Slow down.'],
			['move_over', 'Move over.'],
			['speed_up', 'Speed up to pass quickly.'],
			['ignore', 'Keep the same speed and lane no matter what.']
		],
		correct_choice_ids: ['slow', 'move_over'],
		explanation: 'Slow down and move over when it is safe.'
	},
	{
		id: 'question_ca_impairment_numeric_1',
		skill_id: 'skill_ca_impairment',
		device: 'Impairment Rules',
		question_type: 'numeric_answer',
		difficulty: 'medium',
		prompt: 'For most adult drivers, what BAC percentage is illegal at or above? Enter the percentage number.',
		correct_numeric_answer: { value: 0.08, tolerance: 0 },
		explanation: 'For most adult drivers, 0.08 percent BAC or higher is illegal.'
	},
	{
		id: 'question_ca_impairment_short_1',
		skill_id: 'skill_ca_impairment',
		device: 'Impairment Rules',
		question_type: 'short_answer',
		difficulty: 'easy',
		prompt: 'What single word describes a driver whose alcohol or drugs make safe driving worse?',
		accepted_answers: ['impaired'],
		explanation: 'A driver can be impaired even below a per se BAC limit.'
	}
];

const learningPath = {
	id: 'path_california_driving_test',
	slug: 'california-driving-test-path',
	title: 'California Driving Test Path',
	summary: 'Build the decision rules needed for common written-test scenarios.',
	items: [
		['lesson', 'lesson_ca_driving_control_rules'],
		['quiz', 'quiz_ca_driving_control_rules'],
		['lesson', 'lesson_ca_driving_safe_choices'],
		['quiz', 'quiz_ca_driving_safe_choices']
	]
};

function sourceVersionBase(id) {
	return { id, version: 1, content_run_id: runId, schema_version: schemaVersion, source_refs: sourceRefs };
}

function questionRecord(question) {
	return {
		...sourceVersionBase(question.id),
		topic_area_id: topicId,
		skill_id: question.skill_id,
		device: question.device,
		question_type: question.question_type,
		difficulty: question.difficulty,
		prompt: question.prompt,
		choices: question.choices?.map(([id, label]) => ({ id, label })),
		correct_choice_id: question.correct_choice_id,
		correct_choice_ids: question.correct_choice_ids,
		correct_numeric_answer: question.correct_numeric_answer,
		sequence_items: question.sequence_items?.map(([id, label]) => ({ id, label })),
		accepted_answers: question.accepted_answers,
		explanation: question.explanation
	};
}

async function writeJson(path, value) {
	await writeFile(resolve(outDir, path), `${JSON.stringify(value, null, 2)}\n`);
}

async function writeJsonl(path, rows) {
	await writeFile(resolve(outDir, path), `${rows.map((row) => JSON.stringify(row)).join('\n')}\n`);
}

await mkdir(outDir, { recursive: true });

await writeJson('manifest.json', {
	run_id: runId,
	title: 'California Driving Test v1',
	schema_version: schemaVersion,
	authoring_mode: 'generated',
	subject_area_id: subjectId,
	topic_area_id: topicId,
	source_refs: sourceRefs,
	artifacts: {
		subject_areas: 'subject-areas.jsonl',
		topic_areas: 'topic-areas.jsonl',
		skills: 'skills.jsonl',
		lessons: 'lessons.jsonl',
		quizzes: 'quizzes.jsonl',
		questions: 'questions.jsonl',
		quiz_question_links: 'quiz-question-links.jsonl',
		learning_paths: 'learning-paths.jsonl',
		releases: 'releases.jsonl',
		topic_discovery_metadata: 'topic-discovery-metadata.jsonl',
		media_assets: 'media-assets.jsonl'
	}
});

await writeJsonl('subject-areas.jsonl', [
	{
		...sourceVersionBase(subjectId),
		slug: 'exam-prep',
		name: 'Exam Prep',
		summary: 'Focused practice for practical written exams.'
	}
]);
await writeJsonl('topic-areas.jsonl', [
	{
		...sourceVersionBase(topicId),
		subject_area_id: subjectId,
		slug: 'california-driving-test',
		name: 'California Driving Test',
		summary: 'Practice common decisions from the California driving written test.'
	}
]);
await writeJsonl(
	'skills.jsonl',
	skills.map(([id, slug, name, summary]) => ({
		...sourceVersionBase(id),
		topic_area_id: topicId,
		slug,
		name,
		device: name,
		summary
	}))
);
await writeJsonl(
	'lessons.jsonl',
	lessons.map((lesson, index) => ({
		...sourceVersionBase(lesson.id),
		topic_area_id: topicId,
		slug: lesson.slug,
		title: lesson.title,
		summary: lesson.summary,
		body_markdown: lesson.body_markdown,
		skill_ids: lesson.skill_ids,
		estimated_minutes: lesson.estimated_minutes,
		sort_order: index + 1
	}))
);
await writeJsonl(
	'quizzes.jsonl',
	quizzes.map((quiz) => ({
		...sourceVersionBase(quiz.id),
		topic_area_id: topicId,
		slug: quiz.slug,
		title: quiz.title,
		description: quiz.description,
		kind: 'practice',
		question_count: quiz.questionIds.length
	}))
);
await writeJsonl('questions.jsonl', questions.map(questionRecord));
await writeJsonl(
	'quiz-question-links.jsonl',
	quizzes.flatMap((quiz) =>
		quiz.questionIds.map((question_id, index) => ({
			quiz_id: quiz.id,
			quiz_version: 1,
			question_id,
			question_version: 1,
			ordering: index + 1,
			weight: 1
		}))
	)
);
await writeJsonl('learning-paths.jsonl', [
	{
		...sourceVersionBase(learningPath.id),
		topic_area_id: topicId,
		slug: learningPath.slug,
		title: learningPath.title,
		summary: learningPath.summary,
		items: learningPath.items.map(([item_type, item_id], index) => ({
			item_type,
			item_id,
			item_version: 1,
			ordering: index + 1,
			required: true
		}))
	}
]);

const releaseItems = [
	{ content_type: 'subject_area', content_id: subjectId, content_version: 1 },
	{ content_type: 'topic_area', content_id: topicId, content_version: 1 },
	...skills.map(([id]) => ({ content_type: 'skill', content_id: id, content_version: 1 })),
	...lessons.map((lesson) => ({ content_type: 'lesson', content_id: lesson.id, content_version: 1 })),
	...quizzes.map((quiz) => ({ content_type: 'quiz', content_id: quiz.id, content_version: 1 })),
	...questions.map((question) => ({ content_type: 'quiz_question', content_id: question.id, content_version: 1 })),
	{ content_type: 'learning_path', content_id: learningPath.id, content_version: 1 }
];
await writeJsonl('releases.jsonl', [
	{
		id: releaseId,
		slug: 'california-driving-test-v1',
		title: 'California Driving Test v1',
		scope_type: 'topic_area',
		scope_id: topicId,
		status: 'published',
		published_at: publishedAt,
		content_run_id: runId,
		bundle_key: `${topicId}:v1`,
		items: releaseItems,
		manifest: {
			review_status: 'approved',
			rollback: { action: 'retire_release', release_id: releaseId },
			staging: { imported_at: publishedAt, smoke_tested_at: publishedAt }
		}
	}
]);
await writeJsonl('topic-discovery-metadata.jsonl', [
	{
		topic_area_id: topicId,
		release_id: releaseId,
		slug: 'california-driving-test',
		name: 'California Driving Test',
		public_summary: 'Practice signs, right-of-way, spacing, and impairment decisions for the written test.',
		preview_markdown:
			'This topic uses realistic written-test prompts, including multi-select, sequencing, numeric, and short-answer practice.',
		app_path: '/app/topics/california-driving-test',
		level_label: 'Exam Prep',
		estimated_minutes: 28,
		lesson_count: lessons.length,
		quiz_count: quizzes.length,
		covered_skill_ids: skills.map(([id]) => id),
		covered_devices: skills.map(([, , name]) => name)
	}
]);
await writeJsonl('media-assets.jsonl', []);

console.log(`Wrote ${runId} to ${outDir}`);
