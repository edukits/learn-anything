import { z } from 'zod';

export type SubmittedAnswer = {
	questionId: string;
	selectedChoiceId: string;
	answerValue: unknown;
	responseTimeMs?: number;
};

export type ParsedSubmission =
	| {
			success: true;
			answers: SubmittedAnswer[];
			submissionKey: string;
	  }
	| {
			success: false;
			status: 400;
			error: string;
	  };

const submittedAnswerSchema = z.object({
	questionId: z.string().min(1),
	selectedChoiceId: z.string(),
	answerValue: z.unknown().optional().default(null),
	responseTimeMs: z.number().int().nonnegative().max(3_600_000).optional().default(0)
});

const submittedAnswersSchema = z.array(submittedAnswerSchema);

export function parseSubmittedAnswers(formData: FormData): ParsedSubmission {
	const answersRaw = String(formData.get('answers') ?? '[]');
	let answersJson: unknown;

	try {
		answersJson = JSON.parse(answersRaw);
	} catch {
		return {
			success: false,
			status: 400,
			error: 'Submitted answers were not valid JSON.'
		};
	}

	const parsed = submittedAnswersSchema.safeParse(answersJson);
	if (!parsed.success) {
		return {
			success: false,
			status: 400,
			error: 'Submitted answers were not valid.'
		};
	}

	return {
		success: true,
		answers: parsed.data,
		submissionKey: String(formData.get('submissionKey') ?? '')
	};
}
