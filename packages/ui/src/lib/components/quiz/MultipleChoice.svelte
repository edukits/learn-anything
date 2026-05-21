<script lang="ts">
	import MultipleChoiceOption from './MultipleChoiceOption.svelte';
	import type { MultipleChoiceOptionData } from './types';

	type MultipleChoiceProps = {
		options: MultipleChoiceOptionData[];
		value?: string | null;
		name?: string;
		legend?: string;
		disabled?: boolean;
		class?: string;
		onselect?: (value: string, option: MultipleChoiceOptionData) => void;
	};

	let {
		options,
		value = $bindable<string | null>(null),
		name = 'multiple-choice',
		legend = 'Answer choices',
		disabled = false,
		class: className = '',
		onselect
	}: MultipleChoiceProps = $props();

	function selectOption(option: MultipleChoiceOptionData) {
		if (disabled || option.disabled) {
			return;
		}

		value = option.value;
		onselect?.(option.value, option);
	}
</script>

<fieldset class={['la-multiple-choice', className]} {disabled}>
	<legend>{legend}</legend>

	<div class="la-multiple-choice__options">
		{#each options as option (option.value)}
			<MultipleChoiceOption
				id={`${name}-${option.value}`}
				{name}
				value={option.value}
				label={option.label}
				description={option.description}
				selected={value === option.value}
				disabled={disabled || option.disabled}
				state={option.state}
				onchange={() => selectOption(option)}
			/>
		{/each}
	</div>
</fieldset>

<style>
	.la-multiple-choice {
		border: 0;
		margin: 0;
		min-inline-size: 0;
		padding: 0;
	}

	legend {
		block-size: 1px;
		inline-size: 1px;
		clip: rect(0 0 0 0);
		clip-path: inset(50%);
		overflow: hidden;
		position: absolute;
		white-space: nowrap;
	}

	.la-multiple-choice__options {
		display: grid;
		gap: var(--space-3);
	}
</style>
