import type { Meta, StoryObj } from '@storybook/sveltekit';
import PathMap from '../lib/components/PathMap.svelte';
import type { PathMapItem } from '../lib/components/PathMap.svelte';

const literaryDevicesPath: PathMapItem[] = [
	{
		id: 'intro',
		title: 'Intro lesson',
		description: 'Read examples and learn how metaphor, simile, and imagery work in context.',
		meta: '8 min lesson',
		href: '#',
		state: 'active',
		kind: 'lesson'
	},
	{
		id: 'practice',
		title: 'Mixed practice',
		description: 'Answer a short set of recognition questions with immediate feedback.',
		meta: 'Complete intro lesson to unlock',
		state: 'locked',
		kind: 'quiz'
	}
];

const completePath: PathMapItem[] = [
	{
		id: 'intro',
		title: 'Intro lesson',
		meta: 'Completed',
		href: '#',
		state: 'complete',
		kind: 'lesson'
	},
	{
		id: 'practice',
		title: 'Mixed practice',
		meta: 'Best score 87%',
		href: '#',
		state: 'complete',
		kind: 'quiz'
	}
];

const multiStepPath: PathMapItem[] = [
	{
		id: 'foundations',
		title: 'Foundations',
		eyebrow: 'Lesson',
		meta: 'Completed',
		href: '#',
		state: 'complete',
		kind: 'lesson'
	},
	{
		id: 'recognition',
		title: 'Recognition drill',
		eyebrow: 'Practice',
		description: 'Identify the device before reading the explanation.',
		meta: 'In progress',
		href: '#',
		state: 'active',
		kind: 'practice'
	},
	{
		id: 'application',
		title: 'Apply it in a paragraph',
		eyebrow: 'Review',
		meta: '6 prompts',
		href: '#',
		state: 'available',
		kind: 'review'
	},
	{
		id: 'mastery',
		title: 'Mastery check',
		eyebrow: 'Quiz',
		meta: '15 questions',
		state: 'locked',
		kind: 'quiz'
	}
];

const compactPath: PathMapItem[] = [
	{ id: 'one', title: 'Warm-up', meta: 'Done', href: '#', state: 'complete', kind: 'lesson' },
	{ id: 'two', title: 'Core set', meta: 'Current', href: '#', state: 'active', kind: 'practice' },
	{ id: 'three', title: 'Error review', meta: 'Available', href: '#', kind: 'review' },
	{ id: 'four', title: 'Challenge', meta: 'Locked', state: 'locked', kind: 'milestone' }
];

const meta = {
	title: 'Components/PathMap',
	component: PathMap,
	tags: ['autodocs'],
	args: {
		items: literaryDevicesPath,
		ariaLabel: 'Literary Devices learning path',
		density: 'comfortable'
	},
	argTypes: {
		density: {
			control: 'inline-radio',
			options: ['comfortable', 'compact']
		}
	}
} satisfies Meta<typeof PathMap>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LockedNextStep: Story = {};

export const Completed: Story = {
	args: {
		items: completePath
	}
};

export const MultiStep: Story = {
	args: {
		items: multiStepPath
	}
};

export const DenseCompact: Story = {
	args: {
		items: compactPath,
		density: 'compact'
	}
};

export const LongCopy: Story = {
	args: {
		items: [
			{
				id: 'setup',
				title: 'Narrative perspective and voice setup',
				description:
					'Review how narrators frame a scene, signal distance from events, and reveal bias through word choice.',
				meta: '12 min lesson',
				href: '#',
				state: 'active',
				kind: 'lesson'
			},
			{
				id: 'comparison',
				title: 'Compare two very similar answer choices without rushing',
				description:
					'Practice eliminating distractors when both options seem plausible on the first read.',
				meta: '10 questions',
				href: '#',
				state: 'available',
				kind: 'practice'
			}
		]
	}
};
