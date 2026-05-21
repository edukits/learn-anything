<script lang="ts">
	import { Check, X } from '@lucide/svelte';
	import RichText from './RichText.svelte';
	import type { MultipleChoiceOptionState } from './types';

	type MultipleChoiceOptionProps = {
		name: string;
		value: string;
		label?: string;
		description?: string;
		selected?: boolean;
		disabled?: boolean;
		locked?: boolean;
		state?: MultipleChoiceOptionState;
		controlType?: 'radio' | 'checkbox';
		id?: string;
		onchange?: (event: Event) => void;
	};

	let {
		name,
		value,
		label,
		description,
		selected = false,
		disabled = false,
		locked = false,
		state: optionState = 'neutral',
		controlType = 'radio',
		id,
		onchange
	}: MultipleChoiceOptionProps = $props();

	let inputId = $derived(id ?? `${name}-${value}`);
	let hasLabel = $derived(Boolean(label?.trim()));
	let hasDescription = $derived(Boolean(description?.trim()));
	let fallbackLabel = $derived(!hasLabel && !hasDescription ? value : undefined);
	let accessibleLabel = $derived([label, description].filter(Boolean).join(' ') || value);
	let isUnavailable = $derived(disabled || locked);

	let hasTrackedOptionState = $state(false);
	let previousOptionState = $state<MultipleChoiceOptionState>('neutral');
	let playCorrectIconAnimation = $state(false);

	$effect(() => {
		if (!hasTrackedOptionState) {
			hasTrackedOptionState = true;
			previousOptionState = optionState;
			return;
		}

		const prev = previousOptionState;

		if (optionState === 'correct' && prev !== 'correct') {
			playCorrectIconAnimation = true;
		} else if (optionState !== 'correct') {
			playCorrectIconAnimation = false;
		}

		previousOptionState = optionState;
	});
</script>

<label
	class={[
		'option',
		selected && 'selected',
		disabled && !locked && 'disabled',
		locked && 'locked',
		`option-${controlType}`,
		optionState !== 'neutral' && optionState
	]}
	for={inputId}
