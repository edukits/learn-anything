<script lang="ts">
	import GradingIndicator from './GradingIndicator.svelte';
	import RichText from './RichText.svelte';
	import type { MultipleChoiceOptionState } from './types';

	type ImageChoiceOptionProps = {
		name: string;
		value: string;
		imageSrc: string;
		imageAlt?: string;
		label?: string;
		selected?: boolean;
		disabled?: boolean;
		locked?: boolean;
		state?: MultipleChoiceOptionState;
		id?: string;
		onchange?: (event: Event) => void;
	};

	let {
		name,
		value,
		imageSrc,
		imageAlt,
		label,
		selected = false,
		disabled = false,
		locked = false,
		state: optionState = 'neutral',
		id,
		onchange
	}: ImageChoiceOptionProps = $props();

	let inputId = $derived(id ?? `${name}-${value}`);
	let hasLabel = $derived(Boolean(label?.trim()));
	let accessibleLabel = $derived(label?.trim() || imageAlt?.trim() || value);
	let isUnavailable = $derived(disabled || locked);
</script>

<label
	class={[
		'option',
		selected && 'selected',
		disabled && !locked && 'disabled',
		locked && 'locked',
		optionState !== 'neutral' && optionState
	]}
	for={inputId}
>
	<input
		id={inputId}
		class="input"
		type="radio"
		{name}
		{value}
		checked={selected}
		disabled={isUnavailable}
		{onchange}
		aria-label={accessibleLabel}
	/>

	<span class="image-frame">
		<img src={imageSrc} alt={imageAlt ?? accessibleLabel} loading="lazy" />
	</span>

	<GradingIndicator
		class="status"
		state={optionState}
		{selected}
		selectedMark="dot"
		size="1.75rem"
		dotSize="0.625rem"
		iconSize={16}
		ariaLabel=""
	/>

	{#if hasLabel && label}
		<span class="label">
			<RichText content={label} />
		</span>
	{/if}
</label>

<style>
	.option {
		--accent: var(--color-accent);
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
		grid-template-rows: minmax(0, 1fr) auto;
		min-block-size: 12rem;
		padding: var(--space-3);
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
		--accent: var(--color-success);
		color: hsl(
			var(--color-success-h) calc(var(--color-success-s) + 25%) calc(var(--color-success-l) - 35%)
		);
	}

	.incorrect {
		--accent: var(--color-danger);
		color: hsl(
			var(--color-danger-h) calc(var(--color-danger-s) + 25%)
				calc(var(--color-danger-l) - 35%)
		);
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

	.image-frame {
		align-items: center;
		aspect-ratio: 1.2;
		display: flex;
		justify-content: center;
		min-block-size: 0;
		overflow: hidden;
	}

	img {
		block-size: 100%;
		inline-size: 100%;
		object-fit: contain;
		pointer-events: none;
	}

	.option :global(.status) {
		inset-block-start: var(--space-3);
		inset-inline-end: var(--space-3);
		position: absolute;
	}

	.input:focus-visible + .image-frame {
		outline: 3px solid color-mix(in srgb, var(--color-focus), transparent 42%);
		outline-offset: 3px;
	}

	.label {
		font-family: var(--font-display);
		font-size: 0.9375rem;
		font-weight: 600;
		line-height: 1.25;
		min-block-size: 1.25rem;
		text-align: center;
	}
</style>
