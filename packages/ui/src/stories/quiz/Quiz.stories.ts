import type { Meta, StoryObj } from '@storybook/sveltekit';
import Quiz from '../../lib/components/quiz/Quiz.svelte';
import { assessmentQuestions } from './assessmentQuestions';

const meta = {
	title: 'Components/Quiz/Quiz',
	component: Quiz,
	tags: ['autodocs'],
	args: {
		title: 'Retention check',
		questions: assessmentQuestions,
		questionsPerPage: 1
	},
	argTypes: {
		questionsPerPage: {
			control: 'number'
		}
	}
} satisfies Meta<typeof Quiz>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OneQuestionPerPage: Story = {};

export const TwoQuestionsPerPage: Story = {
	args: {
		questionsPerPage: 2
	}
};

export const CustomPages: Story = {
	args: {
		pages: [['spacing', 'status-code'], ['recall-strategies'], ['force-unit', 'average-speed']]
	}
};
