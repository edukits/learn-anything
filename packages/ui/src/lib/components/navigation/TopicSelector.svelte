<script lang="ts">
	import { Check, ChevronDown } from '@lucide/svelte';
	import { Select } from 'bits-ui';
	import type { NavTopic } from './types';

	let {
		topics = [],
		value = '',
		placeholder = 'Choose topic',
		disabled = false,
		onchange
	}: {
		topics?: NavTopic[];
		value?: string;
		placeholder?: string;
		disabled?: boolean;
		onchange?: (slug: string) => void;
	} = $props();

	let selectedTopic = $derived(topics.find((topic) => topic.slug === value) ?? null);

	function handleValueChange(nextValue: string) {
		if (nextValue && nextValue !== value) {
			onchange?.(nextValue);
		}
	}
</script>

<Select.Root type="single" value={value} onValueChange={handleValueChange} {disabled}>
	<Select.Trigger class="topic-selector-trigger" aria-label="Switch active topic">
		<span class="topic-selector-value">
			{selectedTopic?.name ?? placeholder}
		</span>
		<ChevronDown size={16} strokeWidth={2.25} aria-hidden="true" />
	</Select.Trigger>
	<Select.Portal>
		<Select.Content class="topic-selector-content" sideOffset={6} align="start">
			<Select.Viewport class="topic-selector-viewport">
				{#if topics.length === 0}
					<p class="topic-selector-empty">No topics enrolled</p>
				{:else}
					{#each topics as topic (topic.id)}
						<Select.Item class="topic-selector-item" value={topic.slug} label={topic.name}>
							{#snippet children({ selected })}
								<span class="topic-selector-item-label">{topic.name}</span>
								{#if selected}
									<Check size={14} strokeWidth={3} aria-hidden="true" />
								{/if}
							{/snippet}
						</Select.Item>
					{/each}
				{/if}
			</Select.Viewport>
		</Select.Content>
	</Select.Portal>
</Select.Root>

<style>
	@property --topic-trigger-grad-from {
		syntax: '<color>';
		inherits: false;
		initial-value: transparent;
	}

	@property --topic-trigger-grad-to {
		syntax: '<color>';
		inherits: false;
		initial-value: transparent;
	}

	@property --topic-trigger-inset {
		syntax: '<color>';
		inherits: false;
		initial-value: transparent;
	}

	:global(.topic-selector-trigger) {
		align-items: center;
		appearance: none;
		background: linear-gradient(to bottom, var(--topic-trigger-grad-from), var(--topic-trigger-grad-to));
		border: 1px solid hsl(var(--color-accent-h) 22% 82%);
		border-radius: var(--radius-md);
		box-shadow: 0 1px 0 inset var(--topic-trigger-inset);
		color: var(--color-text);
		cursor: pointer;
		display: inline-flex;
		font-family: var(--font-display);
		font-size: 0.875rem;
		font-weight: 700;
		gap: var(--space-2);
		justify-content: space-between;
		max-inline-size: min(16rem, 42vw);
		min-block-size: 2.25rem;
		min-inline-size: 9rem;
		padding-inline: var(--space-3);
		transition:
			--topic-trigger-grad-from 120ms ease-out,
			--topic-trigger-grad-to 120ms ease-out,
			--topic-trigger-inset 180ms cubic-bezier(0.22, 1, 0.36, 1),
			border-color 120ms ease-out,
			box-shadow 180ms cubic-bezier(0.22, 1, 0.36, 1),
			transform 100ms cubic-bezier(0.22, 1, 0.36, 1);
		--topic-trigger-grad-from: hsl(var(--color-accent-h) 20% 98%);
		--topic-trigger-grad-to: hsl(var(--color-accent-h) 20% 93%);
		--topic-trigger-inset: hsl(var(--color-accent-h) 15% 100%);
	}

	:global(.topic-selector-trigger:hover),
	:global(.topic-selector-trigger[data-state='open']) {
		--topic-trigger-grad-from: hsl(var(--color-accent-h) 22% 99%);
		--topic-trigger-grad-to: hsl(var(--color-accent-h) 22% 91%);
		border-color: hsl(var(--color-accent-h) 24% 74%);
		box-shadow:
			0 1px 0 inset var(--topic-trigger-inset),
			0 2px 6px hsl(var(--color-accent-h) 15% 50% / 0.1);
	}

	:global(.topic-selector-trigger:active) {
		transform: scale(0.98);
	}

	:global(.topic-selector-trigger[data-disabled]) {
		cursor: not-allowed;
		opacity: 0.58;
	}

	.topic-selector-value {
		flex: 1;
		min-inline-size: 0;
		overflow: hidden;
		text-align: start;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	:global(.topic-selector-content) {
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
		inline-size: var(--bits-select-anchor-width);
		max-block-size: min(18rem, var(--bits-select-content-available-height));
		min-inline-size: var(--bits-select-anchor-width);
		overflow: hidden;
		padding: var(--space-1);
		z-index: 50;
	}

	:global(.topic-selector-viewport) {
		display: grid;
		gap: 1px;
		max-block-size: inherit;
		overflow-y: auto;
	}

	:global(.topic-selector-item) {
		align-items: center;
		border-radius: calc(var(--radius-md) - 2px);
		color: var(--color-text);
		cursor: pointer;
		display: flex;
		font-size: 0.875rem;
		font-weight: 600;
		gap: var(--space-2);
		justify-content: space-between;
		min-block-size: 2.375rem;
		padding-inline: var(--space-3);
	}

	:global(.topic-selector-item[data-highlighted]) {
		background: linear-gradient(
			to bottom,
			color-mix(in srgb, var(--color-accent), var(--color-surface) 78%),
			color-mix(in srgb, var(--color-accent), var(--color-surface-raised) 82%)
		);
		box-shadow: 0 1px 0 inset rgb(255 255 255 / 0.35);
		outline: 0;
	}

	.topic-selector-item-label {
		flex: 1;
		min-inline-size: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.topic-selector-empty {
		color: var(--color-text-muted);
		font-size: 0.875rem;
		margin: 0;
		padding: var(--space-3);
		text-align: center;
	}
</style>
