<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';

	type ButtonVariant = 'primary' | 'secondary' | 'ghost';
	type ButtonSize = 'sm' | 'md' | 'lg';

	type SharedButtonProps = {
		variant?: ButtonVariant;
		size?: ButtonSize;
		label?: string;
		class?: string;
		children?: Snippet;
	};

	type NativeButtonProps = Omit<
		HTMLButtonAttributes,
		'class' | 'children' | 'href' | 'label' | 'size' | 'type' | 'variant'
	>;

	type NativeAnchorProps = Omit<
		HTMLAnchorAttributes,
		'class' | 'children' | 'disabled' | 'label' | 'size' | 'variant'
	>;

	type ButtonElementProps = SharedButtonProps &
		NativeButtonProps & {
			href?: undefined;
			type?: 'button' | 'submit' | 'reset';
		};

	type AnchorElementProps = SharedButtonProps &
		NativeAnchorProps & {
			href: NonNullable<HTMLAnchorAttributes['href']>;
			disabled?: never;
		};

	type ButtonProps = ButtonElementProps | AnchorElementProps;

	let props: ButtonProps = $props();

	let variant = $derived(props.variant ?? 'primary');
	let size = $derived(props.size ?? 'md');
	let label = $derived(props.label ?? 'Button');
	let children = $derived(props.children);
	let className = $derived(props.class ?? '');

	let anchorProps = $derived.by(() => {
		const {
			variant: _variant,
			size: _size,
			label: _label,
			children: _children,
			class: _className,
			...attributes
		} = props as AnchorElementProps;

		return attributes;
	});

	let buttonProps = $derived.by(() => {
		const {
			variant: _variant,
			size: _size,
			label: _label,
			children: _children,
			class: _className,
			href: _href,
			type = 'button',
			...attributes
		} = props as ButtonElementProps;

		return { ...attributes, type };
	});
</script>

{#if props.href}
	<a {...anchorProps} class={['button', className]} data-variant={variant} data-size={size}>
		{#if children}
			{@render children()}
		{:else}
			{label}
		{/if}
	</a>
{:else}
	<button {...buttonProps} class={['button', className]} data-variant={variant} data-size={size}>
		{#if children}
			{@render children()}
		{:else}
			{label}
		{/if}
	</button>
{/if}

<style>
	.button {
		align-items: center;
		appearance: none;
		border: 1px solid transparent;
		border-radius: var(--radius-md);
		cursor: pointer;
		display: inline-flex;
		font-family: var(--font-display);
		font-weight: 600;
		gap: var(--space-2);
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
		background: linear-gradient(
			to bottom,
			hsl(var(--color-accent-h) var(--color-accent-s) var(--color-accent-l)),
			hsl(var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) - 15%))
		);
		border-color: hsl(
			var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) - 25%)
		);
		box-shadow: 0 2px 1px inset
			hsl(var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) + 10%));
		color: var(--color-accent-contrast);
	}

	[data-variant='primary']:hover:not(:disabled) {
		background: linear-gradient(
			to bottom,
			hsl(var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) - 10%)),
			hsl(var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) - 5%))
		);
		border-color: hsl(
			var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) - 15%)
		);
	}

	[data-variant='secondary'] {
		background: linear-gradient(
			to bottom,
			hsl(var(--color-accent-h) 20% 98%),
			hsl(var(--color-accent-h) 20% 93%)
		);
		border-color: hsl(var(--color-accent-h) 22% 82%);
		box-shadow: 0 2px 1px inset hsl(var(--color-accent-h) 15% 100%);
		color: var(--color-text);
	}

	[data-variant='secondary']:hover:not(:disabled) {
		background: linear-gradient(
			to bottom,
			hsl(var(--color-accent-h) 20% 96%),
			hsl(var(--color-accent-h) 20% 90%)
		);
		border-color: hsl(var(--color-accent-h) 22% 78%);
	}

	[data-variant='ghost'] {
		background: transparent;
		color: var(--color-accent);
	}

	[data-variant='ghost']:hover:not(:disabled) {
		background: color-mix(in srgb, var(--color-accent), transparent 92%);
	}
</style>
