import type { Meta, StoryObj } from '@storybook/sveltekit';
import NumericAnswer from '../../lib/components/quiz/NumericAnswer.svelte';

const meta = {
	title: 'Components/Quiz/NumericAnswer',
	component: NumericAnswer,
	tags: ['autodocs'],
	args: {
		value: '',
		unit: 'cm',
		name: 'numeric-answer',
		label: 'Numeric answer',
		placeholder: 'Type a number',
		showSubmitButton: true,
		submitted: false,
		unitConfig: {
			mode: 'select',
			side: 'right',
			value: 'cm',
			options: [
				{ value: 'm', label: 'm', aliases: ['meter', 'meters'], multiplier: 1 },
				{ value: 'cm', label: 'cm', aliases: ['centimeter', 'centimeters'], multiplier: 0.01 },
				{ value: 'mm', label: 'mm', aliases: ['millimeter', 'millimeters'], multiplier: 0.001 }
			]
		},
		acceptedValues: [
			{
				value: 1,
				unit: 'm',
				tolerance: { type: 'absolute', value: 0.005 },
				precision: { type: 'significant-figures', value: 2, mode: 'at-least' }
			}
		]
	},
	argTypes: {
		submitted: {
			control: 'boolean'
		},
		showSubmitButton: {
			control: 'boolean'
		},
		disabled: {
			control: 'boolean'
		}
	}
} satisfies Meta<typeof NumericAnswer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SelectUnit: Story = {};

export const Unitless: Story = {
	args: {
		value: '',
		unit: null,
		placeholder: '0',
		unitConfig: {
			mode: 'none'
		},
		acceptedValues: [
			{
				value: 42,
				tolerance: { type: 'absolute', value: 0 }
			}
		]
	}
};

export const FixedPrefixUnit: Story = {
	args: {
		value: '',
		unit: null,
		placeholder: '0.00',
		unitConfig: {
			mode: 'fixed',
			side: 'left',
			value: '$'
		},
		acceptedValues: [
			{
				value: 12.5,
				tolerance: { type: 'absolute', value: 0.005 },
				precision: { type: 'decimal-places', value: 2 }
			}
		]
	}
};

export const FreeformUnit: Story = {
	args: {
		value: '',
		unit: '',
		placeholder: '0',
		unitConfig: {
			mode: 'freeform',
			side: 'right',
			placeholder: 'unit'
		},
		acceptedValues: [
			{
				value: 30,
				unit: 'yards',
				tolerance: { type: 'absolute', value: 0 }
			}
		]
	}
};
