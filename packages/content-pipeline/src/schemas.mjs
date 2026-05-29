import { parseDocument } from 'yaml';
import { z } from 'zod';
import { JsonReadError } from './utils.mjs';
import {
	interactionQuestionCount,
	validateLessonInteractionSidecar
} from './lesson-interactions.mjs';

const skillSchema = z
	.object({
		id: z.string().min(1).optional(),
		slug: z.string().min(1),
		name: z.string().min(1),
		device: z.string().min(1).optional(),
		summary: z.string().min(1).optional()
	})
	.strict();

const moduleSchema = z
	.object({
		id: z.string().min(1).optional(),
		slug: z.string().min(1),
		title: z.string().min(1),
		description: z.string().min(1),
		content_responsibility: z.string().min(1)
	})
	.strict();

export const modulePlanSchema = z
	.object({
		summary: z.string().min(1).optional(),
		modules: z.array(moduleSchema).min(1)
	})
	.strict();

export const syllabusItemSchema = z
	.object({
		type: z.enum(['lesson', 'quiz']),
		slug: z.string().min(1).optional(),
		module_slug: z.string().min(1).optional(),
		module_id: z.string().min(1).optional(),
		focus: z.string().min(1),
		goals: z.string().min(1),
		nonGoals: z.string().min(1).optional(),
		skills: z.array(skillSchema).optional(),
		question_count: z.number().int().positive().optional()
	})
	.strict();

export const syllabusSchema = z
	.object({
		summary: z.string().min(1).optional(),
		syllabus: z.array(syllabusItemSchema).min(1)
	})
	.strict();

const renderedMarkdownSchema = z
	.string()
	.min(1)
	.describe('Learner-facing Markdown text. Supports LaTeX math.');
const answerExplanationMarkdownSchema = z
	.string()
	.min(1)
	.describe('Answer explanation Markdown rendered after submission. Supports LaTeX math.');
const choiceOrderStrategySchema = z.enum(['shuffle', 'fixed']);
const mathMatchModeSchema = z.enum(['exact', 'normalized']);

const textChoiceAuthoringSchema = z.union([
	renderedMarkdownSchema,
	z
		.object({
			id: z.string().min(1).optional(),
			label: renderedMarkdownSchema
		})
		.strict()
]);

const imageChoiceAuthoringSchema = z
	.object({
		id: z.string().min(1).optional(),
		label: renderedMarkdownSchema.optional(),
		image_src: z.string().min(1),
		image_alt: z.string().min(1)
	})
	.strict();

const numericAnswerSchema = z
	.object({
		value: z.number(),
		tolerance: z.number().nonnegative().default(0)
	})
	.strict();

const mathAcceptedAnswerSchema = z
	.object({
		latex: z.string().min(1).optional(),
		prompts: z
			.record(z.string().min(1), z.string().min(1))
			.refine((prompts) => Object.keys(prompts).length > 0, {
				message: 'prompts require at least one prompt'
			})
			.optional(),
		matchMode: mathMatchModeSchema.optional(),
		feedback: answerExplanationMarkdownSchema.optional()
	})
	.strict()
	.superRefine((answer, context) => {
		if (!answer.latex && (!answer.prompts || Object.keys(answer.prompts).length === 0)) {
			context.addIssue({
				code: 'custom',
				message: 'accepted_math_answers require latex or at least one prompt'
			});
		}
	});

const lessonFrontmatterSchema = z
	.object({
		title: z.string().min(1),
		summary: z.string().min(1),
		estimated_minutes: z.number().int().positive(),
		skill_slugs: z.array(z.string().min(1)).min(1)
	})
	.strict();

const lessonAuthoringSchema = lessonFrontmatterSchema
	.extend({
		type: z.literal('lesson'),
		body_markdown: z.string().min(1),
		render_blocks: z
			.array(
				z.discriminatedUnion('type', [
					z.object({ type: z.literal('markdown'), markdown: z.string().min(1) }).strict(),
					z
						.object({
							type: z.literal('interaction'),
							slug: z.string().min(1),
							interaction_type: z.enum(['concept_check', 'scenario_choice', 'mini_practice'])
						})
						.strict()
				])
			)
			.optional(),
		interactions: z.array(z.unknown()).optional()
	})
	.strict();

