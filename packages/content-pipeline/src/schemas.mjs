import { z } from 'zod';

const skillSchema = z
	.object({
		id: z.string().min(1).optional(),
		slug: z.string().min(1).optional(),
		name: z.string().min(1),
		device: z.string().min(1).optional(),
		summary: z.string().min(1).optional()
	})
	.passthrough();

export const syllabusItemSchema = z
	.object({
		type: z.enum(['lesson', 'quiz']),
		slug: z.string().min(1).optional(),
		focus: z.string().min(1),
		goals: z.string().min(1),
		nonGoals: z.string().min(1).optional(),
		skills: z.array(skillSchema).optional(),
		question_count: z.number().int().positive().optional()
	})
	.passthrough();

export const syllabusSchema = z
	.object({
		summary: z.string().min(1).optional(),
		syllabus: z.array(syllabusItemSchema).min(1)
	})
	.passthrough();

const lessonItemSchema = z
	.object({
		type: z.literal('lesson'),
		slug: z.string().min(1),
		title: z.string().min(1),
		summary: z.string().min(1),
		estimated_minutes: z.number().int().positive(),
		skills: z.array(skillSchema).min(1).optional(),
		skill_ids: z.array(z.string().min(1)).min(1).optional(),
		body_markdown: z.string().min(1)
	})
	.passthrough();

const choiceSchema = z
	.object({
		id: z.string().min(1),
		label: z.string().min(1)
	})
	.passthrough();

const numericAnswerSchema = z
	.object({
		value: z.number(),
		tolerance: z.number().nonnegative().default(0)
	})
	.passthrough();

const sequenceItemSchema = z
	.object({
		id: z.string().min(1),
		label: z.string().min(1)
	})
	.passthrough();

const questionSchema = z
	.object({
		skill: skillSchema.optional(),
		skill_id: z.string().min(1).optional(),
		device: z.string().min(1).optional(),
		question_purpose: z.enum(['recognition', 'application']),
		response_type: z.enum([
			'multiple_choice',
			'multiple_select',
			'numeric',
			'sequencing',
			'short_answer'
		]),
		difficulty: z.enum(['easy', 'medium', 'hard']),
		prompt: z.string().min(1),
		choices: z.array(choiceSchema).optional(),
		correct_choice_id: z.string().min(1).optional(),
		correct_choice_ids: z.array(z.string().min(1)).optional(),
		correct_numeric_answer: numericAnswerSchema.optional(),
		sequence_items: z.array(sequenceItemSchema).optional(),
		accepted_answers: z.array(z.string().min(1)).optional(),
		grading_rubric: z.string().min(1).optional(),
		explanation: z.string().min(1)
	})
	.passthrough()
	.superRefine((question, context) => {
		const choices = question.choices ?? [];
		const choiceIds = new Set(choices.map((choice) => choice.id));

		if (question.response_type === 'multiple_choice') {
			if (choices.length < 2) {
				context.addIssue({
					code: 'custom',
					message: 'multiple_choice responses require at least 2 choices',
					path: ['choices']
				});
			}
			if (!question.correct_choice_id) {
				context.addIssue({
					code: 'custom',
					message: 'multiple_choice responses require correct_choice_id',
					path: ['correct_choice_id']
				});
			} else if (!choiceIds.has(question.correct_choice_id)) {
				context.addIssue({
					code: 'custom',
					message: `correct_choice_id ${question.correct_choice_id} is not present in choices`,
					path: ['correct_choice_id']
				});
			}
			return;
		}

		if (question.response_type === 'multiple_select') {
			if (choices.length < 2) {
				context.addIssue({
					code: 'custom',
					message: 'multiple_select questions require at least 2 choices',
					path: ['choices']
				});
			}
			if ((question.correct_choice_ids ?? []).length < 2) {
				context.addIssue({
					code: 'custom',
					message: 'multiple_select questions require at least 2 correct_choice_ids',
					path: ['correct_choice_ids']
				});
			}
			for (const choiceId of question.correct_choice_ids ?? []) {
				if (!choiceIds.has(choiceId)) {
					context.addIssue({
						code: 'custom',
						message: `correct_choice_ids contains ${choiceId}, which is not present in choices`,
						path: ['correct_choice_ids']
					});
				}
			}
			return;
		}

		if (question.response_type === 'numeric' && !question.correct_numeric_answer) {
			context.addIssue({
				code: 'custom',
				message: 'numeric responses require correct_numeric_answer',
				path: ['correct_numeric_answer']
			});
		}

		if (question.response_type === 'sequencing' && (question.sequence_items ?? []).length < 2) {
			context.addIssue({
				code: 'custom',
				message: 'sequencing questions require at least 2 sequence_items',
				path: ['sequence_items']
			});
		}

		if (question.response_type === 'short_answer' && !question.accepted_answers?.length) {
			context.addIssue({
				code: 'custom',
				message: 'short_answer questions require accepted_answers for deterministic grading',
				path: ['accepted_answers']
			});
		}
	});

const quizItemSchema = z
	.object({
		type: z.literal('quiz'),
		slug: z.string().min(1),
		title: z.string().min(1),
		description: z.string().min(1),
		kind: z.enum(['practice', 'assessment']).default('practice'),
		skills: z.array(skillSchema).min(1).optional(),
		questions: z.array(questionSchema).min(1)
	})
	.passthrough();

const reviewedItemSchema = z.discriminatedUnion('type', [lessonItemSchema, quizItemSchema]);

export function schemaForItemType(type) {
	if (type === 'lesson') {
		return lessonItemSchema;
	}
	if (type === 'quiz') {
		return quizItemSchema;
	}
	throw new Error(`Unknown item type ${type}`);
}

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

export const validateSyllabus = validateWithSchema(syllabusSchema);
export const validateReviewedItem = validateWithSchema(reviewedItemSchema);
