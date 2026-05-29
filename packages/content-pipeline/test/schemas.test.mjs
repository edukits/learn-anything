import assert from 'node:assert/strict';
import test from 'node:test';
import { JsonReadError } from '../src/utils.mjs';
import {
	parseLessonMarkdown,
	schemaForItemType,
	validateItemForContext,
	validateLessonInteractionsForContext,
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

function questionFor(responseType, overrides = {}) {
	const base = {
		skill_slug: 'inverse-operations',
		question_purpose: 'application',
		response_type: responseType,
		difficulty: 'easy',
		prompt: 'Answer the question.',
		explanation: 'This checks inverse operations.',
		...overrides
	};

	if (responseType === 'multiple_choice') {
		return {
			...base,
			choices: ['Choice A', 'Choice B'],
			correct_index: 0
		};
	}
	if (responseType === 'multiple_select') {
		return {
			...base,
			choices: ['Choice A', 'Choice B', 'Choice C'],
			correct_indices: [0, 1]
		};
	}
	if (responseType === 'numeric') {
		return {
			...base,
			correct_numeric_answer: { value: 4, tolerance: 0 }
		};
	}
	if (responseType === 'sequencing') {
		return {
			...base,
			sequence_items: ['First', 'Second']
		};
	}
	if (responseType === 'short_answer') {
		return {
			...base,
			accepted_answers: ['answer']
		};
	}
	if (responseType === 'math') {
		return {
			...base,
			prompt: 'Factor $x^2 + 3x + 2$.',
			accepted_math_answers: [{ latex: '(x+1)(x+2)' }]
		};
	}
	if (responseType === 'image_choice') {
		return {
			...base,
			choices: [
				{ label: 'Triangle', image_src: '/images/triangle.png', image_alt: 'A triangle' },
				{ label: 'Square', image_src: '/images/square.png', image_alt: 'A square' }
			],
			correct_index: 0
		};
	}

	throw new Error(`Unsupported fixture response type ${responseType}`);
}

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

test('simplified quiz schema accepts every supported response type', () => {
	const responseTypes = [
		'multiple_choice',
		'multiple_select',
		'numeric',
		'sequencing',
		'short_answer',
		'math',
		'image_choice'
	];
	const quiz = {
		title: 'All Question Types',
		description: 'Exercise every supported question type.',
		questions: responseTypes.map((responseType) => questionFor(responseType))
	};

	const result = validateItemForContext({
		...context,
		syllabusItem: {
			...context.syllabusItem,
			question_count: responseTypes.length
		}
	})(quiz);

	assert.equal(result.success, true);
});

test('simplified quiz schema rejects empty math prompt accepted answers', () => {
	const quiz = {
		title: 'Math Prompt Guard',
		description: 'Reject empty prompt maps.',
		questions: [
			{
				...questionFor('math'),
				accepted_math_answers: [{ prompts: {} }]
			}
		]
	};

	const result = validateWithSchema(schemaForItemType('quiz'))(quiz);

	assert.equal(result.success, false);
	assert.match(result.error, /at least one prompt/);
});

test('simplified quiz schema accepts prompt-only math accepted answers with values', () => {
	const quiz = {
		title: 'Math Prompt Answers',
		description: 'Accept prompt maps with deterministic values.',
		questions: [
			{
				...questionFor('math'),
				accepted_math_answers: [{ prompts: { x: '3', y: '-2' } }]
			}
		]
	};

	const result = validateWithSchema(schemaForItemType('quiz'))(quiz);

	assert.equal(result.success, true);
});

test('lesson interaction schema accepts every supported response type', () => {
	const responseTypes = [
		'multiple_choice',
		'multiple_select',
		'numeric',
		'sequencing',
		'short_answer',
		'math',
		'image_choice'
	];
	const lesson = {
		type: 'lesson',
		title: 'Question Types',
		summary: 'Check all supported types.',
		estimated_minutes: 5,
		skill_slugs: ['inverse-operations'],
		body_markdown: responseTypes
			.map((responseType) => `::concept-check{slug="${responseType.replaceAll('_', '-')}"}`)
			.join('\n\n')
	};
	const sidecar = {
		interactions: responseTypes.map((responseType) => ({
			slug: responseType.replaceAll('_', '-'),
			type: 'concept_check',
			questions: [questionFor(responseType)]
		}))
	};

	const result = validateLessonInteractionsForContext({
		lesson,
		syllabusItem: context.syllabusItem,
		moduleSyllabus: context.moduleSyllabus
	})(sidecar);

	assert.equal(result.success, true);
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

test('simplified quiz schema validates choice ordering metadata', () => {
	const valid = validateWithSchema(schemaForItemType('quiz'))({
		title: 'Equation Checks',
		description: 'Check equations.',
		questions: [
			{
				skill_slug: 'inverse-operations',
				question_purpose: 'application',
				response_type: 'multiple_choice',
				difficulty: 'easy',
				prompt: 'Which statement is always true?',
				choices: ['Statement A', 'Statement B', 'All of the above'],
				correct_index: 2,
				choice_order_strategy: 'shuffle',
				fixed_choice_indices: [2],
				explanation: 'The summary choice stays last while other choices can shuffle.'
			}
		]
	});
	assert.equal(valid.success, true);

	const invalid = validateWithSchema(schemaForItemType('quiz'))({
		title: 'Equation Checks',
		description: 'Check equations.',
		questions: [
			{
				skill_slug: 'inverse-operations',
				question_purpose: 'application',
				response_type: 'multiple_choice',
				difficulty: 'easy',
				prompt: 'Which statement is always true?',
				choices: ['Statement A', 'Statement B'],
				correct_index: 1,
				fixed_choice_indices: [2],
				explanation: 'The fixed index is outside the choices array.'
			}
		]
	});
	assert.equal(invalid.success, false);
	assert.match(invalid.error, /fixed_choice_indices/);
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
