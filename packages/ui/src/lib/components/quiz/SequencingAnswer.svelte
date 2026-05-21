<script lang="ts">
	import { ArrowDown, ArrowUp, Check, GripVertical, X } from '@lucide/svelte';
	import { flip } from 'svelte/animate';
	import { cubicOut } from 'svelte/easing';
	import Button from '../Button.svelte';
	import RichText from './RichText.svelte';
	import type { Sortable, SortableStopEvent } from '@shopify/draggable';
	import type { SequencingItemData, SequencingSubmitResult } from './types';

	type SequencingAnswerProps = {
		items: SequencingItemData[];
		value?: string[];
		name?: string;
		legend?: string;
		disabled?: boolean;
		correctOrder?: string[] | null;
		submitted?: boolean;
		showSubmitButton?: boolean;
		submitLabel?: string;
		class?: string;
		onreorder?: (value: string[]) => void;
		onsubmit?: (result: SequencingSubmitResult) => void;
	};

	let {
		items,
		value = $bindable<string[]>(items.map((item) => item.value)),
		name = 'sequencing-answer',
		legend = 'Sequence items',
		disabled = false,
		correctOrder = null,
		submitted = $bindable(false),
		showSubmitButton = false,
		submitLabel = 'Submit answer',
		class: className = '',
		onreorder,
		onsubmit
	}: SequencingAnswerProps = $props();

	let listElement = $state<HTMLElement | undefined>();
	let sortable: Sortable | undefined;
	let sortableSetupId = 0;

	let uniqueItems = $derived.by(() => {
		const seenValues = new Set<string>();

		return items.filter((item) => {
			if (seenValues.has(item.value)) {
				return false;
			}

			seenValues.add(item.value);
			return true;
		});
	});
	let itemByValue = $derived(new Map(uniqueItems.map((item) => [item.value, item])));
	let orderedItems = $derived.by(() => {
		const seenValues = new Set<string>();
		const orderedValues = value.filter((itemValue) => {
			if (!itemByValue.has(itemValue) || seenValues.has(itemValue)) {
				return false;
			}

			seenValues.add(itemValue);
			return true;
		});
		const missingValues = uniqueItems
			.map((item) => item.value)
			.filter((itemValue) => !seenValues.has(itemValue));

		return [...orderedValues, ...missingValues].map((itemValue) => itemByValue.get(itemValue)!);
	});
	let orderedValues = $derived(orderedItems.map((item) => item.value));
	let hasAnswerKey = $derived(correctOrder !== null);
	let isLocked = $derived(disabled || submitted);
	let canSubmit = $derived(!disabled && !submitted && orderedItems.length > 0);
	let listId = $derived(`${name}-list`);

	$effect(() => {
		const setupId = ++sortableSetupId;

		sortable?.destroy();
		sortable = undefined;

		if (!listElement || isLocked || orderedItems.length < 2) {
			return;
		}

		void import('@shopify/draggable').then(({ Sortable }) => {
			if (setupId !== sortableSetupId || !listElement || isLocked) {
				return;
			}

			sortable = new Sortable(listElement, {
				draggable: '.sequence-item',
				handle: '.drag-handle',
				mirror: {
					constrainDimensions: true
				}
			});

			sortable.on('sortable:stop', handleSortStop);
		});

		return () => {
			sortable?.destroy();
			sortable = undefined;
		};
	});

	function getItemLabel(item: SequencingItemData) {
		return item.label ?? item.description ?? item.value;
	}

	function getPositionState(item: SequencingItemData, index: number) {
		if (!submitted || !hasAnswerKey || correctOrder === null) {
			return 'neutral';
		}

		return correctOrder[index] === item.value ? 'correct' : 'incorrect';
	}

	function moveItem(fromIndex: number, toIndex: number) {
		if (isLocked || fromIndex === toIndex || toIndex < 0 || toIndex >= orderedValues.length) {
			return;
		}

		const nextValue = [...orderedValues];
		const [movedValue] = nextValue.splice(fromIndex, 1);
		nextValue.splice(toIndex, 0, movedValue);
		value = nextValue;
		onreorder?.(nextValue);
	}

	function handleSortStop(event: SortableStopEvent) {
		if (event.oldIndex === event.newIndex || !listElement) {
			return;
		}

		const nextValue = Array.from(listElement.querySelectorAll<HTMLElement>('.sequence-item'))
			.map((element) => element.dataset.value)
			.filter((itemValue): itemValue is string => Boolean(itemValue));

		value = nextValue;
		onreorder?.(nextValue);
	}

	function hasCorrectOrder() {
		if (correctOrder === null || orderedValues.length !== correctOrder.length) {
			return false;
		}

		return orderedValues.every((itemValue, index) => itemValue === correctOrder[index]);
	}

	function submitSequence() {
		if (!canSubmit) {
			return;
		}

		const isCorrect = correctOrder === null ? null : hasCorrectOrder();

		submitted = true;
		onsubmit?.({
			value: orderedValues,
			correct: isCorrect
		});
	}
