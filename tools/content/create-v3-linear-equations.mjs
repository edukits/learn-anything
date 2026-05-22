#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const runId = 'run_2026_05_22_mathematics_linear_equations_v1';
const outDir = resolve('curriculum-artifacts/runs', runId);
const schemaVersion = 1;
const publishedAt = '2026-05-22T12:00:00.000Z';
const subjectId = 'subject_mathematics';
const topicId = 'topic_linear_equations';
const releaseId = 'release_mathematics_linear_equations_v1';
const sourceRefs = [
	{
		source_id: 'source_mathematics_linear_equations_v1',
		path: 'content-sources/mathematics/linear-equations/source.md',
		metadata_path: 'content-sources/mathematics/linear-equations/metadata.json'
	}
];

const skills = [
	{
		id: 'skill_equation_balance',
		slug: 'equation-balance',
		name: 'Equation Balance',
		summary: 'Keep both sides equal by applying the same operation to each side.'
	},
	{
		id: 'skill_inverse_operations',
		slug: 'inverse-operations',
		name: 'Inverse Operations',
		summary: 'Undo addition, subtraction, multiplication, and division to isolate the variable.'
	},
	{
		id: 'skill_simplify_then_solve',
		slug: 'simplify-then-solve',
		name: 'Simplify Then Solve',
		summary: 'Combine like terms and simplify expressions before isolating the variable.'
	}
];

const lessons = [
	{
		id: 'lesson_linear_equations_balance',
		slug: 'balance-equations',
		title: 'Keep Equations Balanced',
		summary: 'Learn why every solving move must preserve equality.',
		skill_ids: ['skill_equation_balance'],
		estimated_minutes: 5,
		body_markdown: `# Keep Equations Balanced

An equation says two expressions have the same value. The equal sign is a promise that the left side and right side match.

To solve an equation, keep that promise true. If you subtract 4 from one side, subtract 4 from the other side too. If you divide one side by 3, divide the other side by 3 too.

Example:

1. Start with \`x + 5 = 12\`.
2. Undo \`+ 5\` by subtracting 5 from both sides.
3. \`x = 7\`.

Check the answer by substituting it back: \`7 + 5 = 12\`, so \`x = 7\` works.`
	},
	{
		id: 'lesson_linear_equations_inverse_operations',
		slug: 'inverse-operations',
		title: 'Use Inverse Operations',
		summary: 'Undo one-step and two-step equations in a reliable order.',
		skill_ids: ['skill_equation_balance', 'skill_inverse_operations'],
		estimated_minutes: 6,
		body_markdown: `# Use Inverse Operations

Inverse operations undo each other:

- Addition and subtraction undo each other.
- Multiplication and division undo each other.

For a two-step equation, undo addition or subtraction first. Then undo multiplication or division.

Example:

1. Start with \`3x + 4 = 19\`.
2. Subtract 4 from both sides: \`3x = 15\`.
3. Divide both sides by 3: \`x = 5\`.

The goal is not to move symbols around randomly. The goal is to isolate the variable while keeping the equation true.`
	},
	{
		id: 'lesson_linear_equations_simplify',
		slug: 'simplify-then-solve',
		title: 'Simplify Before Solving',
		summary: 'Combine like terms first so the solving steps are clear.',
		skill_ids: ['skill_simplify_then_solve', 'skill_inverse_operations'],
		estimated_minutes: 7,
		body_markdown: `# Simplify Before Solving

Some equations have expressions that should be simplified before you solve.

Example:

1. Start with \`2x + x + 4 = 13\`.
2. Combine like terms: \`3x + 4 = 13\`.
3. Subtract 4 from both sides: \`3x = 9\`.
4. Divide both sides by 3: \`x = 3\`.

Simplifying first reduces the chance of skipping a term or undoing the wrong operation.`
	}
];

const quizzes = [
	{
		id: 'quiz_linear_equations_balance',
		slug: 'balance-equations',
		title: 'Balance Equations Check',
		description: 'Check whether solving moves preserve equality.',
		questionIds: [
			'question_linear_equations_balance_1',
			'question_linear_equations_balance_2',
			'question_linear_equations_balance_3',
			'question_linear_equations_balance_4'
		]
	},
	{
		id: 'quiz_linear_equations_inverse_operations',
		slug: 'inverse-operations',
		title: 'Inverse Operations Check',
		description: 'Solve one-step and two-step equations.',
		questionIds: [
			'question_linear_equations_inverse_1',
			'question_linear_equations_inverse_2',
			'question_linear_equations_inverse_3',
			'question_linear_equations_inverse_4'
		]
	},
	{
		id: 'quiz_linear_equations_simplify',
		slug: 'simplify-then-solve',
		title: 'Simplify Then Solve Check',
		description: 'Simplify equations before solving and checking solutions.',
		questionIds: [
			'question_linear_equations_simplify_1',
			'question_linear_equations_simplify_2',
			'question_linear_equations_simplify_3',
			'question_linear_equations_simplify_4'
		]
	}
];

