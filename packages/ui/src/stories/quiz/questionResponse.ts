import type {
	MultipleChoiceInteractionMode,
	MultipleChoiceOptionData
} from '../../lib/components/quiz/types';

export type MultipleChoiceQuestionResponse = {
	type?: 'multiple-choice';
	options: MultipleChoiceOptionData[];
	value?: string | null;
	correctValue?: string | null;
	interactionMode?: MultipleChoiceInteractionMode;
};

export type MultipleSelectQuestionResponse = {
	type: 'multiple-select';
	options: MultipleChoiceOptionData[];
	value?: string[];
	correctValues?: string[] | null;
};

export type QuestionResponse = MultipleChoiceQuestionResponse | MultipleSelectQuestionResponse;
