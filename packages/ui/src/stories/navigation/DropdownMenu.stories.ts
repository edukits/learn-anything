import type { Meta, StoryObj } from '@storybook/sveltekit';
import DropdownMenuStory from './DropdownMenuStory.svelte';

const meta = {
	title: 'Components/Navigation/DropdownMenu',
	component: DropdownMenuStory,
	tags: ['autodocs'],
	args: {
		triggerLabel: 'Resources',
		triggerVariant: 'nav',
		align: 'start',
		minWidth: '260px',
		maxWidth: '',
		headerTitle: 'Learning resources',
		headerActionLabel: 'View all',
		headerActionHref: '#'
	},
	argTypes: {
		triggerVariant: {
			control: 'inline-radio',
			options: ['nav', 'icon']
		},
		align: {
			control: 'inline-radio',
			options: ['start', 'center', 'end']
		}
	}
} satisfies Meta<typeof DropdownMenuStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NavTrigger: Story = {};

export const IconTrigger: Story = {
	args: {
		triggerLabel: 'Account menu',
		triggerVariant: 'icon',
		align: 'end',
		minWidth: '220px',
		headerTitle: 'learner@example.com',
		headerActionLabel: '',
		headerActionHref: ''
	}
};

export const LongItems: Story = {
	args: {
		minWidth: '320px',
		items: [
			{
				label: 'Narrative perspective review',
				description:
					'Revisit examples that distinguish first person, third person limited, and omniscient narration.'
			},
			{
				label: 'Compare two very similar answer choices without rushing',
				description:
					'Practice eliminating distractors by finding the one word that changes the claim.'
			},
			{
				label: 'Mixed vocabulary and inference drill',
				description: 'Work through a dense set of short passages.'
			}
		]
	}
};
