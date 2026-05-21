import type { Meta, StoryObj } from '@storybook/sveltekit';
import ShortAnswer from '../../lib/components/quiz/ShortAnswer.svelte';

const meta = {
	title: 'Components/Quiz/ShortAnswer',
	component: ShortAnswer,
	tags: ['autodocs'],
	args: {
		value: '',
		name: 'force-unit',
		label: 'What unit is used to measure force?',
		placeholder: 'Type the unit',
		acceptedAnswers: ['newton', 'N'],
		matchMode: 'case-insensitive',
		showSubmitButton: true,
		submitted: false
	},
	argTypes: {
		value: {
			control: 'text'
		},
		matchMode: {
			control: 'inline-radio',
			options: ['exact', 'case-insensitive', 'normalized', 'contains']
		},
		disabled: {
			control: 'boolean'
		},
		submitted: {
			control: 'boolean'
		},
		showSubmitButton: {
			control: 'boolean'
		}
	}
} satisfies Meta<typeof ShortAnswer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ReviewedCorrect: Story = {
	args: {
		value: 'Newton',
		submitted: true
	}
};

export const ReviewedIncorrect: Story = {
	args: {
		value: 'joule',
		submitted: true
	}
};

export const CustomGrader: Story = {
	args: {
		value: 'The mitochondria produces ATP',
		label: 'What does the mitochondria do?',
		placeholder: 'One short sentence',
		acceptedAnswers: null,
		grader: (value) => {
			const normalizedValue = value.toLocaleLowerCase();

			if (normalizedValue.includes('atp') || normalizedValue.includes('energy')) {
				return {
					correct: true,
					feedback: 'Accepted because it mentions the key idea.'
				};
			}

			return {
				correct: false,
				feedback: 'Look for the main output of cellular respiration.'
			};
		}
	}
};

export const Ungraded: Story = {
	args: {
		value: '',
		acceptedAnswers: null,
		placeholder: 'Reflection answer',
		label: 'What is one idea you want to revisit?'
	}
};

export const Disabled: Story = {
	args: {
		disabled: true
	}
};
