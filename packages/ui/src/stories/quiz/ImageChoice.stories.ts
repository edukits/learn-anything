import type { Meta, StoryObj } from '@storybook/sveltekit';
import ImageChoice from '../../lib/components/quiz/ImageChoice.svelte';
import appleSrc from '../../lib/assets/foods/apple.png';
import bananaSrc from '../../lib/assets/foods/banana.png';
import butterSrc from '../../lib/assets/foods/butter.png';
import cheeseSrc from '../../lib/assets/foods/cheese.png';
import coffeeSrc from '../../lib/assets/foods/coffee.png';
import croissantSrc from '../../lib/assets/foods/croissant.png';
import grapesSrc from '../../lib/assets/foods/grapes.png';
import pearSrc from '../../lib/assets/foods/pear.png';
import type { ImageChoiceOptionData } from '../../lib/components/quiz/types';

const foodOptions: ImageChoiceOptionData[] = [
	{
		value: 'apple',
		label: 'Apple',
		imageSrc: appleSrc,
		imageAlt: 'Red apple'
	},
	{
		value: 'banana',
		label: 'Banana',
		imageSrc: bananaSrc,
		imageAlt: 'Banana'
	},
	{
		value: 'croissant',
		label: 'Croissant',
		imageSrc: croissantSrc,
		imageAlt: 'Croissant'
	},
	{
		value: 'coffee',
		label: 'Coffee',
		imageSrc: coffeeSrc,
		imageAlt: 'Cup of coffee'
	}
];

const pantryOptions: ImageChoiceOptionData[] = [
	...foodOptions,
	{
		value: 'pear',
		label: 'Pear',
		imageSrc: pearSrc,
		imageAlt: 'Pear'
	},
	{
		value: 'grapes',
		label: 'Grapes',
		imageSrc: grapesSrc,
		imageAlt: 'Grapes'
	},
	{
		value: 'cheese',
		label: 'Cheese',
		imageSrc: cheeseSrc,
		imageAlt: 'Cheese'
	},
	{
		value: 'butter',
		label: 'Butter',
		imageSrc: butterSrc,
		imageAlt: 'Butter'
	}
];

const meta = {
	title: 'Components/Quiz/ImageChoice',
	component: ImageChoice,
	tags: ['autodocs'],
	args: {
		options: foodOptions,
		value: 'banana',
		name: 'food-image-choice',
		legend: 'Choose the food',
		maxColumns: 4,
		minColumnWidth: '9rem'
	},
	argTypes: {
		value: {
			control: 'select',
			options: pantryOptions.map((option) => option.value)
		},
		interactionMode: {
			control: 'select',
			options: ['instant-submit', 'submit']
		},
		maxColumns: {
			control: { type: 'number', min: 1, max: 6, step: 1 }
		},
		disabled: {
			control: 'boolean'
		},
		celebrations: {
			control: 'boolean'
		}
	}
} satisfies Meta<typeof ImageChoice>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const EmptySelection: Story = {
	args: {
		value: null
	}
};

export const RegularSubmit: Story = {
	args: {
		value: null,
		interactionMode: 'submit',
		showSubmitButton: true,
		correctValue: 'apple'
	}
};

export const InstantSubmit: Story = {
	args: {
		value: null,
		interactionMode: 'instant-submit',
		correctValue: 'croissant'
	}
};

export const ReviewedIncorrect: Story = {
	args: {
		value: 'coffee',
		correctValue: 'banana',
		submitted: true
	}
};

export const ThreeColumns: Story = {
	args: {
		options: pantryOptions.slice(0, 6),
		value: null,
		maxColumns: 3,
		name: 'three-column-foods'
	}
};

export const TwoRows: Story = {
	args: {
		options: pantryOptions,
		value: 'grapes',
		maxColumns: 4,
		name: 'two-row-foods'
	}
};

export const ImageOnly: Story = {
	args: {
		options: foodOptions.map(({ value, imageSrc, imageAlt, disabled, state }) => ({
			value,
			imageSrc,
			imageAlt,
			disabled,
			state
		})),
		value: 'apple',
		name: 'image-only-foods'
	}
};

export const Disabled: Story = {
	args: {
		disabled: true
	}
};
