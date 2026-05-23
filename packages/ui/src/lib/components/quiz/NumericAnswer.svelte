<script lang="ts">
	import { Check, ChevronDown } from '@lucide/svelte';
	import { tick } from 'svelte';
	import { Select } from 'bits-ui';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import Button from '../Button.svelte';
	import '../../styles/overlay-panel.css';
	import { celebrateCorrectAnswer } from './celebration';
	import GradingIndicator from './GradingIndicator.svelte';
	import {
		buildNumericSubmitResult,
		coerceNumericEvaluation,
		gradeNumericAnswer,
		isPartialNumericInput,
		parseNumericInput
	} from './numeric';
	import RichText from './RichText.svelte';
	import type {
		NumericAnswerAcceptedValue,
		NumericAnswerEvaluation,
		NumericAnswerSubmitResult,
		NumericAnswerValue,
		NumericUnitConfig,
		NumericUnitOption
	} from './types';

	type NumericAnswerProps = {
		value?: string;
		unit?: string | null;
		unitConfig?: NumericUnitConfig;
		name?: string;
		label?: string;
		placeholder?: string;
		disabled?: boolean;
		submitted?: boolean;
		acceptedValues?: NumericAnswerAcceptedValue[] | null;
		grader?: (answer: NumericAnswerValue) => NumericAnswerEvaluation;
		showSubmitButton?: boolean;
		submitLabel?: string;
		celebrations?: boolean;
		minLength?: number;
		autocomplete?: HTMLInputAttributes['autocomplete'];
		class?: string;
		oninput?: (answer: NumericAnswerValue) => void;
		onsubmit?: (result: NumericAnswerSubmitResult) => void;
	};

	let {
		value = $bindable(''),
		unit = $bindable<string | null | undefined>(undefined),
		unitConfig = { mode: 'none' },
		name = 'numeric-answer',
		label = 'Numeric answer',
		placeholder = 'Type a number',
		disabled = false,
		submitted = $bindable(false),
		acceptedValues = null,
		grader,
		showSubmitButton = true,
		submitLabel = 'Submit answer',
		celebrations = true,
		minLength = 1,
		autocomplete = 'off',
		class: className = '',
		oninput,
		onsubmit
	}: NumericAnswerProps = $props();

	let submittedResult = $state<NumericAnswerSubmitResult | null>(null);
	let gradingIndicatorElement = $state<HTMLElement>();
	let hasTrackedInputState = $state(false);
	let previousInputState = $state('neutral');
	let playCorrectMarkerEntrance = $state(false);
	let unitMode = $derived(unitConfig.mode ?? 'none');
	let unitSide = $derived(unitConfig.side ?? 'right');
	let unitOptions = $derived(unitConfig.mode === 'select' ? unitConfig.options : []);
	let activeUnit = $derived(getActiveUnit());
	let hasValidNumber = $derived(
		value.trim().length >= minLength && parseNumericInput(value) !== null
	);
	let hasRequiredUnit = $derived(
		unitMode === 'none' || unitMode === 'fixed' || activeUnit.trim().length > 0
	);
	let hasAnswer = $derived(hasValidNumber && hasRequiredUnit);
	let isLocked = $derived(disabled || submitted);
	let displayResult = $derived(
		submitted && hasAnswer
			? submittedResult?.value === value && submittedResult.unit === activeUnit
				? submittedResult
				: buildNumericSubmitResult(getAnswer(), gradeAnswer(getAnswer()))
			: null
	);
	let inputState = $derived(
		displayResult?.correct === true
			? 'correct'
			: displayResult?.correct === false
				? 'incorrect'
				: 'neutral'
	);

	$effect(() => {
		if (!hasTrackedInputState) {
			hasTrackedInputState = true;
			previousInputState = inputState;
			return;
		}

		const previous = previousInputState;
		previousInputState = inputState;

		if (celebrations && inputState === 'correct' && previous !== 'correct') {
			playCorrectMarkerEntrance = true;
			void tick().then(() => celebrateCorrectAnswer(gradingIndicatorElement));
		} else if (inputState !== 'correct') {
			playCorrectMarkerEntrance = false;
		}
	});

	function getActiveUnit() {
		if (unitConfig.mode === 'fixed') {
			return unitConfig.value;
		}

		if (unit !== undefined) {
			return unit ?? '';
		}

		return 'value' in unitConfig ? (unitConfig.value ?? '') : '';
	}

	function getAnswer(): NumericAnswerValue {
		return {
			value,
			unit: unitMode === 'none' ? null : activeUnit
		};
	}

	function getUnitLabel(unitValue: string) {
		if (unitConfig.mode === 'fixed') {
			return unitConfig.label ?? unitConfig.value;
		}

		const option = unitOptions.find((unitOption) => unitOption.value === unitValue);
		return option?.label ?? option?.value ?? unitValue;
	}

	function getSelectedUnit() {
		return activeUnit;
	}

	function setSelectedUnit(nextUnit: string) {
		unit = nextUnit;
		submittedResult = null;
		oninput?.(getAnswer());
	}

	function gradeAnswer(
		answer: NumericAnswerValue
	): Pick<NumericAnswerSubmitResult, 'correct' | 'feedback'> {
		if (grader) {
			return coerceNumericEvaluation(grader(answer));
		}

		return gradeNumericAnswer(answer, acceptedValues, unitOptions);
	}

	function updateValue(event: Event) {
		const input = event.currentTarget;

		if (!(input instanceof HTMLInputElement)) {
			return;
		}

		if (!isPartialNumericInput(input.value)) {
			input.value = value;
			return;
		}

		value = input.value;
		submittedResult = null;
		oninput?.(getAnswer());
	}

	function updateFreeformUnit(event: Event) {
		const input = event.currentTarget;

		if (!(input instanceof HTMLInputElement)) {
			return;
		}

		unit = input.value;
		submittedResult = null;
		oninput?.(getAnswer());
	}

	function submitAnswer() {
		if (disabled || submitted || !hasAnswer) {
			return;
		}

		const answer = getAnswer();
		const result = buildNumericSubmitResult(answer, gradeAnswer(answer));

		submittedResult = result;
		submitted = true;
		onsubmit?.(result);
	}
