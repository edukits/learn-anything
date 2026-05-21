<script lang="ts">
	import { tick } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import Button from '../Button.svelte';
	import { celebrateCorrectAnswer } from './celebration';
	import GradingIndicator from './GradingIndicator.svelte';
	import type {
		ShortAnswerEvaluation,
		ShortAnswerMatchMode,
		ShortAnswerSubmitResult
	} from './types';

	type ShortAnswerProps = {
		value?: string;
		name?: string;
		label?: string;
		placeholder?: string;
		disabled?: boolean;
		submitted?: boolean;
		acceptedAnswers?: string[] | null;
		matchMode?: ShortAnswerMatchMode;
		normalizer?: (value: string) => string;
		grader?: (value: string) => ShortAnswerEvaluation;
		showSubmitButton?: boolean;
		submitLabel?: string;
		celebrations?: boolean;
		minLength?: number;
		maxLength?: number;
		autocomplete?: HTMLInputAttributes['autocomplete'];
		class?: string;
		oninput?: (value: string) => void;
		onsubmit?: (result: ShortAnswerSubmitResult) => void;
	};

	let {
		value = $bindable(''),
		name = 'short-answer',
		label = 'Short answer',
		placeholder = 'Type your answer',
		disabled = false,
		submitted = $bindable(false),
		acceptedAnswers = null,
		matchMode = 'normalized',
		normalizer,
		grader,
		showSubmitButton = true,
		submitLabel = 'Submit answer',
		celebrations = true,
		minLength = 1,
		maxLength,
		autocomplete = 'off',
		class: className = '',
		oninput,
		onsubmit
	}: ShortAnswerProps = $props();

	let submittedResult = $state<ShortAnswerSubmitResult | null>(null);
	let gradingIndicatorElement = $state<HTMLElement>();
	let hasTrackedInputState = $state(false);
	let previousInputState = $state('neutral');
	let trimmedValue = $derived(value.trim());
	let hasAnswer = $derived(trimmedValue.length >= minLength);
	let isLocked = $derived(disabled || submitted);
	let displayResult = $derived(
		submitted && hasAnswer
			? submittedResult?.value === value
				? submittedResult
				: { value, ...gradeAnswer(value) }
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
			void tick().then(() => celebrateCorrectAnswer(gradingIndicatorElement));
		}
	});

	function normalize(valueToNormalize: string) {
		if (normalizer) {
			return normalizer(valueToNormalize);
		}

		return valueToNormalize.trim().replace(/\s+/g, ' ');
	}

	function getComparableValue(valueToCompare: string) {
		if (matchMode === 'exact') {
			return valueToCompare;
		}

		const normalizedValue = normalize(valueToCompare);

		if (
			matchMode === 'case-insensitive' ||
			matchMode === 'normalized' ||
			matchMode === 'contains'
		) {
			return normalizedValue.toLocaleLowerCase();
		}

		return normalizedValue;
	}

	function matchesAcceptedAnswer(answer: string, acceptedAnswer: string) {
		if (matchMode === 'contains') {
			return getComparableValue(answer).includes(getComparableValue(acceptedAnswer));
		}

		return getComparableValue(answer) === getComparableValue(acceptedAnswer);
	}

	function coerceEvaluation(
		evaluation: ShortAnswerEvaluation
	): Pick<ShortAnswerSubmitResult, 'correct' | 'feedback'> {
		if (typeof evaluation === 'object' && evaluation !== null) {
			return {
				correct: evaluation.correct,
				feedback: evaluation.feedback
			};
		}

		return { correct: evaluation };
	}

	function gradeAnswer(answer: string): Pick<ShortAnswerSubmitResult, 'correct' | 'feedback'> {
		if (grader) {
			return coerceEvaluation(grader(answer));
		}

		if (acceptedAnswers === null || acceptedAnswers.length === 0) {
			return { correct: null };
		}

		return {
			correct: acceptedAnswers.some((acceptedAnswer) =>
				matchesAcceptedAnswer(answer, acceptedAnswer)
			)
		};
	}

	function updateValue(event: Event) {
		const input = event.currentTarget;

		if (!(input instanceof HTMLInputElement)) {
			return;
		}

		value = input.value;
		submittedResult = null;
		oninput?.(value);
	}

	function submitAnswer() {
		if (disabled || submitted || !hasAnswer) {
			return;
		}

		const result = {
			value,
			...gradeAnswer(value)
		};

		submittedResult = result;
		submitted = true;
		onsubmit?.(result);
	}
</script>

<div class={['short-answer', className]}>
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
			<input
				class="input"
				type="text"
				{name}
				{value}
				{placeholder}
				{disabled}
				readonly={submitted}
				minlength={minLength}
				maxlength={maxLength}
				{autocomplete}
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
	.short-answer {
		display: grid;
		gap: var(--space-3);
	}

	.field {
		--answer-accent: var(--color-accent);
		display: grid;
		gap: var(--space-2);
	}

	.field.correct {
		--answer-accent: var(--color-correct);
		--answer-accent-h: var(--color-correct-h);
		--answer-accent-s: var(--color-correct-s);
		--answer-accent-l: var(--color-correct-l);
	}

	.field.incorrect {
		--answer-accent: var(--color-incorrect);
		--answer-accent-h: var(--color-incorrect-h);
		--answer-accent-s: var(--color-incorrect-s);
		--answer-accent-l: var(--color-incorrect-l);
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
		appearance: none;
		background: linear-gradient(
			to bottom,
			var(--color-surface),
			color-mix(in srgb, var(--color-surface-raised), transparent 38%)
		);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		box-shadow: 0 1px 0 rgb(255 255 255 / 0.75) inset;
		color: var(--color-text);
		font: inherit;
		font-size: 1rem;
		inline-size: 100%;
		line-height: 1.4;
		min-block-size: 3.5rem;
		padding: var(--space-4);
		padding-inline-end: 3.25rem;
		transition:
			background 150ms ease-out,
			border-color 150ms ease-out,
			box-shadow 150ms ease-out;
	}

	.input::placeholder {
		color: color-mix(in srgb, var(--color-text-muted), transparent 18%);
	}

	.input:hover:not(:disabled):not(:read-only) {
		background: linear-gradient(
			to bottom,
			color-mix(in srgb, var(--answer-accent), var(--color-surface) 94%),
			color-mix(in srgb, var(--answer-accent), var(--color-surface-raised) 92%)
		);
		border-color: color-mix(in srgb, var(--answer-accent), var(--color-border) 42%);
	}

	.input:focus-visible {
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
			var(--answer-accent-h, var(--color-correct-h))
				calc(var(--answer-accent-s, var(--color-correct-s)) + 25%)
				calc(var(--answer-accent-l, var(--color-correct-l)) - 35%)
		);
	}

	.input:disabled {
		cursor: not-allowed;
		opacity: 0.58;
	}

	.input:read-only {
		cursor: default;
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
