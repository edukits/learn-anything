<script lang="ts">
	import { DropdownMenu as BitsDropdownMenu, type DropdownMenuRootProps } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import '../../styles/overlay-panel.css';

	export type DropdownMenuHeader = {
		title: string;
		tone?: 'label' | 'text';
		actionHref?: string;
		actionLabel?: string;
	};

	type Props = DropdownMenuRootProps & {
		trigger: Snippet;
		triggerVariant?: 'nav' | 'icon';
		triggerProps?: BitsDropdownMenu.TriggerProps;
		align?: 'start' | 'center' | 'end';
		minWidth?: string;
		maxWidth?: string;
		header?: DropdownMenuHeader;
		children: Snippet;
	};

	let {
		trigger,
		triggerVariant = 'nav',
		triggerProps,
		align = 'start',
		minWidth,
		maxWidth,
		header,
		children,
		...rootProps
	}: Props = $props();

	let triggerClass = $derived(
		triggerVariant === 'icon' ? 'dropdown-menu-trigger-icon' : 'dropdown-menu-trigger-nav'
	);

	let contentStyle = $derived(
		[
			minWidth ? `--overlay-panel-min-inline-size: ${minWidth}` : null,
			maxWidth ? `--overlay-panel-max-inline-size: ${maxWidth}` : null,
			'--overlay-panel-anchor-inline-size: var(--bits-menu-anchor-width)',
			'--overlay-panel-available-inline-size: var(--bits-menu-content-available-width)',
			'--overlay-panel-available-block-size: var(--bits-menu-content-available-height)'
		]
			.filter(Boolean)
			.join('; ')
	);
</script>

