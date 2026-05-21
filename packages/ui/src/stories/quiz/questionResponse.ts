import type {
	MultipleChoiceInteractionMode,
	MultipleChoiceOptionData,
	ShortAnswerEvaluation,
	ShortAnswerMatchMode
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

export type ShortAnswerQuestionResponse = {
	type: 'short-answer';
	value?: string;
	placeholder?: string;
	acceptedAnswers?: string[] | null;
	matchMode?: ShortAnswerMatchMode;
	normalizer?: (value: string) => string;
	grader?: (value: string) => ShortAnswerEvaluation;
};

export type QuestionResponse =
	| MultipleChoiceQuestionResponse
	| MultipleSelectQuestionResponse
	| ShortAnswerQuestionResponse;
