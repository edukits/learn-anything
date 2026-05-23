<script lang="ts" module>
	export type TabItem = {
		value: string | null;
		label: string;
		disabled?: boolean;
	};
</script>

<script lang="ts">
	let {
		items = [],
		value = $bindable<string | null>(null),
		ariaLabel = 'Tabs',
		class: className = '',
		onchange
	}: {
		items?: TabItem[];
		value?: string | null;
		ariaLabel?: string;
		class?: string;
		onchange?: (value: string | null) => void;
	} = $props();

	function selectTab(nextValue: string | null) {
		if (nextValue === value) return;

		value = nextValue;
		onchange?.(nextValue);
	}
</script>

<div class={['tabs', className]} role="tablist" aria-label={ariaLabel}>
	{#each items as item (item.value ?? '__all__')}
		<button
			type="button"
			role="tab"
			class="tab"
			data-active={value === item.value || undefined}
			aria-selected={value === item.value}
			disabled={item.disabled}
			onclick={() => selectTab(item.value)}
		>
			{item.label}
		</button>
	{/each}
</div>

<style>
	@property --btn-grad-from {
		syntax: '<color>';
		inherits: false;
		initial-value: transparent;
	}

	@property --btn-grad-to {
		syntax: '<color>';
		inherits: false;
		initial-value: transparent;
	}

	@property --btn-inset {
		syntax: '<color>';
		inherits: false;
		initial-value: transparent;
	}

	@property --btn-shadow-color {
		syntax: '<color>';
		inherits: false;
		initial-value: transparent;
	}

	@property --btn-shadow-spread {
		syntax: '<length>';
		inherits: false;
		initial-value: 0px;
	}

	@property --tabs-tray-inset {
		syntax: '<color>';
		inherits: false;
		initial-value: transparent;
	}

	.tabs {
		--tabs-tray-inset: hsl(0 0% 0% / 0.06);
		align-items: center;
		background: linear-gradient(
			to bottom,
			color-mix(in srgb, var(--color-surface-raised), var(--color-surface) 40%),
			color-mix(in srgb, var(--color-surface), var(--color-border) 10%)
		);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		box-shadow:
			inset 0 1px 2px var(--tabs-tray-inset),
			inset 0 -1px 0 hsl(0 0% 100% / 0.45);
		display: inline-flex;
		flex-wrap: wrap;
		gap: 3px;
		inline-size: max-content;
		justify-self: start;
		max-inline-size: 100%;
		padding: 4px;
	}

	.tab {
		appearance: none;
		background: transparent;
		border: 1px solid transparent;
		border-radius: var(--radius-sm);
		color: var(--color-text-muted);
		cursor: pointer;
		flex: 0 0 auto;
		font-family: var(--font-display);
		font-size: 0.82rem;
		font-weight: 700;
		line-height: 1;
		min-block-size: 1.875rem;
		padding: 6px 12px;
		text-transform: capitalize;
		transition:
			--btn-grad-from 120ms ease-out,
			--btn-grad-to 120ms ease-out,
			--btn-inset 200ms cubic-bezier(0.22, 1, 0.36, 1),
			--btn-shadow-color 200ms cubic-bezier(0.22, 1, 0.36, 1),
			--btn-shadow-spread 200ms cubic-bezier(0.22, 1, 0.36, 1),
			background 120ms ease-out,
			border-color 120ms ease-out,
			color 120ms ease-out,
			transform 100ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.tab:focus-visible {
		outline: 3px solid color-mix(in srgb, var(--color-focus), transparent 40%);
		outline-offset: 1px;
	}

	.tab:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	.tab:not([data-active]):hover:not(:disabled) {
		background: color-mix(in srgb, var(--color-surface), var(--color-border) 50%);
		color: var(--color-text);
	}

	.tab:active:not(:disabled) {
		transform: scale(0.97);
	}

	.tab[data-active] {
		--btn-grad-from: hsl(var(--color-accent-h) 20% 98%);
		--btn-grad-to: hsl(var(--color-accent-h) 20% 93%);
		--btn-inset: hsl(var(--color-accent-h) 15% 100%);
		--btn-shadow-color: transparent;
		--btn-shadow-spread: 0px;
		background: linear-gradient(to bottom, var(--btn-grad-from), var(--btn-grad-to));
		border-color: hsl(var(--color-accent-h) 22% 82%);
		box-shadow:
			0 2px 1px inset var(--btn-inset),
			0 1px var(--btn-shadow-spread) 0 var(--btn-shadow-color);
		color: var(--color-text);
	}

	.tab[data-active]:hover:not(:disabled) {
		--btn-grad-from: hsl(var(--color-accent-h) 22% 99%);
		--btn-grad-to: hsl(var(--color-accent-h) 22% 91%);
		--btn-shadow-color: hsl(var(--color-accent-h) 15% 50% / 0.12);
		--btn-shadow-spread: 3px;
		border-color: hsl(var(--color-accent-h) 24% 74%);
	}
</style>
