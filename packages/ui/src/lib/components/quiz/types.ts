export type MultipleChoiceInteractionMode = 'instant-submit' | 'submit';
export type MultipleChoiceOptionState = 'neutral' | 'correct' | 'incorrect';
export type NumericAnswerToleranceType = 'absolute' | 'relative';
export type NumericAnswerPrecisionMode = 'exact' | 'at-least';
export type NumericAnswerPrecisionType = 'decimal-places' | 'significant-figures';
export type NumericUnitMode = 'fixed' | 'freeform' | 'none' | 'select';
export type NumericUnitSide = 'left' | 'right';
export type ShortAnswerMatchMode = 'exact' | 'case-insensitive' | 'normalized' | 'contains';

export type ShortAnswerEvaluation =
	| boolean
	| null
	| {
			correct: boolean | null;
			feedback?: string;
	  };

export type MultipleChoiceSubmitResult = {
	value: string | null;
	correct: boolean | null;
};

export type MultipleSelectSubmitResult = {
	value: string[];
	correct: boolean | null;
};

export type ShortAnswerSubmitResult = {
	value: string;
	correct: boolean | null;
	feedback?: string;
};

export type NumericAnswerValue = {
	value: string;
	unit?: string | null;
};

export type NumericAnswerEvaluation =
	| boolean
	| null
	| {
			correct: boolean | null;
			feedback?: string;
	  };

export type NumericAnswerTolerance = {
	type: NumericAnswerToleranceType;
	value: number;
};

export type NumericAnswerPrecision = {
	type: NumericAnswerPrecisionType;
	value: number;
	mode?: NumericAnswerPrecisionMode;
};

export type NumericAnswerAcceptedValue = {
	value?: number;
	min?: number;
	max?: number;
	unit?: string | null;
	tolerance?: NumericAnswerTolerance;
	precision?: NumericAnswerPrecision | NumericAnswerPrecision[];
	feedback?: string;
};

export type NumericUnitOption = {
	value: string;
	label?: string;
	disabled?: boolean;
	aliases?: string[];
	multiplier?: number;
};

export type NumericUnitConfig =
	| {
			mode?: 'none';
			side?: NumericUnitSide;
	  }
	| {
			mode: 'fixed';
			value: string;
			label?: string;
			side?: NumericUnitSide;
	  }
	| {
			mode: 'freeform';
			value?: string;
			placeholder?: string;
			side?: NumericUnitSide;
	  }
	| {
			mode: 'select';
			value?: string;
			options: NumericUnitOption[];
			placeholder?: string;
			side?: NumericUnitSide;
	  };

export type NumericAnswerSubmitResult = NumericAnswerValue & {
	number: number | null;
	correct: boolean | null;
	feedback?: string;
};

export type MultipleChoiceOptionData = {
	value: string;
	label?: string;
	description?: string;
	disabled?: boolean;
	state?: MultipleChoiceOptionState;
};

export type SequencingItemData = {
	value: string;
	label?: string;
	description?: string;
	disabled?: boolean;
};

export type SequencingSubmitResult = {
	value: string[];
	correct: boolean | null;
};

export type QuizQuestionResponse =
	| {
			type?: 'multiple-choice';
			options: MultipleChoiceOptionData[];
			value?: string | null;
			correctValue?: string | null;
			interactionMode?: MultipleChoiceInteractionMode;
			celebrations?: boolean;
	  }
	| {
			type: 'multiple-select';
			options: MultipleChoiceOptionData[];
			value?: string[];
			correctValues?: string[] | null;
			celebrations?: boolean;
	  }
	| {
			type: 'short-answer';
			value?: string;
			placeholder?: string;
			acceptedAnswers?: string[] | null;
			matchMode?: ShortAnswerMatchMode;
			normalizer?: (value: string) => string;
			grader?: (value: string) => ShortAnswerEvaluation;
	  }
	| {
			type: 'numeric';
			value?: string;
			unit?: string | null;
			unitConfig?: NumericUnitConfig;
			placeholder?: string;
			acceptedValues?: NumericAnswerAcceptedValue[] | null;
			grader?: (answer: NumericAnswerValue) => NumericAnswerEvaluation;
	  }
	| {
			type: 'sequencing';
			items: SequencingItemData[];
			value?: string[];
			correctOrder?: string[] | null;
	  };

export type QuizQuestionData = {
	id: string;
	eyebrow?: string;
	question: string;
	description?: string;
	response: QuizQuestionResponse;
};

export type QuizAnswerValue = string | string[] | NumericAnswerValue | null;

export type QuizQuestionResult = {
	questionId: string;
	value: QuizAnswerValue;
	correct: boolean | null;
	answered: boolean;
};

export type QuizPageLayout = string[][];
