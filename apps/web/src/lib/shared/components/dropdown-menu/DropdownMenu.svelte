<script lang="ts">
	import { DropdownMenu as BitsDropdownMenu, type DropdownMenuRootProps } from 'bits-ui';
	import type { Snippet } from 'svelte';

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
		[minWidth ? `min-inline-size: ${minWidth}` : null, maxWidth ? `max-inline-size: ${maxWidth}` : null]
			.filter(Boolean)
			.join('; ') || undefined
	);
</script>

<BitsDropdownMenu.Root {...rootProps}>
	<BitsDropdownMenu.Trigger class={triggerClass} {...triggerProps}>
		{@render trigger()}
	</BitsDropdownMenu.Trigger>
	<BitsDropdownMenu.Portal>
		<BitsDropdownMenu.Content
			class="dropdown-menu-content"
			style={contentStyle}
			{align}
			sideOffset={4}
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
		background: transparent;
		border: 0;
		border-radius: var(--radius-sm);
		color: var(--color-text-muted);
		cursor: pointer;
		display: inline-flex;
		font: inherit;
		font-weight: 600;
		gap: 4px;
		padding: 8px 12px;
		transition:
			background 150ms ease,
			color 150ms ease;
	}

	:global(.dropdown-menu-trigger-nav:hover),
	:global(.dropdown-menu-trigger-nav[data-state='open']) {
		background: var(--color-surface-raised);
		color: var(--color-text);
	}

	:global(.dropdown-menu-trigger-icon) {
		align-items: center;
		background: transparent;
		border: 0;
		border-radius: 999px;
		cursor: pointer;
		display: flex;
		justify-content: center;
		padding: 4px;
	}

	:global(.dropdown-menu-trigger-icon:hover),
	:global(.dropdown-menu-trigger-icon[data-state='open']) {
		background: var(--color-surface-raised);
	}

	:global(.dropdown-menu-content) {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		box-shadow:
			0 10px 25px -5px rgb(0 0 0 / 0.1),
			0 8px 10px -6px rgb(0 0 0 / 0.1);
		display: flex;
		flex-direction: column;
		max-inline-size: min(22rem, calc(100vw - 2rem));
		overflow: hidden;
		padding: 8px;
		z-index: 50;
	}

	:global(.dropdown-menu-header) {
		align-items: center;
		border-block-end: 1px solid var(--color-border);
		display: flex;
		gap: 12px;
		justify-content: space-between;
		margin-block-end: 8px;
		min-inline-size: 0;
		padding: 8px 12px 12px;
	}

	:global(.dropdown-menu-header-title) {
		color: var(--color-text-muted);
		flex: 1;
		font-size: 0.8rem;
		font-weight: 700;
		min-inline-size: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		text-transform: uppercase;
		white-space: nowrap;
	}

	:global(.dropdown-menu-header-title.tone-text) {
		font-size: 0.85rem;
		font-weight: 500;
		text-transform: none;
	}

	:global(.dropdown-menu-header-action) {
		color: var(--color-primary);
		flex-shrink: 0;
		font-size: 0.85rem;
		font-weight: 600;
	}

	:global(.dropdown-menu-header-action:hover) {
		text-decoration: underline;
	}

	:global(.dropdown-menu-group) {
		display: grid;
		gap: 4px;
		min-inline-size: 0;
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
		font-size: 0.95rem;
		font-weight: 500;
		gap: 8px;
		min-inline-size: 0;
		outline: 0;
		padding: 10px 12px;
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
		background: var(--color-surface-raised);
	}

	:global(.dropdown-menu-content .dropdown-menu-link strong) {
		color: var(--color-text);
		font-size: 0.95rem;
		font-weight: 600;
		max-inline-size: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	:global(.dropdown-menu-content .dropdown-menu-link span) {
		color: var(--color-text-muted);
		display: -webkit-box;
		font-size: 0.85rem;
		line-clamp: 2;
		line-height: 1.4;
		max-inline-size: 100%;
		overflow: hidden;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
	}

	:global(.dropdown-menu-empty) {
		color: var(--color-text-muted);
		font-size: 0.9rem;
		margin: 0;
		padding: 12px;
		text-align: center;
	}
</style>
