import type {
	NumericAnswerAcceptedValue,
	NumericAnswerEvaluation,
	NumericAnswerPrecision,
	NumericAnswerSubmitResult,
	NumericAnswerValue,
	NumericUnitOption
} from './types';

const COMPLETE_NUMBER_PATTERN = /^[+-]?(?:(?:\d+\.?\d*)|(?:\.\d+))(?:e[+-]?\d+)?$/i;
const PARTIAL_NUMBER_PATTERN = /^[+-]?(?:(?:\d+\.?\d*)|(?:\.\d*)?)?(?:e[+-]?\d*)?$/i;

export function isPartialNumericInput(value: string) {
	return value === '' || PARTIAL_NUMBER_PATTERN.test(value.trim());
}

export function parseNumericInput(value: string) {
	const normalized = value.trim();

	if (!COMPLETE_NUMBER_PATTERN.test(normalized)) {
		return null;
	}

	const parsed = Number(normalized);
	return Number.isFinite(parsed) ? parsed : null;
}

export function getDecimalPlaces(value: string) {
	const [coefficient, exponent = '0'] = value.trim().toLowerCase().split('e');
	const decimalPlaces = coefficient.includes('.') ? (coefficient.split('.')[1]?.length ?? 0) : 0;

	return Math.max(0, decimalPlaces - Number(exponent));
}

export function getSignificantFigures(value: string) {
	const coefficient = value.trim().toLowerCase().split('e')[0] ?? '';
	const digits = coefficient.replace(/^[+-]/, '').replace('.', '');
	const significant = digits.replace(/^0+/, '');

	return significant.length;
}

export function normalizeNumericUnit(unit: string | null | undefined) {
	return unit?.trim().toLocaleLowerCase() ?? '';
}

function findUnitOption(unit: string | null | undefined, unitOptions: NumericUnitOption[]) {
	const normalizedUnit = normalizeNumericUnit(unit);

	return unitOptions.find((unitOption) => {
		const aliases = unitOption.aliases ?? [];

		return [unitOption.value, unitOption.label, ...aliases]
			.filter((candidate): candidate is string => Boolean(candidate))
			.some((candidate) => normalizeNumericUnit(candidate) === normalizedUnit);
	});
}

export function getUnitMultiplier(
	unit: string | null | undefined,
	unitOptions: NumericUnitOption[]
) {
	const option = findUnitOption(unit, unitOptions);
	return option?.multiplier ?? 1;
}

export function coerceNumericEvaluation(
	evaluation: NumericAnswerEvaluation
): Pick<NumericAnswerSubmitResult, 'correct' | 'feedback'> {
	if (typeof evaluation === 'object' && evaluation !== null) {
		return {
			correct: evaluation.correct,
			feedback: evaluation.feedback
		};
	}

	return { correct: evaluation };
}

export function buildNumericSubmitResult(
	answer: NumericAnswerValue,
	evaluation: Pick<NumericAnswerSubmitResult, 'correct' | 'feedback'>
): NumericAnswerSubmitResult {
	return {
		...answer,
		number: parseNumericInput(answer.value),
		...evaluation
	};
}

export function gradeNumericAnswer(
	answer: NumericAnswerValue,
	acceptedValues: NumericAnswerAcceptedValue[] | null,
	unitOptions: NumericUnitOption[] = []
): Pick<NumericAnswerSubmitResult, 'correct' | 'feedback'> {
	const parsedValue = parseNumericInput(answer.value);

	if (parsedValue === null) {
		return { correct: false };
	}

	if (acceptedValues === null || acceptedValues.length === 0) {
		return { correct: null };
	}

	const answerMultiplier = getUnitMultiplier(answer.unit, unitOptions);
	const comparableValue = parsedValue * answerMultiplier;

	for (const acceptedValue of acceptedValues) {
		const acceptedMultiplier = getUnitMultiplier(acceptedValue.unit, unitOptions);
		const targetValue = acceptedValue.value;
		const min =
			acceptedValue.min === undefined ? undefined : acceptedValue.min * acceptedMultiplier;
		const max =
			acceptedValue.max === undefined ? undefined : acceptedValue.max * acceptedMultiplier;

		if (
			unitMatches(answer.unit, acceptedValue.unit, unitOptions) &&
			valueMatches(comparableValue, targetValue, acceptedMultiplier, min, max, acceptedValue) &&
			precisionMatches(answer.value, acceptedValue.precision)
		) {
			return { correct: true, feedback: acceptedValue.feedback };
		}
	}

	return { correct: false };
}

function unitMatches(
	answerUnit: string | null | undefined,
	acceptedUnit: string | null | undefined,
	unitOptions: NumericUnitOption[]
) {
	if (acceptedUnit === undefined) {
		return true;
	}

	if (normalizeNumericUnit(answerUnit) === normalizeNumericUnit(acceptedUnit)) {
		return true;
	}

	return (
		findUnitOption(answerUnit, unitOptions) !== undefined &&
		findUnitOption(acceptedUnit, unitOptions) !== undefined
	);
}

function valueMatches(
	comparableValue: number,
	targetValue: number | undefined,
	acceptedMultiplier: number,
	min: number | undefined,
	max: number | undefined,
	acceptedValue: NumericAnswerAcceptedValue
) {
	if (min !== undefined || max !== undefined) {
		return (
			(min === undefined || comparableValue >= min) && (max === undefined || comparableValue <= max)
		);
	}

	if (targetValue === undefined) {
		return false;
	}

	const comparableTarget = targetValue * acceptedMultiplier;
	const tolerance = acceptedValue.tolerance;

	if (tolerance === undefined) {
		return comparableValue === comparableTarget;
	}

	const allowedError =
		tolerance.type === 'relative' ? Math.abs(comparableTarget) * tolerance.value : tolerance.value;

	return Math.abs(comparableValue - comparableTarget) <= allowedError;
}

function precisionMatches(
	value: string,
	precision: NumericAnswerPrecision | NumericAnswerPrecision[] | undefined
) {
	if (precision === undefined) {
		return true;
	}

	const precisionRules = Array.isArray(precision) ? precision : [precision];

	return precisionRules.every((precisionRule) => {
		const actualValue =
			precisionRule.type === 'decimal-places'
				? getDecimalPlaces(value)
				: getSignificantFigures(value);

		if (precisionRule.mode === 'at-least') {
			return actualValue >= precisionRule.value;
		}

		return actualValue === precisionRule.value;
	});
}
