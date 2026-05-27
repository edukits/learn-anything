import assert from 'node:assert/strict';
import test from 'node:test';
import { JsonReadError } from '../src/utils.mjs';
import {
	parseLessonMarkdown,
	schemaForItemType,
	validateItemForContext,
	validateSyllabusForModule,
	validateWithSchema
} from '../src/schemas.mjs';

const skill = {
	slug: 'inverse-operations',
	name: 'Inverse Operations',
	device: 'Inverse Operations',
	summary: 'Undo operations to solve.'
};

const context = {
	itemType: 'quiz',
	syllabusItem: {
		type: 'quiz',
		module_slug: 'basics',
		focus: 'Equation checks',
		goals: 'Check equations',
		question_count: 1,
		skills: [skill]
	},
	module: { slug: 'basics' },
	moduleSyllabus: { syllabus: [] }
};

test('parseLessonMarkdown parses YAML frontmatter and Markdown body', () => {
	const lesson = parseLessonMarkdown(
		[
			'---',
			'title: Use Inverse Operations',
			'summary: Undo operations to solve.',
			'estimated_minutes: 5',
			'skill_slugs:',
			'  - inverse-operations',
			'---',
			'',
			'# Use Inverse Operations',
			'',
			'Undo addition before multiplication.'
		].join('\n')
	);

	assert.equal(lesson.type, 'lesson');
	assert.equal(lesson.title, 'Use Inverse Operations');
	assert.deepEqual(lesson.skill_slugs, ['inverse-operations']);
	assert.match(lesson.body_markdown, /Undo addition/);
});

test('parseLessonMarkdown rejects missing frontmatter, unknown fields, and empty bodies', () => {
	assert.throws(() => parseLessonMarkdown('# Missing'), JsonReadError);
	assert.throws(
		() =>
			parseLessonMarkdown(
				[
					'---',
					'title: Lesson',
					'summary: Summary.',
					'estimated_minutes: 5',
					'skill_slugs:',
					'  - inverse-operations',
					'slug: model-authored-slug',
					'---',
					'',
					'# Body'
				].join('\n')
			),
		JsonReadError
	);
	assert.throws(
		() =>
			parseLessonMarkdown(
				[
					'---',
					'title: Lesson',
					'summary: Summary.',
					'estimated_minutes: 5',
					'skill_slugs:',
					'  - inverse-operations',
					'---',
					''
				].join('\n')
			),
		JsonReadError
	);
});

test('simplified quiz schema validates and context catches bad references', () => {
	const quiz = {
		title: 'Equation Checks',
		description: 'Check equations.',
		questions: [
			{
				skill_slug: 'inverse-operations',
				question_purpose: 'application',
				response_type: 'multiple_choice',
				difficulty: 'easy',
				prompt: 'Solve `x + 3 = 7`.',
				choices: ['x = 4', 'x = 10'],
				correct_index: 0,
				explanation: 'Subtract 3 from both sides.'
			}
		]
	};

	const schemaResult = validateWithSchema(schemaForItemType('quiz'))(quiz);
	assert.equal(schemaResult.success, true);
	assert.equal(schemaResult.data.type, 'quiz');

	const contextResult = validateItemForContext(context)(quiz);
	assert.equal(contextResult.success, true);
});

test('simplified quiz schema rejects invalid answer indexes and duplicate multi-select indexes', () => {
	const invalidChoice = validateWithSchema(schemaForItemType('quiz'))({
		title: 'Equation Checks',
		description: 'Check equations.',
		questions: [
			{
				skill_slug: 'inverse-operations',
				question_purpose: 'application',
				response_type: 'multiple_choice',
				difficulty: 'easy',
				prompt: 'Solve `x + 3 = 7`.',
				choices: ['x = 4', 'x = 10'],
				correct_index: 2,
				explanation: 'Subtract 3 from both sides.'
			}
		]
	});
	assert.equal(invalidChoice.success, false);

	const duplicateSelect = validateWithSchema(schemaForItemType('quiz'))({
		title: 'Equation Checks',
		description: 'Check equations.',
		questions: [
			{
				skill_slug: 'inverse-operations',
				question_purpose: 'application',
				response_type: 'multiple_select',
				difficulty: 'medium',
				prompt: 'Select equations solved by x = 4.',
				choices: ['x + 3 = 7', 'x + 2 = 8', 'x - 1 = 3'],
				correct_indices: [0, 0],
				explanation: 'Substitute 4 into each equation.'
			}
		]
	});
	assert.equal(duplicateSelect.success, false);
});

test('context validation rejects unknown skill slugs and question count mismatch', () => {
	const quiz = {
		title: 'Equation Checks',
		description: 'Check equations.',
		questions: [
			{
				skill_slug: 'unknown-skill',
				question_purpose: 'application',
				response_type: 'multiple_choice',
				difficulty: 'easy',
				prompt: 'Solve `x + 3 = 7`.',
				choices: ['x = 4', 'x = 10'],
				correct_index: 0,
				explanation: 'Subtract 3 from both sides.'
			},
			{
				skill_slug: 'inverse-operations',
				question_purpose: 'application',
				response_type: 'numeric',
				difficulty: 'easy',
				prompt: 'Solve `x + 3 = 7`.',
				correct_numeric_answer: { value: 4, tolerance: 0 },
				explanation: 'Subtract 3 from both sides.'
			}
		]
	};

	const result = validateItemForContext(context)(quiz);
	assert.equal(result.success, false);
	assert.match(result.error, /Unknown skill_slug unknown-skill/);
	assert.match(result.error, /Expected 1 questions, received 2/);
});

test('module syllabus validation requires the expected module slug', () => {
	const result = validateSyllabusForModule({ slug: 'basics' })({
		summary: 'Bad module slug.',
		syllabus: [
			{
				type: 'lesson',
				module_slug: 'other',
				focus: 'Balance equations',
				goals: 'Balance equations',
				skills: [skill]
			}
		]
	});

	assert.equal(result.success, false);
	assert.match(result.error, /must be basics/);
});
