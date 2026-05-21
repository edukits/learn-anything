import type { Meta, StoryObj } from '@storybook/sveltekit';
import MathAnswer from '../../lib/components/quiz/MathAnswer.svelte';

const meta = {
	title: 'Components/Quiz/MathAnswer',
	component: MathAnswer,
	tags: ['autodocs'],
	args: {
		value: '',
		name: 'math-answer',
		label: 'Math answer',
		placeholder: 'Type an expression',
		showSubmitButton: true,
		submitted: false,
		acceptedValues: [
			{
				latex: 'x^2+3x+2',
				feedback: 'Equivalent formatting is normalized before comparing.'
			}
		]
	},
	argTypes: {
		value: {
			control: 'text'
		},
		matchMode: {
			control: 'inline-radio',
			options: ['exact', 'normalized']
		},
		disabled: {
			control: 'boolean'
		},
		submitted: {
			control: 'boolean'
		},
		showSubmitButton: {
			control: 'boolean'
		},
		mathPlaceholder: {
			control: 'text'
		}
	}
} satisfies Meta<typeof MathAnswer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AlgebraicExpression: Story = {};

export const ExponentialExpression: Story = {
	args: {
		label: 'Rewrite 8 as a power of 2.',
		placeholder: 'Type a power',
		acceptedValues: [{ latex: '2^3' }]
	}
};

export const MathPlaceholder: Story = {
	args: {
		label: 'Rewrite 8 as a power of 2.',
		placeholder: '',
		mathPlaceholder: '2^3',
		acceptedValues: [{ latex: '2^3' }]
	}
};

export const LockedVectorTemplate: Story = {
	args: {
		label: 'Enter the components of the vector from A to B.',
		value: '\\begin{bmatrix}\\placeholder[x]{}\\\\\\placeholder[y]{}\\end{bmatrix}',
		template: '\\begin{bmatrix}\\placeholder[x]{}\\\\\\placeholder[y]{}\\end{bmatrix}',
		acceptedValues: [
			{
				prompts: {
					x: '3',
					y: '-2'
				},
				feedback: 'Both vector components match.'
			}
		]
	}
};

export const CustomGrader: Story = {
	args: {
		label: 'Enter any quadratic with leading coefficient 1.',
		acceptedValues: null,
		grader: (answer) => {
			const normalized = answer.latex.replace(/\s+/g, '');

			if (/x\^2[+-]/.test(normalized)) {
				return {
					correct: true,
					feedback: 'Accepted by the custom quadratic grader.'
				};
			}

			return {
				correct: false,
				feedback: 'Look for an expression that starts with x squared.'
			};
		}
	}
};

export const Ungraded: Story = {
	args: {
		label: 'Show the first step you would take to simplify the expression.',
		acceptedValues: null
	}
};
