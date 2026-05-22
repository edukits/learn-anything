<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';

	type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'success' | 'danger' | 'warning';
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

		background: linear-gradient(to bottom, var(--btn-grad-from), var(--btn-grad-to));
		box-shadow:
			0 2px 1px inset var(--btn-inset),
			0 1px var(--btn-shadow-spread) 0 var(--btn-shadow-color);

		transition:
			--btn-grad-from 120ms ease-out,
			--btn-grad-to 120ms ease-out,
			--btn-inset 200ms cubic-bezier(0.22, 1, 0.36, 1),
			--btn-shadow-color 200ms cubic-bezier(0.22, 1, 0.36, 1),
			--btn-shadow-spread 200ms cubic-bezier(0.22, 1, 0.36, 1),
			border-color 120ms ease-out,
			color 120ms ease-out,
			transform 100ms cubic-bezier(0.22, 1, 0.36, 1);
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

	/* ── Primary ── */

	[data-variant='primary'] {
		--btn-grad-from: hsl(var(--color-accent-h) var(--color-accent-s) var(--color-accent-l));
		--btn-grad-to: hsl(
			var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) - 15%)
		);
		--btn-inset: hsl(
			var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) + 10%)
		);
		--btn-shadow-color: transparent;
		--btn-shadow-spread: 0px;
		border-color: hsl(
			var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) - 25%)
		);
		color: var(--color-accent-contrast);
	}

	[data-variant='primary']:hover:not(:disabled) {
		--btn-grad-from: hsl(
			var(--color-accent-h) calc(var(--color-accent-s) + 4%) calc(var(--color-accent-l) + 3%)
		);
		--btn-grad-to: hsl(
			var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) - 8%)
		);
		--btn-inset: hsl(
			var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) + 14%)
		);
		--btn-shadow-color: hsl(
			var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) - 20%) / 0.35
		);
		--btn-shadow-spread: 3px;
		border-color: hsl(
			var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) - 18%)
		);
	}

	/* ── Secondary ── */

	[data-variant='secondary'] {
		--btn-grad-from: hsl(var(--color-accent-h) 20% 98%);
		--btn-grad-to: hsl(var(--color-accent-h) 20% 93%);
		--btn-inset: hsl(var(--color-accent-h) 15% 100%);
		--btn-shadow-color: transparent;
		--btn-shadow-spread: 0px;
		border-color: hsl(var(--color-accent-h) 22% 82%);
		color: var(--color-text);
	}

	[data-variant='secondary']:hover:not(:disabled) {
		--btn-grad-from: hsl(var(--color-accent-h) 22% 99%);
		--btn-grad-to: hsl(var(--color-accent-h) 22% 91%);
		--btn-shadow-color: hsl(var(--color-accent-h) 15% 50% / 0.12);
		--btn-shadow-spread: 3px;
		border-color: hsl(var(--color-accent-h) 24% 74%);
	}

	/* ── Ghost ── */

	[data-variant='ghost'] {
		--btn-grad-from: transparent;
		--btn-grad-to: transparent;
		--btn-inset: transparent;
		--btn-shadow-color: transparent;
		--btn-shadow-spread: 0px;
		color: var(--color-accent);
	}

	[data-variant='ghost']:hover:not(:disabled) {
		--btn-grad-from: color-mix(in srgb, var(--color-accent), transparent 90%);
		--btn-grad-to: color-mix(in srgb, var(--color-accent), transparent 90%);
		--btn-shadow-color: color-mix(in srgb, var(--color-accent), transparent 82%);
		--btn-shadow-spread: 0px;
		box-shadow:
			0 0 0 inset transparent,
			0 0 0 1px var(--btn-shadow-color);
	}

	/* ── Success ── */

	[data-variant='success'] {
		--btn-grad-from: hsl(var(--color-success-h) var(--color-success-s) var(--color-success-l));
		--btn-grad-to: hsl(
			var(--color-success-h) var(--color-success-s) calc(var(--color-success-l) - 12%)
		);
		--btn-inset: hsl(
			var(--color-success-h) calc(var(--color-success-s) - 15%) calc(var(--color-success-l) + 14%)
		);
		--btn-shadow-color: transparent;
		--btn-shadow-spread: 0px;
		border-color: hsl(
			var(--color-success-h) var(--color-success-s) calc(var(--color-success-l) - 20%)
		);
		color: var(--color-success-contrast);
	}

	[data-variant='success']:hover:not(:disabled) {
		--btn-grad-from: hsl(
			var(--color-success-h) calc(var(--color-success-s) + 4%) calc(var(--color-success-l) + 3%)
		);
		--btn-grad-to: hsl(
			var(--color-success-h) var(--color-success-s) calc(var(--color-success-l) - 6%)
		);
		--btn-inset: hsl(
			var(--color-success-h) calc(var(--color-success-s) - 15%) calc(var(--color-success-l) + 14%)
		);
		--btn-shadow-color: hsl(
			var(--color-success-h) var(--color-success-s) calc(var(--color-success-l) - 20%) / 0.35
		);
		--btn-shadow-spread: 3px;
		border-color: hsl(
			var(--color-success-h) var(--color-success-s) calc(var(--color-success-l) - 14%)
		);
	}

	/* ── Danger ── */

	[data-variant='danger'] {
		--btn-grad-from: hsl(var(--color-danger-h) var(--color-danger-s) var(--color-danger-l));
		--btn-grad-to: hsl(
			var(--color-danger-h) var(--color-danger-s) calc(var(--color-danger-l) - 12%)
		);
		--btn-inset: hsl(
			var(--color-danger-h) var(--color-danger-s) calc(var(--color-danger-l) + 10%)
		);
		--btn-shadow-color: transparent;
		--btn-shadow-spread: 0px;
		border-color: hsl(
			var(--color-danger-h) var(--color-danger-s) calc(var(--color-danger-l) - 20%)
		);
		color: var(--color-danger-contrast);
	}

	[data-variant='danger']:hover:not(:disabled) {
		--btn-grad-from: hsl(
			var(--color-danger-h) calc(var(--color-danger-s) + 4%) calc(var(--color-danger-l) + 3%)
		);
		--btn-grad-to: hsl(
			var(--color-danger-h) var(--color-danger-s) calc(var(--color-danger-l) - 6%)
		);
		--btn-inset: hsl(
			var(--color-danger-h) var(--color-danger-s) calc(var(--color-danger-l) + 14%)
		);
		--btn-shadow-color: hsl(
			var(--color-danger-h) var(--color-danger-s) calc(var(--color-danger-l) - 20%) / 0.35
		);
		--btn-shadow-spread: 3px;
		border-color: hsl(
			var(--color-danger-h) var(--color-danger-s) calc(var(--color-danger-l) - 14%)
		);
	}

	/* ── Warning ── */

	[data-variant='warning'] {
		--btn-grad-from: hsl(var(--color-warning-h) var(--color-warning-s) var(--color-warning-l));
		--btn-grad-to: hsl(
			var(--color-warning-h) var(--color-warning-s) calc(var(--color-warning-l) - 12%)
		);
		--btn-inset: hsl(
			var(--color-warning-h) var(--color-warning-s) calc(var(--color-warning-l) + 10%)
		);
		--btn-shadow-color: transparent;
		--btn-shadow-spread: 0px;
		border-color: hsl(
			var(--color-warning-h) var(--color-warning-s) calc(var(--color-warning-l) - 20%)
		);
		color: var(--color-warning-contrast);
	}

	[data-variant='warning']:hover:not(:disabled) {
		--btn-grad-from: hsl(
			var(--color-warning-h) calc(var(--color-warning-s) + 4%) calc(var(--color-warning-l) + 3%)
		);
		--btn-grad-to: hsl(
			var(--color-warning-h) var(--color-warning-s) calc(var(--color-warning-l) - 6%)
		);
		--btn-inset: hsl(
			var(--color-warning-h) var(--color-warning-s) calc(var(--color-warning-l) + 14%)
		);
		--btn-shadow-color: hsl(
			var(--color-warning-h) var(--color-warning-s) calc(var(--color-warning-l) - 20%) / 0.35
		);
		--btn-shadow-spread: 3px;
		border-color: hsl(
			var(--color-warning-h) var(--color-warning-s) calc(var(--color-warning-l) - 14%)
		);
	}
</style>
