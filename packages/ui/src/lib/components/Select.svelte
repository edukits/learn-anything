<script lang="ts" module>
	export type SelectOption = {
		value: string;
		label: string;
		disabled?: boolean;
	};
</script>

<script lang="ts">
	import { Check, ChevronDown } from '@lucide/svelte';
	import { Select as SelectPrimitive } from 'bits-ui';
	import '../styles/overlay-panel.css';

	let {
		name,
		options = [],
		value = $bindable(''),
		placeholder = 'Select',
		disabled = false,
		required = false,
		ariaLabel
	}: {
		name?: string;
		options?: SelectOption[];
		value?: string;
		placeholder?: string;
		disabled?: boolean;
		required?: boolean;
		ariaLabel?: string;
	} = $props();

	let selectedOption = $derived(options.find((option) => option.value === value) ?? null);
</script>

{#if name}
	<input type="hidden" {name} {value} {required} />
{/if}

<SelectPrimitive.Root type="single" bind:value {disabled}>
	<SelectPrimitive.Trigger class="select-trigger" aria-label={ariaLabel ?? placeholder}>
		<span class="select-value">
			{selectedOption?.label ?? placeholder}
		</span>
		<ChevronDown size={16} strokeWidth={2.25} aria-hidden="true" />
	</SelectPrimitive.Trigger>
	<SelectPrimitive.Portal>
		<SelectPrimitive.Content
			class="select-content overlay-panel"
			style="--overlay-panel-anchor-inline-size: var(--bits-select-anchor-width); --overlay-panel-available-inline-size: var(--bits-select-content-available-width); --overlay-panel-available-block-size: var(--bits-select-content-available-height); --overlay-panel-min-inline-size: 12rem; --overlay-panel-max-inline-size: 24rem;"
			sideOffset={6}
			align="start"
		>
			<SelectPrimitive.Viewport class="select-viewport overlay-panel__viewport">
				{#each options as option (option.value)}
					<SelectPrimitive.Item
						class="select-item"
						value={option.value}
						label={option.label}
						disabled={option.disabled}
					>
						{#snippet children({ selected })}
							<span class="select-item-label overlay-panel__text">{option.label}</span>
							{#if selected}
								<Check size={14} strokeWidth={3} aria-hidden="true" />
							{/if}
						{/snippet}
					</SelectPrimitive.Item>
				{/each}
			</SelectPrimitive.Viewport>
		</SelectPrimitive.Content>
	</SelectPrimitive.Portal>
</SelectPrimitive.Root>

<style>
	:global(.select-trigger) {
		align-items: center;
		appearance: none;
		background: var(--color-surface-raised);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		color: var(--color-text);
		cursor: pointer;
		display: inline-flex;
		font: inherit;
		gap: var(--space-2);
		inline-size: 100%;
		justify-content: space-between;
		min-block-size: 2.75rem;
		padding: 10px 12px;
		text-align: start;
		transition:
			border-color 120ms ease-out,
			box-shadow 120ms ease-out;
	}

	:global(.select-trigger:hover),
	:global(.select-trigger[data-state='open']) {
		border-color: color-mix(in srgb, var(--color-text-muted), var(--color-border) 50%);
	}

	:global(.select-trigger:focus-visible) {
		border-color: var(--color-focus);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-focus), transparent 40%);
		outline: 0;
	}

	:global(.select-trigger[data-disabled]) {
		cursor: not-allowed;
		opacity: 0.58;
	}

	.select-value {
		flex: 1;
		min-inline-size: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	:global(.select-content) {
		background: linear-gradient(
			to bottom,
			var(--color-surface),
			color-mix(in srgb, var(--color-surface), var(--color-border) 6%)
		);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		box-shadow:
			0 1px 0 inset rgb(255 255 255 / 0.65),
			0 16px 36px rgb(20 24 31 / 0.12);
		padding: var(--space-1);
		z-index: 50;
	}

	:global(.select-viewport) {
		display: grid;
		gap: 1px;
	}

	:global(.select-item) {
		align-items: center;
		border-radius: calc(var(--radius-md) - 2px);
		color: var(--color-text);
		cursor: pointer;
		display: flex;
		font-size: 0.9375rem;
		font-weight: 600;
		gap: var(--space-2);
		justify-content: space-between;
		min-block-size: 2.375rem;
		padding: var(--space-2) var(--space-3);
	}

	:global(.select-item[data-highlighted]) {
		background: linear-gradient(
			to bottom,
			color-mix(in srgb, var(--color-accent), var(--color-surface) 78%),
			color-mix(in srgb, var(--color-accent), var(--color-surface-raised) 82%)
		);
		box-shadow: 0 1px 0 inset rgb(255 255 255 / 0.35);
		outline: 0;
	}

	.select-item-label {
		text-align: start;
	}
</style>
