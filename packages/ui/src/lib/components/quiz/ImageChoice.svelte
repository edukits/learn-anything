<script lang="ts">
	import Button from '../Button.svelte';
	import { celebrateCorrectMultipleChoice } from './celebration';
	import ImageChoiceOption from './ImageChoiceOption.svelte';
	import type {
		ImageChoiceOptionData,
		ImageChoiceSubmitResult,
		MultipleChoiceInteractionMode,
		MultipleChoiceOptionState
	} from './types';

	type ImageChoiceProps = {
		options: ImageChoiceOptionData[];
		value?: string | null;
		name?: string;
		legend?: string;
		disabled?: boolean;
		interactionMode?: MultipleChoiceInteractionMode;
		correctValue?: string | null;
		submitted?: boolean;
		showSubmitButton?: boolean;
		submitLabel?: string;
		celebrations?: boolean;
		maxColumns?: number;
		minColumnWidth?: string;
		class?: string;
		onselect?: (value: string, option: ImageChoiceOptionData) => void;
		onsubmit?: (result: ImageChoiceSubmitResult) => void;
	};

	let {
		options,
		value = $bindable<string | null>(null),
		name = 'image-choice',
		legend = 'Image answer choices',
		disabled = false,
		interactionMode = 'submit',
		correctValue = null,
		submitted = $bindable(false),
		showSubmitButton = false,
		submitLabel = 'Submit answer',
		celebrations = true,
		maxColumns = 4,
		minColumnWidth = '9rem',
		class: className = '',
		onselect,
		onsubmit
	}: ImageChoiceProps = $props();

	let resolvedCorrectValue = $derived(
		correctValue ?? options.find((option) => option.state === 'correct')?.value ?? null
	);
	let hasAnswerKey = $derived(resolvedCorrectValue !== null);
	let isLocked = $derived(disabled || submitted);
	let normalizedMaxColumns = $derived(Math.max(1, Math.floor(maxColumns)));

	function getRadioControlElement(input: EventTarget | null | undefined) {
		if (!(input instanceof HTMLInputElement)) {
			return undefined;
		}

		const control = input.closest('label');
		return control instanceof HTMLElement ? control : input;
	}

	function getOptionControlElement(optionValue: string | null) {
		if (optionValue === null) {
			return undefined;
		}

		const input = document.getElementById(`${name}-${optionValue}`);

		if (!(input instanceof HTMLInputElement)) {
			return undefined;
		}

		return getRadioControlElement(input);
	}

	function getOptionState(option: ImageChoiceOptionData): MultipleChoiceOptionState {
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

		if (celebrations && isCorrect) {
			void celebrateCorrectMultipleChoice(sourceElement ?? getOptionControlElement(value));
		}
	}

	function selectOption(option: ImageChoiceOptionData, event?: Event) {
		if (isLocked || option.disabled) {
			return;
		}

		const sourceElement = getRadioControlElement(event?.currentTarget);
		value = option.value;
		onselect?.(option.value, option);

		if (interactionMode === 'instant-submit') {
			submitSelection(sourceElement);
		}
	}
</script>

<div
	class={['image-choice', className]}
	style:--max-columns={normalizedMaxColumns}
	style:--min-column-width={minColumnWidth}
>
	<fieldset disabled={isLocked}>
		<legend>{legend}</legend>

		<div class="options">
			{#each options as option (option.value)}
				<ImageChoiceOption
					id={`${name}-${option.value}`}
					{name}
					value={option.value}
					imageSrc={option.imageSrc}
					imageAlt={option.imageAlt}
					label={option.label}
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
		<div class="footer">
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
	.image-choice {
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
		--column-gap-total: calc((var(--max-columns) - 1) * var(--space-3));
		--max-column-width: calc((100% - var(--column-gap-total)) / var(--max-columns));
		display: grid;
		gap: var(--space-3);
		grid-template-columns: repeat(
			auto-fit,
			minmax(min(100%, max(var(--min-column-width), var(--max-column-width))), 1fr)
		);
	}

	.footer {
		align-items: center;
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		justify-content: end;
	}

	@media (max-width: 560px) {
		.options {
			grid-template-columns: 1fr;
		}
	}
</style>