const baseQuestionSchema = z.object({
	skill_slug: z.string().min(1),
	question_purpose: z.enum(['recognition', 'application']),
	response_type: z.enum([
		'multiple_choice',
		'multiple_select',
		'numeric',
		'sequencing',
		'short_answer',
		'math',
		'image_choice'
	]),
	difficulty: z.enum(['easy', 'medium', 'hard']),
	prompt: renderedMarkdownSchema,
	explanation: answerExplanationMarkdownSchema,
	grading_rubric: z.string().min(1).optional()
});

const multipleChoiceQuestionSchema = baseQuestionSchema
	.extend({
		response_type: z.literal('multiple_choice'),
		choices: z.array(textChoiceAuthoringSchema).min(2),
		correct_index: z.number().int().nonnegative(),
		choice_order_strategy: choiceOrderStrategySchema.optional(),
		fixed_choice_indices: z.array(z.number().int().nonnegative()).optional()
	})
	.strict();

const multipleSelectQuestionSchema = baseQuestionSchema
	.extend({
		response_type: z.literal('multiple_select'),
		choices: z.array(textChoiceAuthoringSchema).min(2),
		correct_indices: z.array(z.number().int().nonnegative()).min(2),
		choice_order_strategy: choiceOrderStrategySchema.optional(),
		fixed_choice_indices: z.array(z.number().int().nonnegative()).optional()
	})
	.strict();

const numericQuestionSchema = baseQuestionSchema
	.extend({
		response_type: z.literal('numeric'),
		correct_numeric_answer: numericAnswerSchema
	})
	.strict();

const sequencingQuestionSchema = baseQuestionSchema
	.extend({
		response_type: z.literal('sequencing'),
		sequence_items: z.array(renderedMarkdownSchema).min(2)
	})
	.strict();

const shortAnswerQuestionSchema = baseQuestionSchema
	.extend({
		response_type: z.literal('short_answer'),
		accepted_answers: z.array(z.string().min(1)).min(1)
	})
	.strict();

const mathQuestionSchema = baseQuestionSchema
	.extend({
		response_type: z.literal('math'),
		math_template: z.string().min(1).optional(),
		math_match_mode: mathMatchModeSchema.optional(),
		accepted_math_answers: z.array(mathAcceptedAnswerSchema).min(1)
	})
	.strict();

const imageChoiceQuestionSchema = baseQuestionSchema
	.extend({
		response_type: z.literal('image_choice'),
		choices: z.array(imageChoiceAuthoringSchema).min(2),
		correct_index: z.number().int().nonnegative(),
		choice_order_strategy: choiceOrderStrategySchema.optional(),
		fixed_choice_indices: z.array(z.number().int().nonnegative()).optional()
	})
	.strict();

const questionSchema = z
	.discriminatedUnion('response_type', [
		multipleChoiceQuestionSchema,
		multipleSelectQuestionSchema,
		numericQuestionSchema,
		sequencingQuestionSchema,
		shortAnswerQuestionSchema,
		mathQuestionSchema,
		imageChoiceQuestionSchema
	])
	.superRefine((question, context) => {
		if (
			(question.response_type === 'multiple_choice' || question.response_type === 'image_choice') &&
			question.correct_index >= question.choices.length
		) {
			context.addIssue({
				code: 'custom',
				message: `correct_index ${question.correct_index} is outside choices range`,
				path: ['correct_index']
			});
		}
		if (question.response_type === 'multiple_select') {
			const seen = new Set();
			for (const [index, correctIndex] of question.correct_indices.entries()) {
				if (correctIndex >= question.choices.length) {
					context.addIssue({
						code: 'custom',
						message: `correct_indices[${index}] ${correctIndex} is outside choices range`,
						path: ['correct_indices', index]
					});
				}
				if (seen.has(correctIndex)) {
					context.addIssue({
						code: 'custom',
						message: `correct_indices contains duplicate index ${correctIndex}`,
						path: ['correct_indices', index]
					});
				}
				seen.add(correctIndex);
			}
		}
		if (
			(question.response_type === 'multiple_choice' ||
				question.response_type === 'multiple_select' ||
				question.response_type === 'image_choice') &&
			question.fixed_choice_indices
		) {
			const seen = new Set();
			for (const [index, fixedIndex] of question.fixed_choice_indices.entries()) {
				if (fixedIndex >= question.choices.length) {
					context.addIssue({
						code: 'custom',
						message: `fixed_choice_indices[${index}] ${fixedIndex} is outside choices range`,
						path: ['fixed_choice_indices', index]
					});
				}
				if (seen.has(fixedIndex)) {
					context.addIssue({
						code: 'custom',
						message: `fixed_choice_indices contains duplicate index ${fixedIndex}`,
						path: ['fixed_choice_indices', index]
					});
				}
				seen.add(fixedIndex);
			}
		}
	});

