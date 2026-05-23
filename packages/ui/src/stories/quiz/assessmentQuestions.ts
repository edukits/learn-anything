import type { QuizQuestionData } from '../../lib/components/quiz/types';

export const assessmentQuestions: QuizQuestionData[] = [
	{
		id: 'spacing',
		eyebrow: 'Learning science',
		question: 'Which strategy best strengthens long-term recall?',
		description: 'Choose the option most closely tied to retrieval practice.',
		feedback:
			'**Retrieval practice** works because the learner has to reconstruct the idea before reviewing it. That effort makes later recall stronger.',
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
					tolerance: { type: 'relative', value: 0.01 },
					feedback: String.raw`Convert first: $1.2\text{ km} = 1200\text{ m}$, then divide by $240\text{ s}$.`
				}
			]
		}
	},
	{
		id: 'procedure-order',
		eyebrow: 'Lab safety',
		question: 'Put the safe measurement procedure in order.',
		description: 'Drag the steps from first to last.',
		response: {
			type: 'sequencing',
			correctOrder: ['inspect', 'zero', 'measure', 'record'],
			items: [
				{ value: 'measure', label: 'Measure the sample' },
				{ value: 'record', label: 'Record the reading' },
				{ value: 'inspect', label: 'Inspect the instrument' },
				{ value: 'zero', label: 'Zero the scale' }
			]
		}
	},
	{
		id: 'vector-components',
		eyebrow: 'Linear algebra',
		question: 'Write the vector with horizontal component 3 and vertical component -2.',
		description: 'Fill in the locked vector template.',
		response: {
			type: 'math',
			value: '\\begin{bmatrix}\\placeholder[x]{}\\\\\\placeholder[y]{}\\end{bmatrix}',
			template: '\\begin{bmatrix}\\placeholder[x]{}\\\\\\placeholder[y]{}\\end{bmatrix}',
			acceptedValues: [
				{
					prompts: {
						x: '3',
						y: '-2'
					}
				}
			]
		}
	}
];
