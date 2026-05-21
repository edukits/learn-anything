<script lang="ts">
	import RichText from './RichText.svelte';
	import type { MultipleChoiceOptionState } from './types';

	type MultipleChoiceOptionProps = {
		name: string;
		value: string;
		label?: string;
		description?: string;
		selected?: boolean;
		disabled?: boolean;
		state?: MultipleChoiceOptionState;
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
		state = 'neutral',
		id,
		onchange
	}: MultipleChoiceOptionProps = $props();

	let inputId = $derived(id ?? `${name}-${value}`);
	let hasLabel = $derived(Boolean(label?.trim()));
	let hasDescription = $derived(Boolean(description?.trim()));
	let fallbackLabel = $derived(!hasLabel && !hasDescription ? value : undefined);
	let accessibleLabel = $derived([label, description].filter(Boolean).join(' ') || value);
</script>

<label
	class={[
		'la-choice-option',
		selected && 'la-choice-option--selected',
		disabled && 'la-choice-option--disabled',
		state !== 'neutral' && `la-choice-option--${state}`
	]}
	for={inputId}
>
	<input
		id={inputId}
		class="la-choice-option__input"
		type="radio"
		{name}
		{value}
		checked={selected}
		{disabled}
		{onchange}
		aria-label={accessibleLabel}
	/>
	<span class="la-choice-option__control" aria-hidden="true"></span>
	<span
		class={[
			'la-choice-option__content',
			!hasLabel && hasDescription && 'la-choice-option__content--description-only'
		]}
	>
		{#if hasLabel && label}
			<span class="la-choice-option__label">
				<RichText content={label} />
			</span>
		{/if}

		{#if hasDescription && description}
			<span class="la-choice-option__description">
				<RichText content={description} />
			</span>
		{/if}

		{#if fallbackLabel}
			<span class="la-choice-option__label">
				<RichText content={fallbackLabel} />
			</span>
		{/if}
	</span>
</label>

<style>
	.la-choice-option {
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
		grid-template-columns: 1.125rem minmax(0, 1fr);
		padding: var(--space-4);
		position: relative;
		transition:
			background 150ms ease-out,
			border-color 150ms ease-out,
			box-shadow 150ms ease-out,
			transform 100ms ease-out;
	}

	.la-choice-option:hover:not(.la-choice-option--disabled) {
		background: linear-gradient(
			to bottom,
			color-mix(in srgb, var(--color-accent), var(--color-surface) 94%),
			color-mix(in srgb, var(--color-accent), var(--color-surface-raised) 92%)
		);
		border-color: color-mix(in srgb, var(--color-accent), var(--color-border) 42%);
	}

    .la-choice-option:active:not(.la-choice-option--disabled) {
        transform: scale(0.99);
    }

	.la-choice-option--selected {
		background: linear-gradient(
			to bottom,
			color-mix(in srgb, var(--color-accent), var(--color-surface) 90%),
			color-mix(in srgb, var(--color-accent), var(--color-surface-raised) 86%)
		);
		border-color: var(--color-accent);
		box-shadow:
			0 0 0 1px color-mix(in srgb, var(--color-accent), transparent 42%),
			0 8px 20px color-mix(in srgb, var(--color-accent), transparent 86%);
	}

	.la-choice-option--correct {
		border-color: #22a06b;
		box-shadow: 0 0 0 1px color-mix(in srgb, #22a06b, transparent 52%);
	}

	.la-choice-option--incorrect {
		border-color: #dc3d43;
		box-shadow: 0 0 0 1px color-mix(in srgb, #dc3d43, transparent 56%);
	}

	.la-choice-option--disabled {
		cursor: not-allowed;
		opacity: 0.58;
	}

	.la-choice-option__input {
		block-size: 1px;
		inline-size: 1px;
		opacity: 0;
		overflow: hidden;
		position: absolute;
	}

	.la-choice-option__control {
		background: var(--color-surface);
		border: 1px solid color-mix(in srgb, var(--color-border), var(--color-text-muted) 18%);
		border-radius: 999px;
		box-shadow: 0 1px 1px rgb(0 0 0 / 0.08) inset;
		display: grid;
		inline-size: 1.125rem;
		margin-block-start: 0.125rem;
		place-items: center;
		aspect-ratio: 1;
	}

	.la-choice-option__control::after {
		background: var(--color-accent);
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

	.la-choice-option--selected .la-choice-option__control {
		border-color: var(--color-accent);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent), transparent 82%);
	}

	.la-choice-option--selected .la-choice-option__control::after {
		opacity: 1;
		transform: scale(1);
	}

	.la-choice-option__input:focus-visible + .la-choice-option__control {
		outline: 3px solid color-mix(in srgb, var(--color-focus), transparent 42%);
		outline-offset: 3px;
	}

	.la-choice-option__content {
		display: grid;
		gap: var(--space-1);
		min-inline-size: 0;
	}

	.la-choice-option__label {
		font-family: var(--font-display);
		font-size: 1rem;
		font-weight: 600;
		line-height: 1.25;
	}

	.la-choice-option__description {
		color: var(--color-text-muted);
		font-size: 0.9375rem;
		line-height: 1.45;
	}

	.la-choice-option__content--description-only .la-choice-option__description {
		color: var(--color-text);
		font-family: var(--font-display);
		font-size: 1rem;
		font-weight: 600;
		line-height: 1.25;
	}
</style>