const quizAuthoringSchema = z
	.object({
		title: z.string().min(1),
		description: z.string().min(1),
		questions: z.array(questionSchema).min(1)
	})
	.strict()
	.transform((quiz) => ({ type: 'quiz', kind: 'practice', ...quiz }));

const lessonInteractionSchema = z
	.object({
		slug: z.string().min(1),
		type: z.enum(['concept_check', 'scenario_choice', 'mini_practice']),
		questions: z.array(questionSchema).min(1)
	})
	.strict()
	.superRefine((interaction, context) => {
		const rule = interactionQuestionCount[interaction.type];
		if (
			rule &&
			(interaction.questions.length < rule.min || interaction.questions.length > rule.max)
		) {
			context.addIssue({
				code: 'custom',
				message: `${interaction.type} requires ${rule.min === rule.max ? rule.min : `${rule.min}-${rule.max}`} questions`,
				path: ['questions']
			});
		}
	});

export const lessonInteractionsAuthoringSchema = z
	.object({
		interactions: z.array(lessonInteractionSchema).min(1)
	})
	.strict();

const reviewedItemSchema = z.union([lessonAuthoringSchema, quizAuthoringSchema]);

export function formatSchemaError(error) {
	return z.prettifyError(error);
}

export function validateWithSchema(schema) {
	return (value) => {
		const parsed = schema.safeParse(value);
		if (parsed.success) {
			return { success: true, data: parsed.data };
		}
		return { success: false, error: formatSchemaError(parsed.error) };
	};
}

function extractFrontmatter(content, path) {
	const startMatch = content.match(/^---\r?\n/);
	if (!startMatch) {
		throw new JsonReadError(path, 'Lesson Markdown must start with YAML frontmatter.', 'parse');
	}
	const startLength = startMatch[0].length;
	const closeMatch = content.slice(startLength).match(/\r?\n---\r?\n/);
	if (!closeMatch?.index && closeMatch?.index !== 0) {
		throw new JsonReadError(path, 'Lesson Markdown is missing closing frontmatter fence.', 'parse');
	}
	const frontmatter = content.slice(startLength, startLength + closeMatch.index);
	const body = content.slice(startLength + closeMatch.index + closeMatch[0].length).trim();
	if (!body) {
		throw new JsonReadError(path, 'Lesson Markdown body is empty.', 'parse');
	}
	return { frontmatter, body };
}

export function parseLessonMarkdown(content, path = 'lesson.md') {
	const { frontmatter, body } = extractFrontmatter(content, path);
	const document = parseDocument(frontmatter);
	if (document.errors.length > 0) {
		throw new JsonReadError(
			path,
			document.errors.map((error) => error.message).join('\n'),
			'parse'
		);
	}
	const metadata = lessonFrontmatterSchema.safeParse(document.toJSON());
	if (!metadata.success) {
		throw new JsonReadError(path, formatSchemaError(metadata.error), 'parse');
	}
	return {
		type: 'lesson',
		...metadata.data,
		body_markdown: body
	};
}

export function parseLessonInteractionsJson(content, path = 'lesson-interactions.json') {
	try {
		return JSON.parse(content);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		throw new JsonReadError(path, message, 'parse', { cause: error });
	}
}

export function schemaForItemType(type) {
	if (type === 'lesson') {
		return lessonAuthoringSchema;
	}
	if (type === 'quiz') {
		return quizAuthoringSchema;
	}
	throw new Error(`Unknown item type ${type}`);
}

