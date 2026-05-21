<script lang="ts">
	import { onDestroy } from 'svelte';
	import Button from '../Button.svelte';
	import {
		MULTIPLE_SELECT_CELEBRATION_STAGGER_MS,
		celebrateCorrectMultipleSelect
	} from './celebration';
	import MultipleChoiceOption from './MultipleChoiceOption.svelte';
	import type {
		MultipleChoiceOptionData,
		MultipleChoiceOptionState,
		MultipleSelectSubmitResult
	} from './types';

	type MultipleSelectProps = {
		options: MultipleChoiceOptionData[];
		value?: string[];
		name?: string;
		legend?: string;
		disabled?: boolean;
		correctValues?: string[] | null;
		submitted?: boolean;
		showSubmitButton?: boolean;
		submitLabel?: string;
		celebrations?: boolean;
		class?: string;
		onselect?: (value: string[], option: MultipleChoiceOptionData) => void;
		onsubmit?: (result: MultipleSelectSubmitResult) => void;
	};

	let {
		options,
		value = $bindable<string[]>([]),
		name = 'multiple-select',
		legend = 'Answer choices',
		disabled = false,
		correctValues = null,
		submitted = $bindable(false),
		showSubmitButton = false,
		submitLabel = 'Submit answer',
		celebrations = true,
		class: className = '',
		onselect,
		onsubmit
	}: MultipleSelectProps = $props();

	let resolvedCorrectValues = $derived.by(() => {
		if (correctValues !== null) {
			return correctValues;
		}

		const optionCorrectValues = options
			.filter((option) => option.state === 'correct')
			.map((option) => option.value);

		return optionCorrectValues.length > 0 ? optionCorrectValues : null;
	});
	let hasAnswerKey = $derived(resolvedCorrectValues !== null);
	let selectedValues = $derived(new Set(value));
	let correctValueSet = $derived(new Set(resolvedCorrectValues ?? []));
	let isLocked = $derived(disabled || submitted);
	let stagedCorrectValues = $state<string[]>([]);
	let isStaggeringCorrectReveal = $state(false);
	let correctRevealTimers: number[] = [];

	function clearCorrectRevealTimers() {
		for (const timer of correctRevealTimers) {
			window.clearTimeout(timer);
		}

		correctRevealTimers = [];
	}

	onDestroy(clearCorrectRevealTimers);

	function getCorrectOptionsInDisplayOrder() {
		return options.filter((option) => correctValueSet.has(option.value));
	}

	function getOptionControlElement(optionValue: string) {
		const input = document.getElementById(`${name}-${optionValue}`);

		if (!(input instanceof HTMLInputElement)) {
			return undefined;
		}

		const control = input.nextElementSibling;
		return control instanceof HTMLElement ? control : input;
	}

	function getCorrectOptionControlElements() {
		return getCorrectOptionsInDisplayOrder()
			.map((option) => getOptionControlElement(option.value))
			.filter((element): element is HTMLElement => element !== undefined);
	}

	function revealCorrectOptionsInStep() {
		clearCorrectRevealTimers();
		stagedCorrectValues = [];
		isStaggeringCorrectReveal = true;

		for (const [index, option] of getCorrectOptionsInDisplayOrder().entries()) {
			const timer = window.setTimeout(() => {
				stagedCorrectValues = [...stagedCorrectValues, option.value];

				if (stagedCorrectValues.length === correctValueSet.size) {
					isStaggeringCorrectReveal = false;
					correctRevealTimers = [];
				}
			}, index * MULTIPLE_SELECT_CELEBRATION_STAGGER_MS) as number;

			correctRevealTimers = [...correctRevealTimers, timer];
		}
	}

	function getOptionState(option: MultipleChoiceOptionData): MultipleChoiceOptionState {
		if (!submitted || !hasAnswerKey) {
			return option.state ?? 'neutral';
		}

		if (correctValueSet.has(option.value)) {
			if (isStaggeringCorrectReveal && !stagedCorrectValues.includes(option.value)) {
				return option.state ?? 'neutral';
			}

			return 'correct';
		}

		if (selectedValues.has(option.value)) {
			return 'incorrect';
		}

		return 'neutral';
	}

	function hasExactCorrectSelection() {
		if (
			resolvedCorrectValues === null ||
			selectedValues.size !== value.length ||
			selectedValues.size !== correctValueSet.size
		) {
			return false;
		}

		return Array.from(selectedValues).every((selectedValue) => correctValueSet.has(selectedValue));
	}

	function submitSelection() {
		if (disabled || submitted || value.length === 0) {
			return;
		}

		const isCorrect = resolvedCorrectValues === null ? null : hasExactCorrectSelection();

		submitted = true;
		onsubmit?.({
			value,
			correct: isCorrect
		});

		if (celebrations && isCorrect) {
			revealCorrectOptionsInStep();
			void celebrateCorrectMultipleSelect(getCorrectOptionControlElements());
		} else {
			clearCorrectRevealTimers();
			isStaggeringCorrectReveal = false;
			stagedCorrectValues = [];
		}
	}

	function toggleOption(option: MultipleChoiceOptionData) {
		if (isLocked || option.disabled) {
			return;
		}

		if (selectedValues.has(option.value)) {
			value = value.filter((selectedValue) => selectedValue !== option.value);
		} else {
			value = [...value, option.value];
		}

		onselect?.(value, option);
	}
</script>

<div class={['multiple-select', className]}>
	<fieldset disabled={isLocked}>
		<legend>{legend}</legend>

		<div class="options">
			{#each options as option (option.value)}
				<MultipleChoiceOption
					id={`${name}-${option.value}`}
					{name}
					value={option.value}
					label={option.label}
					description={option.description}
					selected={selectedValues.has(option.value)}
					disabled={disabled || option.disabled}
					locked={submitted}
					state={getOptionState(option)}
					controlType="checkbox"
					onchange={() => toggleOption(option)}
				/>
			{/each}
		</div>
	</fieldset>

	{#if showSubmitButton}
		<div class="footer">
			<Button
				variant="secondary"
				size="sm"
				label={submitLabel}
				disabled={disabled || submitted || value.length === 0}
				onclick={() => submitSelection()}
			/>
		</div>
	{/if}
</div>

<style>
	.multiple-select {
		display: grid;
		gap: var(--space-4);
	}

	fieldset {
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

	.options {
		display: grid;
		gap: var(--space-3);
	}

	.footer {
		align-items: center;
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		justify-content: end;
	}
</style>
