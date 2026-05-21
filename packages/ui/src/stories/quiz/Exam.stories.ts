import type { Meta, StoryObj } from '@storybook/sveltekit';
import Exam from '../../lib/components/quiz/Exam.svelte';
import { assessmentQuestions } from './assessmentQuestions';

const meta = {
	title: 'Components/Quiz/Exam',
	component: Exam,
	tags: ['autodocs'],
	args: {
		title: 'Unit exam',
		questions: assessmentQuestions,
		questionsPerPage: 'all'
	},
	argTypes: {
		questionsPerPage: {
			control: 'select',
			options: ['all', 1, 2, 3]
		}
	}
} satisfies Meta<typeof Exam>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllQuestions: Story = {};

export const Paginated: Story = {
	args: {
		questionsPerPage: 2
	}
};

export const CustomPages: Story = {
	args: {
		pages: [
			['spacing', 'status-code', 'recall-strategies'],
			['force-unit', 'average-speed']
		]
	}
};
