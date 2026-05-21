<script lang="ts">
	import Button from '../Button.svelte';
	import { celebrateCorrectMultipleChoice } from './celebration';
	import MultipleChoiceOption from './MultipleChoiceOption.svelte';
	import type {
		MultipleChoiceInteractionMode,
		MultipleChoiceOptionData,
		MultipleChoiceOptionState,
		MultipleChoiceSubmitResult
	} from './types';

	type MultipleChoiceProps = {
		options: MultipleChoiceOptionData[];
		value?: string | null;
		name?: string;
		legend?: string;
		disabled?: boolean;
		interactionMode?: MultipleChoiceInteractionMode;
		correctValue?: string | null;
		submitted?: boolean;
		showSubmitButton?: boolean;
		submitLabel?: string;
		class?: string;
		onselect?: (value: string, option: MultipleChoiceOptionData) => void;
		onsubmit?: (result: MultipleChoiceSubmitResult) => void;
	};

	let {
		options,
		value = $bindable<string | null>(null),
		name = 'multiple-choice',
		legend = 'Answer choices',
		disabled = false,
		interactionMode = 'submit',
		correctValue = null,
		submitted = $bindable(false),
		showSubmitButton = false,
		submitLabel = 'Submit answer',
		class: className = '',
		onselect,
		onsubmit
	}: MultipleChoiceProps = $props();

	let resolvedCorrectValue = $derived(
		correctValue ?? options.find((option) => option.state === 'correct')?.value ?? null
	);
	let hasAnswerKey = $derived(resolvedCorrectValue !== null);
	let isLocked = $derived(disabled || submitted);

	function getRadioControlElement(event?: Event) {
		const input = event?.currentTarget;

		if (!(input instanceof HTMLInputElement)) {
			return undefined;
		}

		const control = input.nextElementSibling;
		return control instanceof HTMLElement ? control : input;
	}

	function getOptionState(option: MultipleChoiceOptionData): MultipleChoiceOptionState {
		if (!submitted || !hasAnswerKey) {
			return option.state ?? 'neutral';
		}

		if (option.value === resolvedCorrectValue) {
			return 'correct';
		}

		if (option.value === value) {
			return 'incorrect';
		}

		return 'neutral';
	}

	function submitSelection(sourceElement?: HTMLElement) {
		if (disabled || submitted || value === null) {
			return;
		}

		const isCorrect = resolvedCorrectValue === null ? null : value === resolvedCorrectValue;

		submitted = true;
		onsubmit?.({
			value,
			correct: isCorrect
		});

		if (interactionMode === 'instant-submit' && isCorrect) {
			void celebrateCorrectMultipleChoice(sourceElement);
		}
	}

	function selectOption(option: MultipleChoiceOptionData, event?: Event) {
		if (isLocked || option.disabled) {
			return;
		}

		const sourceElement = getRadioControlElement(event);
		value = option.value;
		onselect?.(option.value, option);

		if (interactionMode === 'instant-submit') {
			submitSelection(sourceElement);
		}
	}
</script>

<div class={['la-multiple-choice', submitted && 'la-multiple-choice--submitted', className]}>
	<fieldset class="la-multiple-choice__fieldset" disabled={isLocked}>
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
					locked={submitted}
					state={getOptionState(option)}
					onchange={(event) => selectOption(option, event)}
				/>
			{/each}
		</div>
	</fieldset>

	{#if showSubmitButton}
		<div class="la-multiple-choice__footer">
			<Button
				variant="secondary"
				size="sm"
				label={submitLabel}
				disabled={disabled || submitted || value === null}
				onclick={() => submitSelection()}
			/>
		</div>
	{/if}
</div>

<style>
	.la-multiple-choice {
		display: grid;
		gap: var(--space-4);
	}

	.la-multiple-choice__fieldset {
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

	.la-multiple-choice__footer {
		align-items: center;
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		justify-content: end;
	}
</style>
