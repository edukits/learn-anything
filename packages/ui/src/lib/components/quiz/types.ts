export type MultipleChoiceInteractionMode = 'instant-submit' | 'submit';
export type MultipleChoiceOptionState = 'neutral' | 'correct' | 'incorrect';

export type MultipleChoiceSubmitResult = {
	value: string | null;
	correct: boolean | null;
};

export type MultipleSelectSubmitResult = {
	value: string[];
	correct: boolean | null;
};

export type MultipleChoiceOptionData = {
	value: string;
	label?: string;
	description?: string;
	disabled?: boolean;
	state?: MultipleChoiceOptionState;
};
