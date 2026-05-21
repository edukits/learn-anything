<script lang="ts">
	import { Check, X } from '@lucide/svelte';
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

	<span class="status" aria-hidden="true">
		{#if optionState === 'correct'}
			<span class="icon icon-animated">
				<Check size={16} strokeWidth={4} />
			</span>
		{:else if optionState === 'incorrect'}
			<span class="icon">
				<X size={16} strokeWidth={4} />
			</span>
		{:else if selected}
			<span class="selected-dot"></span>
		{/if}
	</span>

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
		isolation: isolate;
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
			color-mix(in srgb, var(--accent), var(--color-surface) 91%),
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
		transition:
			filter 150ms ease-out,
			mix-blend-mode 150ms ease-out;
	}

	.selected img,
	.correct img,
	.incorrect img {
		filter: saturate(1.04) contrast(1.02);
		mix-blend-mode: multiply;
	}

	.status {
		background: var(--color-surface);
		border: 1px solid color-mix(in srgb, var(--color-border), var(--color-text-muted) 18%);
		border-radius: 999px;
		box-shadow: 0 1px 1px rgb(0 0 0 / 0.08) inset;
		display: grid;
		inset-block-start: var(--space-3);
		inset-inline-end: var(--space-3);
		min-block-size: 1.75rem;
		min-inline-size: 1.75rem;
		padding: 0.25rem;
		place-items: center;
		position: absolute;
		transition:
			background 180ms ease-out,
			border-color 180ms ease-out,
			box-shadow 180ms ease-out,
			transform 220ms cubic-bezier(0.16, 1, 0.3, 1);
	}

	.selected .status,
	.correct .status,
	.incorrect .status {
		border-color: color-mix(in srgb, var(--accent), black 12%);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent), transparent 82%);
	}

	.correct .status,
	.incorrect .status {
		background: var(--accent);
	}

	.selected-dot {
		background: var(--accent);
		border-radius: 999px;
		display: block;
		inline-size: 0.625rem;
		aspect-ratio: 1;
	}

	.icon {
		color: var(--color-surface);
		display: grid;
		place-items: center;
		transform-origin: center;
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
			transform: scale(1.5);
		}

		to {
			filter: blur(0);
			opacity: 1;
			transform: scale(1);
		}
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