</script>

<div class={['sequencing-answer', className]}>
	<fieldset disabled={isLocked}>
		<legend>{legend}</legend>

		<div id={listId} bind:this={listElement} class="sequence-list" role="list" aria-label={legend}>
			{#each orderedItems as item, index (item.value)}
				{@const positionState = getPositionState(item, index)}
				<div
					class={[
						'sequence-item',
						`sequence-item-${positionState}`,
						isLocked && 'locked',
						item.disabled && !isLocked && 'disabled'
					]}
					animate:flip={{ duration: 220, easing: cubicOut }}
					role="listitem"
					data-value={item.value}
				>
					<button
						type="button"
						class="drag-handle"
						disabled={isLocked || item.disabled}
						aria-label={`Move ${getItemLabel(item)}`}
					>
						<GripVertical size={18} strokeWidth={2.4} />
					</button>

					<div class="position" aria-hidden="true">{index + 1}</div>

					<div class="content">
						<div class="label">
							<RichText content={item.label ?? item.value} />
						</div>

						{#if item.description}
							<div class="description">
								<RichText content={item.description} />
							</div>
						{/if}
					</div>

					{#if submitted && hasAnswerKey}
						<span class={['result-icon', positionState]} aria-hidden="true">
							{#if positionState === 'correct'}
								<Check size={14} strokeWidth={4} />
							{:else}
								<X size={14} strokeWidth={4} />
							{/if}
						</span>
					{/if}

					<div class="keyboard-controls">
						<button
							type="button"
							class="icon-button"
							disabled={isLocked || item.disabled || index === 0}
							aria-label={`Move ${getItemLabel(item)} up`}
							onclick={() => moveItem(index, index - 1)}
						>
							<ArrowUp size={16} strokeWidth={2.4} />
						</button>
						<button
							type="button"
							class="icon-button"
							disabled={isLocked || item.disabled || index === orderedItems.length - 1}
							aria-label={`Move ${getItemLabel(item)} down`}
							onclick={() => moveItem(index, index + 1)}
						>
							<ArrowDown size={16} strokeWidth={2.4} />
						</button>
					</div>
				</div>
			{/each}
		</div>
	</fieldset>

	{#if showSubmitButton}
		<div class="footer">
			<Button
				variant="secondary"
				size="sm"
				label={submitLabel}
				disabled={!canSubmit}
				onclick={() => submitSequence()}
			/>
		</div>
	{/if}
</div>

<style>
	.sequencing-answer {
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

	.sequence-list {
		display: grid;
		gap: var(--space-3);
	}

	.sequence-item {
		--accent: var(--color-accent);
		align-items: center;
		background: linear-gradient(
			to bottom,
			var(--color-surface),
			color-mix(in srgb, var(--color-surface-raised), transparent 38%)
		);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		box-shadow: 0 1px 0 rgb(255 255 255 / 0.75) inset;
		color: var(--color-text);
		display: grid;
		gap: var(--space-3);
		grid-template-columns: 2rem 1.75rem minmax(0, 1fr) auto auto;
		min-block-size: 4rem;
		padding: var(--space-3);
		transition:
			background 150ms ease-out,
			border-color 150ms ease-out,
			box-shadow 150ms ease-out;
	}

	.sequence-item:hover:not(.disabled):not(.locked) {
		background: linear-gradient(
			to bottom,
			color-mix(in srgb, var(--accent), var(--color-surface) 94%),
			color-mix(in srgb, var(--accent), var(--color-surface-raised) 92%)
		);
		border-color: color-mix(in srgb, var(--accent), var(--color-border) 42%);
	}

	.sequence-item-correct,
	.sequence-item-incorrect {
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

	.sequence-item-correct {
		--accent: var(--color-correct);
	}

	.sequence-item-incorrect {
		--accent: var(--color-incorrect);
	}

	.disabled {
		opacity: 0.58;
	}

	.locked {
		cursor: default;
	}

	.drag-handle,
	.icon-button {
		align-items: center;
		appearance: none;
		background: transparent;
		border: 0;
		border-radius: var(--radius-sm);
		color: var(--color-text-muted);
		display: inline-flex;
		justify-content: center;
		padding: 0;
	}

	.drag-handle {
		block-size: 2rem;
		cursor: grab;
		inline-size: 2rem;
		touch-action: none;
	}

	.drag-handle:active:not(:disabled) {
		cursor: grabbing;
	}

	.drag-handle:hover:not(:disabled),
	.icon-button:hover:not(:disabled) {
		background: color-mix(in srgb, var(--color-accent), transparent 92%);
		color: var(--color-accent);
	}

	.drag-handle:focus-visible,
	.icon-button:focus-visible {
		outline: 3px solid color-mix(in srgb, var(--color-focus), transparent 40%);
		outline-offset: 2px;
	}

	.drag-handle:disabled,
	.icon-button:disabled {
		cursor: not-allowed;
		opacity: 0.42;
	}

	.position {
		align-items: center;
		background: var(--color-surface);
		border: 1px solid color-mix(in srgb, var(--color-border), var(--color-text-muted) 18%);
		border-radius: 999px;
		block-size: 1.75rem;
		color: var(--color-text-muted);
		display: inline-flex;
		font-size: 0.8125rem;
		font-weight: 800;
		inline-size: 1.75rem;
		justify-content: center;
	}

	.content {
		display: grid;
		gap: var(--space-1);
		min-inline-size: 0;
	}

	.label {
		font-weight: 700;
		line-height: 1.35;
	}

	.description {
		color: var(--color-text-muted);
		font-size: 0.875rem;
		line-height: 1.45;
	}

	.result-icon {
		align-items: center;
		background: var(--accent);
		border-radius: 999px;
		color: var(--color-surface);
		display: inline-flex;
		justify-content: center;
		block-size: 1.25rem;
		inline-size: 1.25rem;
	}

	.keyboard-controls {
		display: flex;
		gap: var(--space-1);
	}

	.icon-button {
		block-size: 1.75rem;
		cursor: pointer;
		inline-size: 1.75rem;
	}

	.footer {
		align-items: center;
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		justify-content: end;
	}

	:global(.draggable-mirror) {
		box-sizing: border-box;
		opacity: 0.92;
		pointer-events: none;
		z-index: 1000;
	}

	@media (max-width: 520px) {
		.sequence-item {
			grid-template-columns: 2rem 1.75rem minmax(0, 1fr) auto;
		}

		.result-icon {
			grid-column: 2;
		}

		.keyboard-controls {
			grid-column: 3 / -1;
			justify-content: end;
		}
	}
</style>
