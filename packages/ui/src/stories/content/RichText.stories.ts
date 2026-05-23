import type { Meta, StoryObj } from '@storybook/sveltekit';
import RichText from '../../lib/components/quiz/RichText.svelte';

type RichTextStoryArgs = {
	content: string;
	class?: string;
};

const mathContent =
	String.raw`A cyclist travels $1200\text{ m}$ in $240\text{ s}$, so the average speed is:` +
	'\n\n' +
	String.raw`$$v = \frac{1200}{240} = 5\text{ m/s}$$`;

const meta = {
	title: 'Components/Content/RichText',
	component: RichText,
	tags: ['autodocs'],
	args: {
		content:
			'Use **retrieval practice** before rereading notes. A short attempt from memory makes the next review more useful.'
	}
} satisfies Meta<RichTextStoryArgs>;

export default meta;
type Story = StoryObj<RichTextStoryArgs>;

export const Markdown: Story = {};

export const Math: Story = {
	argTypes: {
		content: {
			table: {
				disable: true
			}
		}
	},
	render: () => ({
		Component: RichText,
		props: {
			content: mathContent
		}
	})
};

export const ListsAndCode: Story = {
	args: {
		content:
			'When estimating a result:\n\n1. Write the known quantities.\n2. Choose the matching formula.\n3. Check the unit conversion.\n\n`distance / time` should produce a speed.'
	}
};

export const Table: Story = {
	args: {
		content:
			'| Unit | Meaning | Equivalent |\n' +
			'| --- | --- | --- |\n' +
			'| m/s | meters per second | base speed unit |\n' +
			'| km/h | kilometers per hour | 1 km/h = 0.278 m/s |'
	}
};
