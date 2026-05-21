export type MultipleChoiceInteractionMode = 'instant-submit' | 'submit';
export type MultipleChoiceOptionState = 'neutral' | 'correct' | 'incorrect';
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

export type MultipleChoiceOptionData = {
	value: string;
	label?: string;
	description?: string;
	disabled?: boolean;
	state?: MultipleChoiceOptionState;
};
