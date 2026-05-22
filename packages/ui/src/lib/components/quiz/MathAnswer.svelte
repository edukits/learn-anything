<script lang="ts">
	import { tick } from 'svelte';
	import type { MathfieldElement, MathfieldOptions, OutputFormat } from 'mathlive';
	import 'mathlive';
	import 'mathlive/fonts.css';
	import Button from '../Button.svelte';
	import { celebrateCorrectAnswer } from './celebration';
	import GradingIndicator from './GradingIndicator.svelte';
	import {
		buildEmptyMathPrompts,
		buildMathSubmitResult,
		coerceMathEvaluation,
		gradeMathAnswer,
		isMathAnswered
	} from './math';
	import type {
		MathAnswerAcceptedValue,
		MathAnswerEvaluation,
		MathAnswerMatchMode,
		MathAnswerSubmitResult,
		MathAnswerValue
	} from './types';

	type MathAnswerProps = {
		value?: string;
		template?: string;
		name?: string;
		label?: string;
		placeholder?: string;
		mathPlaceholder?: string;
		disabled?: boolean;
		submitted?: boolean;
		acceptedValues?: MathAnswerAcceptedValue[] | null;
		matchMode?: MathAnswerMatchMode;
		grader?: (answer: MathAnswerValue) => MathAnswerEvaluation;
		mathfieldOptions?: Partial<MathfieldOptions>;
		promptFormat?: OutputFormat;
		showSubmitButton?: boolean;
		submitLabel?: string;
		celebrations?: boolean;
		class?: string;
		oninput?: (answer: MathAnswerValue) => void;
		onsubmit?: (result: MathAnswerSubmitResult) => void;
	};

	const defaultMathfieldOptions = {
		mathVirtualKeyboardPolicy: 'manual'
	} satisfies Partial<MathfieldOptions>;

	let {
		value = $bindable(''),
		template,
		name = 'math-answer',
		label = 'Math answer',
		placeholder = 'Type math',
		mathPlaceholder,
		disabled = false,
		submitted = $bindable(false),
		acceptedValues = null,
		matchMode = 'normalized',
		grader,
		mathfieldOptions = {},
		promptFormat = 'latex',
		showSubmitButton = true,
		submitLabel = 'Submit answer',
		celebrations = true,
		class: className = '',
		oninput,
		onsubmit
	}: MathAnswerProps = $props();

	let mathfield = $state<MathfieldElement | null>(null);
	let mathliveReady = $state(false);
	let submittedResult = $state<MathAnswerSubmitResult | null>(null);
	let gradingIndicatorElement = $state<HTMLElement>();
	let hasTrackedInputState = $state(false);
	let previousInputState = $state('neutral');
	let playCorrectMarkerEntrance = $state(false);
	let lastRenderedValue = $state('');
	let hasAnswer = $derived(isMathAnswered(getAnswer()));
	let isLocked = $derived(disabled || submitted);
	let hasMathPlaceholder = $derived((mathPlaceholder ?? '').trim().length > 0);
	let showTextPlaceholder = $derived(
		!hasMathPlaceholder && !template && value.trim().length === 0 && placeholder.trim().length > 0
	);
	let displayResult = $derived(
		submitted && hasAnswer
			? submittedResult?.latex === value
				? submittedResult
				: buildMathSubmitResult(getAnswer(), gradeAnswer(getAnswer()))
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

	$effect(() => {
		let cancelled = false;

		void window.customElements.whenDefined('math-field').then(() => {
			if (!cancelled) {
				mathliveReady = true;
			}
		});

		return () => {
			cancelled = true;
		};
	});

	$effect(() => {
		if (!mathfield || !mathliveReady) {
			return;
		}

		Object.assign(mathfield, defaultMathfieldOptions, mathfieldOptions);
		mathfield.menuItems = [];
		mathfield.disabled = disabled;
		mathfield.readOnly = submitted;
		mathfield.placeholder = mathPlaceholder ?? '';
		const nextValue = getInitialValue();

		if (nextValue !== lastRenderedValue) {
			mathfield.value = nextValue;
			lastRenderedValue = mathfield.value;
			value = mathfield.value;
		}
	});

	function getInitialValue() {
		return value || template || '';
	}

	function getPromptValues() {
		if (!mathfield || typeof mathfield.getPrompts !== 'function') {
			return buildEmptyMathPrompts(getInitialValue());
		}

		const promptValues = Object.fromEntries(
			mathfield
				.getPrompts()
				.map((promptId) => [promptId, mathfield?.getPromptValue(promptId, promptFormat) ?? ''])
		);

		return Object.keys(promptValues).length > 0
			? promptValues
			: buildEmptyMathPrompts(getInitialValue());
	}

	function getAnswer(): MathAnswerValue {
		return {
			latex: value,
			prompts: getPromptValues()
		};
	}

	function gradeAnswer(
		answer: MathAnswerValue
	): Pick<MathAnswerSubmitResult, 'correct' | 'feedback'> {
		if (grader) {
			return coerceMathEvaluation(grader(answer));
		}

		return gradeMathAnswer(answer, acceptedValues, matchMode);
	}

	function updateValue(event: Event) {
		const input = event.currentTarget;

		if (!(input instanceof HTMLElement) || !('value' in input)) {
			return;
		}

		value = String(input.value);
		lastRenderedValue = value;
		submittedResult = null;
		oninput?.(getAnswer());
	}

	function submitAnswer() {
		if (disabled || submitted || !hasAnswer) {
			return;
		}

		const answer = getAnswer();
		const result = buildMathSubmitResult(answer, gradeAnswer(answer));

		submittedResult = result;
		submitted = true;
		onsubmit?.(result);
	}
</script>

<div class={['math-answer', className]}>
	<label
		class={[
			'field',
			isLocked && 'locked',
			inputState === 'correct' && 'correct',
			inputState === 'incorrect' && 'incorrect'
		]}
	>
		<span class="label">{label}</span>
		<span class="control-wrap">
			<math-field
				bind:this={mathfield}
				class="input"
				{name}
				role="textbox"
				tabindex="0"
				aria-label={label}
				read-only={submitted}
				{disabled}
				oninput={updateValue}
				onkeydown={(event: KeyboardEvent) => {
					if (event.key === 'Enter' && !event.shiftKey) {
						event.preventDefault();
						submitAnswer();
					}
				}}
			></math-field>
			{#if showTextPlaceholder}
				<span class="text-placeholder" aria-hidden="true">{placeholder}</span>
			{/if}
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
	</label>

	{#if displayResult?.feedback}
		<p class="feedback">{displayResult.feedback}</p>
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
	.math-answer {
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
		display: grid;
		position: relative;
	}

	.input {
		--caret-color: var(--answer-accent);
		--selection-background-color: color-mix(in srgb, var(--answer-accent), transparent 78%);
		--contains-highlight-background-color: color-mix(
			in srgb,
			var(--answer-accent),
			transparent 86%
		);
		appearance: none;
		background: linear-gradient(
			to bottom,
			var(--color-surface),
			color-mix(in srgb, var(--color-surface-raised), transparent 38%)
		);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		box-sizing: border-box;
		box-shadow: 0 1px 0 rgb(255 255 255 / 0.75) inset;
		color: var(--color-text);
		font: inherit;
		font-size: 1.25rem;
		inline-size: 100%;
		line-height: 1.4;
		min-block-size: 3.5rem;
		min-inline-size: 0;
		padding: var(--space-4);
		padding-block: 0.5625rem;
		padding-inline-end: 3.25rem;
		padding-inline-start: calc(var(--space-4) - 0.375rem);
		transition:
			background 150ms ease-out,
			border-color 150ms ease-out,
			box-shadow 150ms ease-out;
	}

	.field:not(.locked) .input:hover {
		background: linear-gradient(
			to bottom,
			color-mix(in srgb, var(--answer-accent), var(--color-surface) 94%),
			color-mix(in srgb, var(--answer-accent), var(--color-surface-raised) 92%)
		);
		border-color: color-mix(in srgb, var(--answer-accent), var(--color-border) 42%);
	}

	.input:focus-visible,
	.input:focus-within {
		border-color: var(--answer-accent);
		box-shadow:
			0 0 0 3px color-mix(in srgb, var(--color-focus), transparent 42%),
			0 1px 0 rgb(255 255 255 / 0.75) inset;
		outline: 0;
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

	.input[disabled] {
		cursor: not-allowed;
		opacity: 0.58;
	}

	.input[read-only] {
		cursor: default;
	}

	.input::part(virtual-keyboard-toggle),
	.input::part(menu-toggle) {
		display: none;
	}

	.text-placeholder {
		align-self: center;
		color: color-mix(in srgb, var(--color-text-muted), transparent 18%);
		font: inherit;
		font-size: 1rem;
		font-style: normal;
		inset-inline-start: var(--space-4);
		justify-self: start;
		line-height: 1.4;
		max-inline-size: calc(100% - 5rem);
		overflow: hidden;
		pointer-events: none;
		position: absolute;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.control-wrap :global(.state-icon) {
		align-self: center;
		justify-self: end;
		margin-inline-end: var(--space-4);
		position: absolute;
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
</style>