</script>

{#snippet unitAddon()}
	{#if unitMode === 'fixed'}
		<span class="unit-token" aria-label="Unit">{getUnitLabel(activeUnit)}</span>
	{:else if unitMode === 'freeform'}
		<input
			class="unit-input"
			name={`${name}-unit`}
			value={activeUnit}
			placeholder={unitConfig.mode === 'freeform' ? unitConfig.placeholder : undefined}
			{disabled}
			readonly={submitted}
			autocomplete="off"
			aria-label={`${label} unit`}
			oninput={updateFreeformUnit}
		/>
	{:else if unitMode === 'select'}
		<Select.Root type="single" bind:value={getSelectedUnit, setSelectedUnit} disabled={isLocked}>
			<Select.Trigger class="numeric-unit-trigger" aria-label={`${label} unit`}>
				<Select.Value
					placeholder={unitConfig.mode === 'select' ? unitConfig.placeholder : undefined}
				/>
				<ChevronDown size={14} strokeWidth={2.5} />
			</Select.Trigger>
			<Select.Portal>
				<Select.Content
					class="numeric-unit-content overlay-panel"
					style="--overlay-panel-anchor-inline-size: var(--bits-select-anchor-width); --overlay-panel-available-inline-size: var(--bits-select-content-available-width); --overlay-panel-available-block-size: var(--bits-select-content-available-height); --overlay-panel-min-inline-size: 6rem; --overlay-panel-max-inline-size: 16rem;"
					sideOffset={6}
				>
					<Select.Viewport class="numeric-unit-viewport overlay-panel__viewport">
						{#each unitOptions as unitOption (unitOption.value)}
							<Select.Item
								class="numeric-unit-item"
								value={unitOption.value}
								label={unitOption.label ?? unitOption.value}
								disabled={unitOption.disabled}
							>
								{#snippet children({ selected })}
									<span class="overlay-panel__text">{unitOption.label ?? unitOption.value}</span>
									{#if selected}
										<Check size={14} strokeWidth={3} />
									{/if}
								{/snippet}
							</Select.Item>
						{/each}
					</Select.Viewport>
				</Select.Content>
			</Select.Portal>
		</Select.Root>
	{/if}
{/snippet}

<div class={['numeric-answer', className]}>
	<label
		class={[
			'field',
			unitMode !== 'none' && `unit-${unitSide}`,
			isLocked && 'locked',
			inputState === 'correct' && 'correct',
			inputState === 'incorrect' && 'incorrect'
		]}
	>
		<span class="label">{label}</span>
		<span class="control-wrap">
			{#if unitMode !== 'none' && unitSide === 'left'}
				{@render unitAddon()}
			{/if}
			<span class="number-wrap">
				<input
					class="input"
					type="text"
					inputmode="decimal"
					{name}
					{value}
					{placeholder}
					{disabled}
					readonly={submitted}
					{autocomplete}
					aria-invalid={inputState === 'incorrect'}
					oninput={updateValue}
					onkeydown={(event) => {
						if (event.key === 'Enter') {
							event.preventDefault();
							submitAnswer();
						}
					}}
				/>
				{#if inputState === 'correct'}
					<GradingIndicator
						bind:element={gradingIndicatorElement}
						class="state-icon"
						state="correct"
						animateCorrectMarker={playCorrectMarkerEntrance}
						triggerCorrectAnimation={playCorrectMarkerEntrance}
					/>
				{:else if inputState === 'incorrect'}
					<GradingIndicator class="state-icon" state="incorrect" />
				{/if}
			</span>
			{#if unitMode !== 'none' && unitSide === 'right'}
				{@render unitAddon()}
			{/if}
		</span>
	</label>

	{#if displayResult?.feedback}
		<div class="feedback">
			<RichText content={displayResult.feedback} />
		</div>
	{/if}

	{#if showSubmitButton}
		<div class="footer">
			<Button
				variant="secondary"
				size="sm"
				label={submitLabel}
				disabled={disabled || submitted || !hasAnswer}
				onclick={submitAnswer}
			/>
		</div>
	{/if}
</div>

<style>
	.numeric-answer {
		display: grid;
		gap: var(--space-3);
	}

	.field {
		--answer-accent: var(--color-accent);
		display: grid;
		gap: var(--space-2);
	}

	.field.correct {
		--answer-accent: var(--color-success);
		--answer-accent-h: var(--color-success-h);
		--answer-accent-s: var(--color-success-s);
		--answer-accent-l: var(--color-success-l);
	}

	.field.incorrect {
		--answer-accent: var(--color-danger);
		--answer-accent-h: var(--color-danger-h);
		--answer-accent-s: var(--color-danger-s);
		--answer-accent-l: var(--color-danger-l);
	}

	.label {
		block-size: 1px;
		inline-size: 1px;
		clip: rect(0 0 0 0);
		clip-path: inset(50%);
		overflow: hidden;
		position: absolute;
		white-space: nowrap;
	}

	.control-wrap {
		align-items: stretch;
		display: grid;
		grid-template-columns: 1fr;
		position: relative;
	}

	.unit-left .control-wrap {
		grid-template-columns: minmax(4.25rem, max-content) minmax(0, 1fr);
	}

	.unit-right .control-wrap {
		grid-template-columns: minmax(0, 1fr) minmax(4.25rem, max-content);
	}

	.number-wrap {
		display: grid;
		min-inline-size: 0;
		position: relative;
	}

	.input,
	.unit-input,
	:global(.numeric-unit-trigger),
	.unit-token {
		background: linear-gradient(
			to bottom,
			var(--color-surface),
			color-mix(in srgb, var(--color-surface-raised), transparent 38%)
		);
		border: 1px solid var(--color-border);
		box-shadow: 0 1px 0 rgb(255 255 255 / 0.75) inset;
		color: var(--color-text);
		font: inherit;
		font-size: 1rem;
		line-height: 1.4;
		min-block-size: 3.5rem;
	}

	.input {
		appearance: textfield;
		border-radius: var(--radius-md);
		inline-size: 100%;
		min-inline-size: 0;
		padding: var(--space-4);
		padding-inline-end: 3.25rem;
		transition:
			background 150ms ease-out,
			border-color 150ms ease-out,
			box-shadow 150ms ease-out;
	}

	.input::-webkit-inner-spin-button,
	.input::-webkit-outer-spin-button {
		appearance: none;
		margin: 0;
	}

	.unit-left .input {
		border-start-start-radius: 0;
		border-end-start-radius: 0;
	}

	.unit-right .input {
		border-start-end-radius: 0;
		border-end-end-radius: 0;
	}

	.input::placeholder,
	.unit-input::placeholder {
		color: color-mix(in srgb, var(--color-text-muted), transparent 18%);
	}

	.field:not(.locked) .input:hover,
	.field:not(.locked) .unit-input:hover,
	.field:not(.locked) :global(.numeric-unit-trigger:hover) {
		background: linear-gradient(
			to bottom,
			color-mix(in srgb, var(--answer-accent), var(--color-surface) 94%),
			color-mix(in srgb, var(--answer-accent), var(--color-surface-raised) 92%)
		);
		border-color: color-mix(in srgb, var(--answer-accent), var(--color-border) 42%);
	}

	.input:focus-visible,
	.unit-input:focus-visible,
	:global(.numeric-unit-trigger:focus-visible) {
		border-color: var(--answer-accent);
		box-shadow:
			0 0 0 3px color-mix(in srgb, var(--color-focus), transparent 42%),
			0 1px 0 rgb(255 255 255 / 0.75) inset;
		outline: 0;
		position: relative;
		z-index: 1;
	}

	.correct .input,
	.incorrect .input {
		background: linear-gradient(
			to bottom,
			color-mix(in srgb, var(--answer-accent), var(--color-surface) 90%),
			color-mix(in srgb, var(--answer-accent), var(--color-surface-raised) 86%)
		);
		border-color: var(--answer-accent);
		box-shadow:
			0 0 0 1px color-mix(in srgb, var(--answer-accent), transparent 42%),
			0 8px 20px color-mix(in srgb, var(--answer-accent), transparent 86%);
	}

	.correct .input,
	.incorrect .input {
		color: hsl(
			var(--answer-accent-h) calc(var(--answer-accent-s) + 25%) calc(var(--answer-accent-l) - 35%)
		);
	}

	.input:disabled,
	.unit-input:disabled,
	:global(.numeric-unit-trigger:disabled),
	:global(.numeric-unit-trigger[data-disabled]) {
		cursor: not-allowed;
		opacity: 0.58;
	}

	.input:read-only,
	.unit-input:read-only {
		cursor: default;
	}

	.unit-input,
	.unit-token,
	:global(.numeric-unit-trigger) {
		align-items: center;
		display: inline-flex;
		gap: var(--space-2);
		justify-content: center;
		min-inline-size: 4.25rem;
		padding: 0 var(--space-3);
		white-space: nowrap;
	}

	.unit-input {
		inline-size: clamp(4.25rem, 18vw, 7rem);
		text-align: center;
	}

	.unit-token {
		color: var(--color-text-muted);
	}

	:global(.numeric-unit-trigger) {
		appearance: none;
		cursor: pointer;
	}

	.unit-left .unit-input,
	.unit-left .unit-token,
	.unit-left :global(.numeric-unit-trigger) {
		border-radius: var(--radius-md) 0 0 var(--radius-md);
		border-inline-end: 0;
	}

	.unit-right .unit-input,
	.unit-right .unit-token,
	.unit-right :global(.numeric-unit-trigger) {
		border-radius: 0 var(--radius-md) var(--radius-md) 0;
		border-inline-start: 0;
	}

	.number-wrap :global(.state-icon) {
		align-self: center;
		justify-self: end;
		margin-inline-end: var(--space-4);
		position: absolute;
	}

	:global(.numeric-unit-content) {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		box-shadow: 0 16px 36px rgb(20 24 31 / 0.12);
		padding: var(--space-1);
		z-index: 40;
	}

	:global(.numeric-unit-viewport) {
		display: grid;
		gap: 1px;
	}

	:global(.numeric-unit-item) {
		align-items: center;
		border-radius: calc(var(--radius-md) - 2px);
		color: var(--color-text);
		cursor: pointer;
		display: flex;
		gap: var(--space-2);
		justify-content: space-between;
		min-block-size: 2.5rem;
		padding: 0 var(--space-3);
	}

	:global(.numeric-unit-item[data-highlighted]) {
		background: color-mix(in srgb, var(--color-accent), var(--color-surface) 72%);
		outline: 0;
	}

	:global(.numeric-unit-item[data-disabled]) {
		color: var(--color-text-muted);
		cursor: not-allowed;
		opacity: 0.58;
	}

	.feedback {
		color: var(--color-text-muted);
		font-size: 0.9375rem;
		line-height: 1.45;
		margin-block: 0;
	}

	.footer {
		align-items: center;
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		justify-content: end;
	}

	@media (max-width: 480px) {
		.unit-left .control-wrap,
		.unit-right .control-wrap {
			grid-template-columns: 1fr;
		}

		.unit-left .input,
		.unit-right .input,
		.unit-left .unit-input,
		.unit-left .unit-token,
		.unit-left :global(.numeric-unit-trigger),
		.unit-right .unit-input,
		.unit-right .unit-token,
		.unit-right :global(.numeric-unit-trigger) {
			border-radius: var(--radius-md);
			border: 1px solid var(--color-border);
		}

		.unit-left .control-wrap,
		.unit-right .control-wrap {
			gap: var(--space-2);
		}

		.unit-input,
		.unit-token,
		:global(.numeric-unit-trigger) {
			inline-size: 100%;
			justify-content: space-between;
		}
	}
</style>
