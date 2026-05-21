import type {
	MathAnswerAcceptedValue,
	MathAnswerEvaluation,
	MathAnswerMatchMode,
	MathAnswerValue,
	MultipleChoiceInteractionMode,
	MultipleChoiceOptionData,
	NumericAnswerAcceptedValue,
	NumericAnswerEvaluation,
	NumericAnswerValue,
	NumericUnitConfig,
	SequencingItemData,
	ShortAnswerEvaluation,
	ShortAnswerMatchMode
} from '../../lib/components/quiz/types';

export type MultipleChoiceQuestionResponse = {
	type?: 'multiple-choice';
	options: MultipleChoiceOptionData[];
	value?: string | null;
	correctValue?: string | null;
	interactionMode?: MultipleChoiceInteractionMode;
	celebrations?: boolean;
};

export type MultipleSelectQuestionResponse = {
	type: 'multiple-select';
	options: MultipleChoiceOptionData[];
	value?: string[];
	correctValues?: string[] | null;
	celebrations?: boolean;
};

export type ShortAnswerQuestionResponse = {
	type: 'short-answer';
	value?: string;
	placeholder?: string;
	acceptedAnswers?: string[] | null;
	matchMode?: ShortAnswerMatchMode;
	normalizer?: (value: string) => string;
	grader?: (value: string) => ShortAnswerEvaluation;
};

export type NumericAnswerQuestionResponse = {
	type: 'numeric';
	value?: string;
	unit?: string | null;
	unitConfig?: NumericUnitConfig;
	placeholder?: string;
	acceptedValues?: NumericAnswerAcceptedValue[] | null;
	grader?: (answer: NumericAnswerValue) => NumericAnswerEvaluation;
};

export type MathAnswerQuestionResponse = {
	type: 'math';
	value?: string;
	template?: string;
	placeholder?: string;
	mathPlaceholder?: string;
	acceptedValues?: MathAnswerAcceptedValue[] | null;
	matchMode?: MathAnswerMatchMode;
	grader?: (answer: MathAnswerValue) => MathAnswerEvaluation;
};

export type SequencingQuestionResponse = {
	type: 'sequencing';
	items: SequencingItemData[];
	value?: string[];
	correctOrder?: string[] | null;
};

export type QuestionResponse =
	| MultipleChoiceQuestionResponse
	| MultipleSelectQuestionResponse
	| MathAnswerQuestionResponse
	| NumericAnswerQuestionResponse
	| SequencingQuestionResponse
	| ShortAnswerQuestionResponse;