const questionData = [
	[
		'question_linear_equations_balance_1',
		'skill_equation_balance',
		'recognition',
		'easy',
		'In `x + 6 = 14`, which operation keeps the equation balanced while starting to solve for `x`?',
		[
			['a', 'Subtract 6 from both sides.'],
			['b', 'Subtract 6 from only the left side.'],
			['c', 'Add 14 to both sides.'],
			['d', 'Divide only the right side by 6.']
		],
		'a',
		'Subtracting 6 from both sides undoes `+ 6` while preserving equality.'
	],
	[
		'question_linear_equations_balance_2',
		'skill_equation_balance',
		'application',
		'easy',
		'Solve `x - 9 = 4`.',
		[
			['a', 'x = -5'],
			['b', 'x = 13'],
			['c', 'x = 5'],
			['d', 'x = 36']
		],
		'b',
		'Add 9 to both sides: `x = 13`.'
	],
	[
		'question_linear_equations_balance_3',
		'skill_equation_balance',
		'recognition',
		'medium',
		'A student changes `2x = 18` to `x = 9`. What operation did the student apply to both sides?',
		[
			['a', 'Divide by 2.'],
			['b', 'Subtract 2.'],
			['c', 'Add 9.'],
			['d', 'Multiply by 18.']
		],
		'a',
		'Dividing both sides by 2 changes `2x` to `x` and `18` to `9`.'
	],
	[
		'question_linear_equations_balance_4',
		'skill_equation_balance',
		'application',
		'medium',
		'Which value makes `y + 8 = 20` true?',
		[
			['a', '8'],
			['b', '10'],
			['c', '12'],
			['d', '28']
		],
		'c',
		'Substitute `12`: `12 + 8 = 20`.'
	],
	[
		'question_linear_equations_inverse_1',
		'skill_inverse_operations',
		'application',
		'easy',
		'Solve `4x = 28`.',
		[
			['a', 'x = 4'],
			['b', 'x = 7'],
			['c', 'x = 24'],
			['d', 'x = 32']
		],
		'b',
		'Divide both sides by 4: `x = 7`.'
	],
	[
		'question_linear_equations_inverse_2',
		'skill_inverse_operations',
		'application',
		'medium',
		'Solve `3x + 5 = 20`.',
		[
			['a', 'x = 5'],
			['b', 'x = 8'],
			['c', 'x = 15'],
			['d', 'x = 25']
		],
		'a',
		'Subtract 5 from both sides, then divide by 3: `x = 5`.'
	],
	[
		'question_linear_equations_inverse_3',
		'skill_inverse_operations',
		'recognition',
		'medium',
		'For `5x - 6 = 24`, what should you undo first?',
		[
			['a', 'The multiplication by 5.'],
			['b', 'The subtraction of 6.'],
			['c', 'The variable x.'],
			['d', 'The equal sign.']
		],
		'b',
		'Undo addition or subtraction before undoing multiplication or division in a two-step equation.'
	],
	[
		'question_linear_equations_inverse_4',
		'skill_inverse_operations',
		'application',
		'hard',
		'Solve `2x - 7 = 11`.',
		[
			['a', 'x = 2'],
			['b', 'x = 7'],
			['c', 'x = 9'],
			['d', 'x = 18']
		],
		'c',
		'Add 7 to both sides to get `2x = 18`, then divide by 2 to get `x = 9`.'
	],
	[
		'question_linear_equations_simplify_1',
		'skill_simplify_then_solve',
		'recognition',
		'easy',
		'What is the simplified form of `2x + x + 4 = 13` before solving?',
		[
			['a', '2x + 4 = 13'],
			['b', '3x + 4 = 13'],
			['c', '3x = 17'],
			['d', 'x + 6 = 13']
		],
		'b',
		'Combine `2x` and `x` to get `3x`.'
	],
	[
		'question_linear_equations_simplify_2',
		'skill_simplify_then_solve',
		'application',
		'medium',
		'Solve `2x + x + 4 = 13`.',
		[
			['a', 'x = 3'],
			['b', 'x = 4'],
			['c', 'x = 9'],
			['d', 'x = 13']
		],
		'a',
		'Combine like terms to get `3x + 4 = 13`, then solve: `x = 3`.'
	],
	[
		'question_linear_equations_simplify_3',
		'skill_simplify_then_solve',
		'application',
		'medium',
		'Solve `6x - 2x = 20`.',
		[
			['a', 'x = 4'],
			['b', 'x = 5'],
			['c', 'x = 10'],
			['d', 'x = 20']
		],
		'b',
		'Combine like terms to get `4x = 20`, so `x = 5`.'
	],
	[
		'question_linear_equations_simplify_4',
		'skill_simplify_then_solve',
		'application',
		'hard',
		'Which value makes `4x + 3 - x = 18` true?',
		[
			['a', 'x = 3'],
			['b', 'x = 4'],
			['c', 'x = 5'],
			['d', 'x = 7']
		],
		'c',
		'Simplify to `3x + 3 = 18`, subtract 3, then divide by 3: `x = 5`.'
	]
];