<BitsDropdownMenu.Root {...rootProps}>
	<BitsDropdownMenu.Trigger class={triggerClass} {...triggerProps}>
		{@render trigger()}
	</BitsDropdownMenu.Trigger>
	<BitsDropdownMenu.Portal>
		<BitsDropdownMenu.Content
			class="dropdown-menu-content overlay-panel"
			style={contentStyle}
			{align}
			sideOffset={6}
		>
			{#if header}
				<div class="dropdown-menu-header">
					<span class={['dropdown-menu-header-title', header.tone === 'text' && 'tone-text']}>
						{header.title}
					</span>
					{#if header.actionHref && header.actionLabel}
						<a class="dropdown-menu-header-action" href={header.actionHref}>
							{header.actionLabel}
						</a>
					{/if}
				</div>
			{/if}
			{@render children()}
		</BitsDropdownMenu.Content>
	</BitsDropdownMenu.Portal>
</BitsDropdownMenu.Root>

<style>
	:global(.dropdown-menu-trigger-nav) {
		align-items: center;
		appearance: none;
		background: transparent;
		border: 1px solid transparent;
		border-radius: var(--radius-sm);
		color: var(--color-text-muted);
		cursor: pointer;
		display: inline-flex;
		font-family: var(--font-display);
		font-size: inherit;
		font-weight: 600;
		gap: var(--space-2);
		line-height: 1;
		padding: var(--space-2) var(--space-3);
		transition: color 120ms ease-out;
	}

	:global(.dropdown-menu-trigger-nav:hover),
	:global(.dropdown-menu-trigger-nav[data-state='open']) {
		color: var(--color-text);
	}

	:global(.dropdown-menu-trigger-icon) {
		align-items: center;
		appearance: none;
		background: linear-gradient(
			to bottom,
			hsl(var(--color-accent-h) 18% 97%),
			hsl(var(--color-accent-h) 18% 92%)
		);
		border: 1px solid hsl(var(--color-accent-h) 20% 84%);
		border-radius: 999px;
		box-shadow: 0 1px 0 inset hsl(var(--color-accent-h) 15% 100%);
		cursor: pointer;
		display: flex;
		height: 2.25rem;
		justify-content: center;
		width: 2.25rem;
		transition:
			background 150ms ease,
			box-shadow 150ms ease,
			transform 100ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	:global(.dropdown-menu-trigger-icon:hover),
	:global(.dropdown-menu-trigger-icon[data-state='open']) {
		background: linear-gradient(
			to bottom,
			hsl(var(--color-accent-h) 20% 98%),
			hsl(var(--color-accent-h) 20% 90%)
		);
		box-shadow:
			0 1px 0 inset hsl(var(--color-accent-h) 15% 100%),
			0 2px 6px hsl(var(--color-accent-h) 15% 50% / 0.12);
	}

	:global(.dropdown-menu-trigger-icon:active) {
		transform: scale(0.97);
	}

	:global(.dropdown-menu-content) {
		background: linear-gradient(
			to bottom,
			var(--color-surface),
			color-mix(in srgb, var(--color-surface), var(--color-border) 6%)
		);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		box-shadow:
			0 1px 0 inset rgb(255 255 255 / 0.65),
			0 16px 36px rgb(20 24 31 / 0.12),
			0 4px 10px rgb(20 24 31 / 0.06);
		display: flex;
		flex-direction: column;
		padding: var(--space-2);
		z-index: 50;
	}

	:global(.dropdown-menu-header) {
		align-items: center;
		border-block-end: 1px solid var(--color-border);
		display: flex;
		gap: var(--space-3);
		justify-content: space-between;
		margin-block-end: var(--space-2);
		min-inline-size: 0;
		padding: var(--space-2) var(--space-3) var(--space-3);
	}

	:global(.dropdown-menu-header-title) {
		color: var(--color-text-muted);
		flex: 1;
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.02em;
		min-inline-size: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		text-transform: uppercase;
		white-space: nowrap;
	}

	:global(.dropdown-menu-header-title.tone-text) {
		font-size: 0.85rem;
		font-weight: 500;
		letter-spacing: normal;
		text-transform: none;
	}

	:global(.dropdown-menu-header-action) {
		color: var(--color-accent);
		flex-shrink: 0;
		font-size: 0.85rem;
		font-weight: 600;
	}

	:global(.dropdown-menu-header-action:hover) {
		text-decoration: underline;
	}

	:global(.dropdown-menu-group) {
		display: grid;
		gap: var(--space-1);
	}

	:global(.dropdown-menu-content .dropdown-menu-link),
	:global(.dropdown-menu-content .dropdown-menu-button) {
		align-items: center;
		appearance: none;
		background: transparent;
		border: 0;
		border-radius: var(--radius-sm);
		box-sizing: border-box;
		color: var(--color-text);
		cursor: pointer;
		display: flex;
		font: inherit;
		font-size: 0.9375rem;
		font-weight: 500;
		gap: var(--space-2);
		outline: 0;
		padding: var(--space-2) var(--space-3);
		text-align: start;
		text-decoration: none;
		width: 100%;
	}

	:global(.dropdown-menu-content .dropdown-menu-link.layout-stack) {
		align-items: start;
		flex-direction: column;
		gap: 2px;
	}

	:global(.dropdown-menu-content .dropdown-menu-link[data-highlighted]),
	:global(.dropdown-menu-content .dropdown-menu-button[data-highlighted]) {
		background: linear-gradient(
			to bottom,
			color-mix(in srgb, var(--color-accent), var(--color-surface) 78%),
			color-mix(in srgb, var(--color-accent), var(--color-surface-raised) 82%)
		);
		box-shadow: 0 1px 0 inset rgb(255 255 255 / 0.35);
	}

	:global(.dropdown-menu-content .dropdown-menu-link strong) {
		color: var(--color-text);
		display: block;
		font-size: 0.9375rem;
		font-weight: 600;
		overflow-wrap: anywhere;
		white-space: normal;
	}

	:global(.dropdown-menu-content .dropdown-menu-link span) {
		color: var(--color-text-muted);
		display: block;
		font-size: 0.8125rem;
		line-height: 1.45;
		overflow-wrap: anywhere;
		white-space: normal;
	}

	:global(.dropdown-menu-empty) {
		color: var(--color-text-muted);
		font-size: 0.9rem;
		margin: 0;
		padding: var(--space-3);
		text-align: center;
	}
</style>
