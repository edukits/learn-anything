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
	@property --btn-accent-l-top {
		syntax: '<percentage>';
		inherits: false;
		initial-value: 59%;
	}

	@property --btn-accent-l-bottom {
		syntax: '<percentage>';
		inherits: false;
		initial-value: 44%;
	}

	@property --btn-accent-l-border {
		syntax: '<percentage>';
		inherits: false;
		initial-value: 34%;
	}

	@property --btn-accent-l-inset {
		syntax: '<percentage>';
		inherits: false;
		initial-value: 69%;
	}

	.la-button {
		align-items: center;
		appearance: none;
		border: 1px solid transparent;
		border-radius: var(--radius-md);
		cursor: pointer;
		display: inline-flex;
		font-family: var(--font-display);
		font-weight: 600;
		justify-content: center;
		line-height: 1;
		min-inline-size: max-content;
		text-decoration: none;
		transition:
			background 150ms ease-out,
			border-color 150ms ease-out,
			box-shadow 150ms ease-out,
			color 150ms ease-out,
            transform 150ms ease-out;
	}

	.la-button:focus-visible {
		outline: 3px solid color-mix(in srgb, var(--color-focus), transparent 40%);
		outline-offset: 2px;
	}

	.la-button:disabled {
		cursor: not-allowed;
		opacity: 0.58;
	}

	.la-button:active:not(:disabled) {
		transform: scale(0.97);
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
		--btn-accent-l-top: var(--color-accent-l);
		--btn-accent-l-bottom: calc(var(--color-accent-l) - 15%);
		--btn-accent-l-border: calc(var(--color-accent-l) - 25%);
		--btn-accent-l-inset: calc(var(--color-accent-l) + 10%);
		background: linear-gradient(
			to bottom,
			hsl(var(--color-accent-h) var(--color-accent-s) var(--btn-accent-l-top)),
			hsl(var(--color-accent-h) var(--color-accent-s) var(--btn-accent-l-bottom))
		);
		border-color: hsl(var(--color-accent-h) var(--color-accent-s) var(--btn-accent-l-border));
		box-shadow: 0 2px 1px inset
			hsl(var(--color-accent-h) var(--color-accent-s) var(--btn-accent-l-inset));
		color: var(--color-accent-contrast);
		transition:
			--btn-accent-l-top 100ms ease-out,
			--btn-accent-l-bottom 100ms ease-out,
			--btn-accent-l-border 100ms ease-out,
			--btn-accent-l-inset 100ms ease-out,
			transform 150ms ease-out;
	}

	.la-button--primary:hover:not(:disabled) {
		--btn-accent-l-top: calc(var(--color-accent-l) - 10%);
		--btn-accent-l-bottom: calc(var(--color-accent-l) - 5%);
		--btn-accent-l-border: calc(var(--color-accent-l) - 15%);
		--btn-accent-l-inset: calc(var(--color-accent-l) + 10%);
	}

	.la-button--secondary {
		--btn-accent-l-top: 98%;
		--btn-accent-l-bottom: 93%;
		--btn-accent-l-border: 82%;
		--btn-accent-l-inset: 100%;
		background: linear-gradient(
			to bottom,
			hsl(var(--color-accent-h) 20% var(--btn-accent-l-top)),
			hsl(var(--color-accent-h) 20% var(--btn-accent-l-bottom))
		);
		border-color: hsl(var(--color-accent-h) 22% var(--btn-accent-l-border));
		box-shadow: 0 2px 1px inset
			hsl(var(--color-accent-h) 15% var(--btn-accent-l-inset));
		color: var(--color-text);
		transition:
			--btn-accent-l-top 100ms ease-out,
			--btn-accent-l-bottom 100ms ease-out,
			--btn-accent-l-border 100ms ease-out,
			--btn-accent-l-inset 100ms ease-out,
			transform 150ms ease-out;
	}

	.la-button--secondary:hover:not(:disabled) {
		--btn-accent-l-top: 96%;
		--btn-accent-l-bottom: 90%;
		--btn-accent-l-border: 78%;
		--btn-accent-l-inset: 100%;
	}

	.la-button--ghost {
		background: transparent;
		color: var(--color-accent);
	}

	.la-button--ghost:hover:not(:disabled) {
		background: color-mix(in srgb, var(--color-accent), transparent 92%);
	}
</style>