function jsonl(rows) {
	return `${rows.map((row) => JSON.stringify(row)).join('\n')}\n`;
}

function versioned(row) {
	return {
		...row,
		version: 1,
		content_run_id: runId,
		schema_version: schemaVersion,
		source_refs: sourceRefs
	};
}

function choice([id, label]) {
	return { id, label };
}

function question([
	id,
	skill_id,
	question_type,
	difficulty,
	prompt,
	choices,
	correct_choice_id,
	explanation
]) {
	const skill = skills.find((candidate) => candidate.id === skill_id);
	return versioned({
		id,
		topic_area_id: topicId,
		skill_id,
		device: skill.name,
		question_type,
		difficulty,
		prompt,
		choices: choices.map(choice),
		correct_choice_id,
		explanation
	});
}

function releaseItem(content_type, content_id, content_version = 1) {
	return { content_type, content_id, content_version };
}

const artifacts = {
	subject_areas: [
		versioned({
			id: subjectId,
			slug: 'mathematics',
			name: 'Mathematics',
			summary: 'Foundational math topics for problem solving, algebra, and quantitative reasoning.'
		})
	],
	topic_areas: [
		versioned({
			id: topicId,
			subject_area_id: subjectId,
			slug: 'linear-equations',
			name: 'Linear Equations',
			summary:
				'Solve one-variable equations by preserving equality, using inverse operations, and simplifying first.'
		})
	],
	skills: skills.map((skill) =>
		versioned({
			...skill,
			topic_area_id: topicId,
			device: skill.name
		})
	),
	lessons: lessons.map((lesson, index) =>
		versioned({
			...lesson,
			topic_area_id: topicId,
			sort_order: index + 1
		})
	),
	quizzes: quizzes.map((quiz) =>
		versioned({
			id: quiz.id,
			topic_area_id: topicId,
			slug: quiz.slug,
			title: quiz.title,
			description: quiz.description,
			kind: 'practice',
			question_count: quiz.questionIds.length
		})
	),
	questions: questionData.map(question),
	quiz_question_links: quizzes.flatMap((quiz) =>
		quiz.questionIds.map((questionId, index) => ({
			quiz_id: quiz.id,
			quiz_version: 1,
			question_id: questionId,
			question_version: 1,
			ordering: index + 1,
			weight: 1
		}))
	),
	learning_paths: [
		versioned({
			id: 'learning_path_linear_equations',
			topic_area_id: topicId,
			slug: 'linear-equations-foundations',
			title: 'Linear Equations Foundations',
			summary: 'Move from balanced equations to two-step solving and simplification.',
			items: [
				releasePathItem('lesson', 'lesson_linear_equations_balance', 1),
				releasePathItem('quiz', 'quiz_linear_equations_balance', 2),
				releasePathItem('lesson', 'lesson_linear_equations_inverse_operations', 3),
				releasePathItem('quiz', 'quiz_linear_equations_inverse_operations', 4),
				releasePathItem('lesson', 'lesson_linear_equations_simplify', 5),
				releasePathItem('quiz', 'quiz_linear_equations_simplify', 6)
			]
		})
	],
	media_assets: []
};

function releasePathItem(item_type, item_id, ordering) {
	return {
		item_type,
		item_id,
		item_version: 1,
		ordering,
		required: true
	};
}

const releaseItems = [
	releaseItem('subject_area', subjectId),
	releaseItem('topic_area', topicId),
	...skills.map((skill) => releaseItem('skill', skill.id)),
	...lessons.map((lesson) => releaseItem('lesson', lesson.id)),
	...quizzes.map((quiz) => releaseItem('quiz', quiz.id)),
	...questionData.map(([id]) => releaseItem('quiz_question', id)),
	releaseItem('learning_path', 'learning_path_linear_equations')
];

