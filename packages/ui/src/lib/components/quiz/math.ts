import type {
	MathAnswerAcceptedValue,
	MathAnswerEvaluation,
	MathAnswerMatchMode,
	MathAnswerSubmitResult,
	MathAnswerValue
} from './types';

export function normalizeLatex(value: string) {
	return value
		.trim()
		.replace(/\\left\s*/g, '')
		.replace(/\\right\s*/g, '')
		.replace(/\\,/g, '')
		.replace(/\s+/g, '');
}

export function normalizePromptValues(prompts: Record<string, string>) {
	return Object.fromEntries(
		Object.entries(prompts).map(([id, value]) => [id, normalizeLatex(value)])
	);
}

export function getMathPromptIds(latex: string | undefined) {
	if (!latex) {
		return [];
	}

	return Array.from(latex.matchAll(/\\placeholder\[([^\]]+)\]/g), (match) => match[1]).filter(
		(id): id is string => Boolean(id)
	);
}

export function buildEmptyMathPrompts(latex: string | undefined) {
	return Object.fromEntries(getMathPromptIds(latex).map((promptId) => [promptId, '']));
}

export function coerceMathEvaluation(
	evaluation: MathAnswerEvaluation
): Pick<MathAnswerSubmitResult, 'correct' | 'feedback'> {
	if (typeof evaluation === 'object' && evaluation !== null) {
		return {
			correct: evaluation.correct,
			feedback: evaluation.feedback
		};
	}

	return { correct: evaluation };
}

export function buildMathSubmitResult(
	answer: MathAnswerValue,
	evaluation: Pick<MathAnswerSubmitResult, 'correct' | 'feedback'>
): MathAnswerSubmitResult {
	return {
		...answer,
		...evaluation
	};
}

export function isMathAnswered(answer: MathAnswerValue) {
	const promptValues = Object.values(answer.prompts);

	if (promptValues.length > 0) {
		return promptValues.every((promptValue) => normalizeLatex(promptValue).length > 0);
	}

	return normalizeLatex(answer.latex).length > 0;
}

export function gradeMathAnswer(
	answer: MathAnswerValue,
	acceptedValues: MathAnswerAcceptedValue[] | null,
	defaultMatchMode: MathAnswerMatchMode = 'normalized'
): Pick<MathAnswerSubmitResult, 'correct' | 'feedback'> {
	if (acceptedValues === null || acceptedValues.length === 0) {
		return { correct: null };
	}

	for (const acceptedValue of acceptedValues) {
		const matchMode = acceptedValue.matchMode ?? defaultMatchMode;

		if (
			latexMatches(answer.latex, acceptedValue.latex, matchMode) &&
			promptsMatch(answer.prompts, acceptedValue.prompts, matchMode)
		) {
			return { correct: true, feedback: acceptedValue.feedback };
		}
	}

	return { correct: false };
}

function latexMatches(answer: string, accepted: string | undefined, matchMode: MathAnswerMatchMode) {
	if (accepted === undefined) {
		return true;
	}

	return getComparableLatex(answer, matchMode) === getComparableLatex(accepted, matchMode);
}

function promptsMatch(
	answerPrompts: Record<string, string>,
	acceptedPrompts: Record<string, string> | undefined,
	matchMode: MathAnswerMatchMode
) {
	if (acceptedPrompts === undefined) {
		return true;
	}

	return Object.entries(acceptedPrompts).every(
		([id, acceptedValue]) =>
			getComparableLatex(answerPrompts[id] ?? '', matchMode) ===
			getComparableLatex(acceptedValue, matchMode)
	);
}

function getComparableLatex(value: string, matchMode: MathAnswerMatchMode) {
	return matchMode === 'exact' ? value : normalizeLatex(value);
}
