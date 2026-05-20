<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type ButtonVariant = 'primary' | 'secondary' | 'ghost';
	type ButtonSize = 'sm' | 'md' | 'lg';

	type NativeButtonProps = Omit<
		HTMLButtonAttributes,
		'class' | 'children' | 'label' | 'size' | 'type' | 'variant'
	>;

	type ButtonProps = NativeButtonProps & {
		variant?: ButtonVariant;
		size?: ButtonSize;
		type?: 'button' | 'submit' | 'reset';
		label?: string;
		class?: string;
		children?: Snippet;
	};

	let {
		variant = 'primary',
		size = 'md',
		type = 'button',
		label = 'Button',
		children,
		class: className = '',
		...rest
	}: ButtonProps = $props();
</script>

<button
	{...rest}
	{type}
	class={['la-button', `la-button--${variant}`, `la-button--${size}`, className]}
>
	{#if children}
		{@render children()}
	{:else}
		{label}
	{/if}
</button>

<style>
	.la-button {
		align-items: center;
		appearance: none;
		border: 1px solid transparent;
		border-radius: var(--radius-md);
		cursor: pointer;
		display: inline-flex;
		font-family: var(--font-sans);
		font-weight: 650;
		justify-content: center;
		line-height: 1;
		min-inline-size: max-content;
		text-decoration: none;
		transition:
			background 150ms ease,
			border-color 150ms ease,
			box-shadow 150ms ease,
			color 150ms ease;
	}

	.la-button:focus-visible {
		outline: 3px solid color-mix(in srgb, var(--color-focus), transparent 40%);
		outline-offset: 2px;
	}

	.la-button:disabled {
		cursor: not-allowed;
		opacity: 0.58;
	}

	.la-button--sm {
		font-size: 0.875rem;
		min-block-size: 2rem;
		padding-inline: var(--space-3);
	}

	.la-button--md {
		font-size: 0.9375rem;
		min-block-size: 2.5rem;
		padding-inline: var(--space-4);
	}

	.la-button--lg {
		font-size: 1rem;
		min-block-size: 3rem;
		padding-inline: var(--space-5);
	}

	.la-button--primary {
		background: var(--color-accent);
		box-shadow: var(--shadow-sm);
		color: var(--color-accent-contrast);
	}

	.la-button--primary:hover:not(:disabled) {
		background: var(--color-accent-hover);
		color: var(--color-accent-hover-contrast);
	}

	.la-button--secondary {
		background: var(--color-surface);
		border-color: var(--color-border);
		color: var(--color-text);
	}

	.la-button--secondary:hover:not(:disabled) {
		background: var(--color-surface-raised);
	}

	.la-button--ghost {
		background: transparent;
		color: var(--color-accent);
	}

	.la-button--ghost:hover:not(:disabled) {
		background: color-mix(in srgb, var(--color-accent), transparent 92%);
	}
</style>
