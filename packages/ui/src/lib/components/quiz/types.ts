export type MultipleChoiceOptionState = 'neutral' | 'correct' | 'incorrect';

export type MultipleChoiceOptionData = {
	value: string;
	label?: string;
	description?: string;
	disabled?: boolean;
	state?: MultipleChoiceOptionState;
};