>
	<input
		id={inputId}
		class="input"
		type={controlType}
		{name}
		{value}
		checked={selected}
		disabled={isUnavailable}
		{onchange}
		aria-label={accessibleLabel}
	/>
	<span class="control" aria-hidden="true">
		{#if optionState === 'correct'}
			<span class={['icon', playCorrectIconAnimation && 'icon-animated']}>
				<Check size={12} strokeWidth={4} />
			</span>
		{:else if optionState === 'incorrect'}
			<span class="icon">
				<X size={12} strokeWidth={4} />
			</span>
		{:else if selected && controlType === 'checkbox'}
			<span class="icon">
				<Check size={12} strokeWidth={4} />
			</span>
		{/if}
	</span>
	<div class={['content', !hasLabel && hasDescription && 'description-only']}>
		{#if hasLabel && label}
			<div class="label">
				<RichText content={label} />
			</div>
		{/if}

		{#if hasDescription && description}
			<div class="description">
				<RichText content={description} />
			</div>
		{/if}

		{#if fallbackLabel}
			<div class="label">
				<RichText content={fallbackLabel} />
			</div>
		{/if}
	</div>
</label>

<style>
	.option {
		--accent: var(--color-accent);
		--control-size: 1.125rem;
		align-items: start;
		background: linear-gradient(
			to bottom,
			var(--color-surface),
			color-mix(in srgb, var(--color-surface-raised), transparent 38%)
		);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		box-shadow: 0 1px 0 rgb(255 255 255 / 0.75) inset;
		color: var(--color-text);
		cursor: pointer;
		display: grid;
		gap: var(--space-3);
		grid-template-columns: var(--control-size) minmax(0, 1fr);
		padding: var(--space-4);
		position: relative;
		transition:
			background 150ms ease-out,
			border-color 150ms ease-out,
			box-shadow 150ms ease-out,
			transform 100ms ease-out;
	}

	.option:hover:not(.disabled):not(.locked) {
		background: linear-gradient(
			to bottom,
			color-mix(in srgb, var(--accent), var(--color-surface) 94%),
			color-mix(in srgb, var(--accent), var(--color-surface-raised) 92%)
		);
		border-color: color-mix(in srgb, var(--accent), var(--color-border) 42%);
	}

	.option:active:not(.disabled):not(.locked) {
		transform: scale(0.99);
	}

	.correct {
		--accent: var(--color-correct);
	}

	.incorrect {
		--accent: var(--color-incorrect);
	}

	.selected,
	.correct,
	.incorrect {
		background: linear-gradient(
			to bottom,
			color-mix(in srgb, var(--accent), var(--color-surface) 90%),
			color-mix(in srgb, var(--accent), var(--color-surface-raised) 86%)
		);
		border-color: var(--accent);
		box-shadow:
			0 0 0 1px color-mix(in srgb, var(--accent), transparent 42%),
			0 8px 20px color-mix(in srgb, var(--accent), transparent 86%);
	}

	.disabled {
		cursor: not-allowed;
		opacity: 0.58;
	}

	.locked {
		cursor: default;
	}

	.input {
		block-size: 1px;
		inline-size: 1px;
		opacity: 0;
		overflow: hidden;
		position: absolute;
	}

	.control {
		background: var(--color-surface);
		border: 1px solid color-mix(in srgb, var(--color-border), var(--color-text-muted) 18%);
		block-size: var(--control-size);
		border-radius: calc(var(--control-size) / 2);
		box-shadow: 0 1px 1px rgb(0 0 0 / 0.08) inset;
		display: grid;
		inline-size: var(--control-size);
		margin-block-start: 0.125rem;
		place-items: center;
		transform: rotate(0deg);
		transition:
			background 180ms ease-out,
			border-color 180ms ease-out,
			border-radius 220ms ease-out,
			box-shadow 180ms ease-out,
			transform 400ms cubic-bezier(0.16, 1, 0.3, 1);
	}

	.control::after {
		background: var(--accent);
		border-radius: inherit;
		content: '';
		inline-size: 0.5rem;
		opacity: 0;
		transform: scale(0.65);
		transition:
			opacity 120ms ease-out,
			transform 120ms ease-out;
		aspect-ratio: 1;
	}

	.option-checkbox .control {
		border-radius: 0.25rem;
	}

	.selected .control {
		border-color: var(--accent);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent), transparent 82%);
	}

	.option-checkbox.selected .control {
		background: var(--accent);
	}

	.option-checkbox.selected .control::after {
		content: none;
	}

	.correct .control,
	.incorrect .control {
		border-color: color-mix(in srgb, var(--accent), black 12%);
		background: var(--accent);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent), transparent 82%);
	}

	.correct .control {
		border-radius: 0.1875rem;
		transform: rotate(45deg);
	}

	.option-checkbox.correct .control {
		transform: none;
	}

	.selected .control::after {
		opacity: 1;
		transform: scale(1);
	}

	.correct .control::after,
	.incorrect .control::after {
		content: none;
	}

	.icon {
		color: var(--color-surface);
		display: grid;
		place-items: center;
		transform-origin: center;
	}

	.correct .icon {
		transform: rotate(-45deg);
	}

	.option-checkbox .icon,
	.option-checkbox.correct .icon {
		transform: none;
	}

	.correct .icon.icon-animated {
		animation: icon-in 500ms cubic-bezier(0.16, 1, 0.3, 1);
		animation-delay: 180ms;
		animation-fill-mode: both;
	}

	@keyframes icon-in {
		from {
			filter: blur(1px);
			opacity: 0;
			transform: rotate(-45deg) scale(1.5);
		}

		to {
			filter: blur(0);
			opacity: 1;
			transform: rotate(-45deg) scale(1);
		}
	}

	.option-checkbox.correct .icon.icon-animated {
		animation-name: checkbox-icon-in;
	}

	@keyframes checkbox-icon-in {
		from {
			filter: blur(1px);
			opacity: 0;
			transform: scale(1.5);
		}

		to {
			filter: blur(0);
			opacity: 1;
			transform: scale(1);
		}
	}

	.input:focus-visible + .control {
		outline: 3px solid color-mix(in srgb, var(--color-focus), transparent 42%);
		outline-offset: 3px;
	}

	.content {
		display: grid;
		gap: var(--space-1);
		min-inline-size: 0;
	}

	.label {
		font-family: var(--font-display);
		font-size: 1rem;
		font-weight: 600;
		line-height: 1.25;
	}

	.description {
		color: var(--color-text-muted);
		font-size: 0.9375rem;
		line-height: 1.45;
	}

	.description-only .description {
		color: var(--color-text);
		font-family: var(--font-display);
		font-size: 1rem;
		font-weight: 600;
		line-height: 1.25;
	}
</style>
