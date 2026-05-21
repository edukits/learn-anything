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

<button {...rest} {type} class={['button', className]} data-variant={variant} data-size={size}>
	{#if children}
		{@render children()}
	{:else}
		{label}
	{/if}
</button>

<style>
	@property --tone-top {
		syntax: '<percentage>';
		inherits: false;
		initial-value: 59%;
	}

	@property --tone-bottom {
		syntax: '<percentage>';
		inherits: false;
		initial-value: 44%;
	}

	@property --tone-border {
		syntax: '<percentage>';
		inherits: false;
		initial-value: 34%;
	}

	@property --tone-inset {
		syntax: '<percentage>';
		inherits: false;
		initial-value: 69%;
	}

	.button {
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

	.button:focus-visible {
		outline: 3px solid color-mix(in srgb, var(--color-focus), transparent 40%);
		outline-offset: 2px;
	}

	.button:disabled {
		cursor: not-allowed;
		opacity: 0.58;
	}

	.button:active:not(:disabled) {
		transform: scale(0.97);
	}

	[data-size='sm'] {
		font-size: 0.875rem;
		min-block-size: 2rem;
		padding-inline: var(--space-3);
	}

	[data-size='md'] {
		font-size: 0.9375rem;
		min-block-size: 2.5rem;
		padding-inline: var(--space-4);
	}

	[data-size='lg'] {
		font-size: 1rem;
		min-block-size: 3rem;
		padding-inline: var(--space-5);
	}

	[data-variant='primary'] {
		--tone-top: var(--color-accent-l);
		--tone-bottom: calc(var(--color-accent-l) - 15%);
		--tone-border: calc(var(--color-accent-l) - 25%);
		--tone-inset: calc(var(--color-accent-l) + 10%);
		background: linear-gradient(
			to bottom,
			hsl(var(--color-accent-h) var(--color-accent-s) var(--tone-top)),
			hsl(var(--color-accent-h) var(--color-accent-s) var(--tone-bottom))
		);
		border-color: hsl(var(--color-accent-h) var(--color-accent-s) var(--tone-border));
		box-shadow: 0 2px 1px inset hsl(var(--color-accent-h) var(--color-accent-s) var(--tone-inset));
		color: var(--color-accent-contrast);
		transition:
			--tone-top 100ms ease-out,
			--tone-bottom 100ms ease-out,
			--tone-border 100ms ease-out,
			--tone-inset 100ms ease-out,
			transform 150ms ease-out;
	}

	[data-variant='primary']:hover:not(:disabled) {
		--tone-top: calc(var(--color-accent-l) - 10%);
		--tone-bottom: calc(var(--color-accent-l) - 5%);
		--tone-border: calc(var(--color-accent-l) - 15%);
		--tone-inset: calc(var(--color-accent-l) + 10%);
	}

	[data-variant='secondary'] {
		--tone-top: 98%;
		--tone-bottom: 93%;
		--tone-border: 82%;
		--tone-inset: 100%;
		background: linear-gradient(
			to bottom,
			hsl(var(--color-accent-h) 20% var(--tone-top)),
			hsl(var(--color-accent-h) 20% var(--tone-bottom))
		);
		border-color: hsl(var(--color-accent-h) 22% var(--tone-border));
		box-shadow: 0 2px 1px inset hsl(var(--color-accent-h) 15% var(--tone-inset));
		color: var(--color-text);
		transition:
			--tone-top 100ms ease-out,
			--tone-bottom 100ms ease-out,
			--tone-border 100ms ease-out,
			--tone-inset 100ms ease-out,
			transform 150ms ease-out;
	}

	[data-variant='secondary']:hover:not(:disabled) {
		--tone-top: 96%;
		--tone-bottom: 90%;
		--tone-border: 78%;
		--tone-inset: 100%;
	}

	[data-variant='ghost'] {
		background: transparent;
		color: var(--color-accent);
	}

	[data-variant='ghost']:hover:not(:disabled) {
		background: color-mix(in srgb, var(--color-accent), transparent 92%);
	}
</style>