function collectSkillSlugs(...items) {
	const skillSlugs = new Set();
	for (const item of items.flat()) {
		for (const skill of item?.skills ?? []) {
			skillSlugs.add(skill.slug);
		}
	}
	return skillSlugs;
}

export function validateAuthoringItemContext({ itemType, syllabusItem, module, moduleSyllabus }) {
	return (value) => {
		const expectedModuleSlug = module?.slug;
		const failures = [];
		if (value.type !== itemType) {
			failures.push(`Expected item type ${itemType}, received ${value.type}.`);
		}
		if (
			expectedModuleSlug &&
			syllabusItem.module_slug &&
			syllabusItem.module_slug !== expectedModuleSlug
		) {
			failures.push(
				`Syllabus item module_slug ${syllabusItem.module_slug} does not match module ${expectedModuleSlug}.`
			);
		}
		const knownSkillSlugs = collectSkillSlugs(syllabusItem, moduleSyllabus?.syllabus ?? []);
		if (knownSkillSlugs.size === 0) {
			failures.push('No skill slugs were declared by the syllabus item or module syllabus.');
		}
		const usedSkillSlugs =
			value.type === 'lesson'
				? value.skill_slugs
				: value.questions.map((question) => question.skill_slug);
		for (const skillSlug of usedSkillSlugs) {
			if (!knownSkillSlugs.has(skillSlug)) {
				failures.push(
					`Unknown skill_slug ${skillSlug}. Use one of: ${[...knownSkillSlugs].toSorted().join(', ')}.`
				);
			}
		}
		if (
			value.type === 'quiz' &&
			syllabusItem.question_count !== undefined &&
			value.questions.length !== syllabusItem.question_count
		) {
			failures.push(
				`Expected ${syllabusItem.question_count} questions, received ${value.questions.length}.`
			);
		}
		if (failures.length > 0) {
			return { success: false, error: failures.join('\n') };
		}
		return { success: true, data: value };
	};
}

export function validateItemForContext(context) {
	const validateSchema = validateWithSchema(schemaForItemType(context.itemType));
	const validateContext = validateAuthoringItemContext(context);
	return (value) => {
		const schemaResult = validateSchema(value);
		if (!schemaResult.success) {
			return schemaResult;
		}
		return validateContext(schemaResult.data);
	};
}

export function validateLessonInteractionsForContext({ lesson, syllabusItem, moduleSyllabus }) {
	const validateSchema = validateWithSchema(lessonInteractionsAuthoringSchema);
	return (value) => {
		const schemaResult = validateSchema(value);
		if (!schemaResult.success) {
			return schemaResult;
		}

		const knownSkillSlugs = collectSkillSlugs(syllabusItem, moduleSyllabus?.syllabus ?? []);
		const failures = [];
		for (const interaction of schemaResult.data.interactions) {
			for (const question of interaction.questions) {
				if (!knownSkillSlugs.has(question.skill_slug)) {
					failures.push(
						`Unknown skill_slug ${question.skill_slug}. Use one of: ${[...knownSkillSlugs].toSorted().join(', ')}.`
					);
				}
			}
		}
		if (failures.length > 0) {
			return { success: false, error: failures.join('\n') };
		}

		return validateLessonInteractionSidecar({ lesson, sidecar: schemaResult.data });
	};
}

export const validateSyllabus = validateWithSchema(syllabusSchema);
export const validateModulePlan = validateWithSchema(modulePlanSchema);
export const validateReviewedItem = validateWithSchema(reviewedItemSchema);
export { lessonAuthoringSchema, quizAuthoringSchema };

export function validateSyllabusForModule(module) {
	return (value) => {
		const schemaResult = validateSyllabus(value);
		if (!schemaResult.success) {
			return schemaResult;
		}
		const failures = [];
		for (const [index, item] of schemaResult.data.syllabus.entries()) {
			if (item.module_slug !== module.slug) {
				failures.push(
					`syllabus[${index}].module_slug must be ${module.slug}, received ${item.module_slug ?? 'missing'}.`
				);
			}
		}
		if (failures.length > 0) {
			return { success: false, error: failures.join('\n') };
		}
		return schemaResult;
	};
}
