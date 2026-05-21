import type { QuizQuestionData } from '../../lib/components/quiz/types';

export const assessmentQuestions: QuizQuestionData[] = [
	{
		id: 'spacing',
		eyebrow: 'Learning science',
		question: 'Which strategy best strengthens long-term recall?',
		description: 'Choose the option most closely tied to retrieval practice.',
		response: {
			type: 'multiple-choice',
			correctValue: 'retrieval',
			options: [
				{
					value: 'retrieval',
					label: 'Retrieval practice',
					description: 'Trying to answer from memory before checking notes.'
				},
				{
					value: 'highlighting',
					label: 'Highlighting',
					description: 'Marking sentences while reading a chapter.'
				},
				{
					value: 'rereading',
					label: 'Rereading',
					description: 'Reading the same passage several times in a row.'
				}
			]
		}
	},
	{
		id: 'status-code',
		eyebrow: 'Web fundamentals',
		question: 'Which HTTP status code means a resource was not found?',
		response: {
			type: 'multiple-choice',
			correctValue: '404',
			options: [
				{ value: '200', label: '200 OK' },
				{ value: '301', label: '301 Moved Permanently' },
				{ value: '404', label: '404 Not Found' },
				{ value: '500', label: '500 Internal Server Error' }
			]
		}
	},
	{
		id: 'recall-strategies',
		eyebrow: 'Learning science',
		question: 'Which strategies usually improve long-term recall?',
		description: 'Select every strategy that applies.',
		response: {
			type: 'multiple-select',
			correctValues: ['retrieval', 'spacing'],
			options: [
				{
					value: 'retrieval',
					label: 'Retrieval practice',
					description: 'Answering from memory before checking the source.'
				},
				{
					value: 'spacing',
					label: 'Spaced repetition',
					description: 'Reviewing across sessions with time in between.'
				},
				{
					value: 'highlighting',
					label: 'Highlighting',
					description: 'Marking sentences while reading.'
				}
			]
		}
	},
	{
		id: 'force-unit',
		eyebrow: 'Physics',
		question: 'What SI unit is used to measure force?',
		description: 'Use the singular unit name.',
		response: {
			type: 'short-answer',
			placeholder: 'Type the unit',
			acceptedAnswers: ['newton', 'N'],
			matchMode: 'case-insensitive'
		}
	},
	{
		id: 'average-speed',
		eyebrow: 'Physics',
		question: 'A cyclist travels 1.2 kilometers in 4 minutes. What is their average speed?',
		description: 'Answer in meters per second.',
		response: {
			type: 'numeric',
			value: '',
			unit: 'm/s',
			placeholder: '0.0',
			unitConfig: {
				mode: 'fixed',
				side: 'right',
				value: 'm/s'
			},
			acceptedValues: [
				{
					value: 5,
					unit: 'm/s',
					tolerance: { type: 'relative', value: 0.01 }
				}
			]
		}
	}
];