artifacts.releases = [
	{
		id: releaseId,
		slug: 'mathematics-linear-equations-v1',
		title: 'Mathematics Linear Equations v1',
		scope_type: 'topic_area',
		scope_id: topicId,
		status: 'published',
		published_at: publishedAt,
		content_run_id: runId,
		bundle_key: 'mathematics/linear-equations/v1',
		items: releaseItems,
		manifest: {
			run_id: runId,
			topic: 'linear-equations',
			review_status: 'candidate-reviewed',
			rollback: {
				action:
					'set content_releases.status to retired for release_mathematics_linear_equations_v1',
				previous_release_id: null
			}
		}
	}
];

artifacts.topic_discovery_metadata = [
	{
		topic_area_id: topicId,
		release_id: releaseId,
		slug: 'linear-equations',
		name: 'Linear Equations',
		public_summary:
			'Build confidence solving one-variable equations with balanced moves, inverse operations, and simplifying like terms.',
		preview_markdown: `# Linear Equations

Linear Equations teaches the solving habits that make algebra predictable: preserve equality, undo operations in order, simplify first, and check the solution.

You will practice one-step equations, two-step equations, and equations that need like terms combined before solving.`,
		app_path: '/app/topics/linear-equations',
		level_label: 'Early Algebra',
		estimated_minutes: 36,
		lesson_count: lessons.length,
		quiz_count: quizzes.length,
		covered_skill_ids: skills.map((skill) => skill.id),
		covered_devices: skills.map((skill) => skill.name)
	}
];

const artifactFiles = {
	subject_areas: 'subject-areas.jsonl',
	topic_areas: 'topic-areas.jsonl',
	skills: 'skills.jsonl',
	lessons: 'lessons.jsonl',
	quizzes: 'quizzes.jsonl',
	questions: 'questions.jsonl',
	quiz_question_links: 'quiz-question-links.jsonl',
	learning_paths: 'learning-paths.jsonl',
	media_assets: 'media-assets.jsonl',
	releases: 'releases.jsonl',
	topic_discovery_metadata: 'topic-discovery-metadata.jsonl'
};

const schemaFiles = {
	subject_areas: '../../../../content-schemas/v1/subject-area.schema.json',
	topic_areas: '../../../../content-schemas/v1/topic-area.schema.json',
	skills: '../../../../content-schemas/v1/skill.schema.json',
	lessons: '../../../../content-schemas/v1/lesson.schema.json',
	quizzes: '../../../../content-schemas/v1/quiz.schema.json',
	questions: '../../../../content-schemas/v1/quiz-question.schema.json',
	quiz_question_links: '../../../../content-schemas/v1/quiz-question-link.schema.json',
	learning_paths: '../../../../content-schemas/v1/learning-path.schema.json',
	media_assets: '../../../../content-schemas/v1/media-asset.schema.json',
	releases: '../../../../content-schemas/v1/release.schema.json',
	topic_discovery_metadata: '../../../../content-schemas/v1/topic-discovery-metadata.schema.json'
};

await mkdir(outDir, { recursive: true });

for (const [artifactName, rows] of Object.entries(artifacts)) {
	await writeFile(resolve(outDir, artifactFiles[artifactName]), jsonl(rows));
}

await writeFile(
	resolve(outDir, 'manifest.json'),
	`${JSON.stringify(
		{
			run_id: runId,
			title: 'Mathematics Linear Equations v1',
			schema_version: schemaVersion,
			authoring_mode: 'generated',
			subject_area_id: subjectId,
			topic_area_id: topicId,
			source_refs: sourceRefs,
			artifacts: artifactFiles,
			schemas: schemaFiles
		},
		null,
		'\t'
	)}\n`
);

await writeFile(
	resolve(outDir, 'release-notes.md'),
	`# Mathematics Linear Equations v1

## Review Workflow

- Source: \`content-sources/mathematics/linear-equations/source.md\`
- Metadata: \`content-sources/mathematics/linear-equations/metadata.json\`
- Validation: \`node tools/content/validate-run.mjs curriculum-artifacts/runs/${runId}/manifest.json --base none\`
- Diff: \`node tools/content/diff-run.mjs curriculum-artifacts/runs/${runId}/manifest.json --base none\`

## Reviewer Checklist

- Lessons teach balanced equation moves, inverse operations, and simplification before solving.
- Questions have one unambiguous answer and explanations show the solving move.
- Public discovery copy matches the release contents.

## Rollback Procedure

This is the first release for \`topic_linear_equations\`. To roll it back, mark \`${releaseId}\` as \`retired\` in \`content_releases\`. Because no earlier Linear Equations release exists, public discovery should then no longer show the topic.
`
);

console.log(`Wrote ${runId} to ${outDir}`);
