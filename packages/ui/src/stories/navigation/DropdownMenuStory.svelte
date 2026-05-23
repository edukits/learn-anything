<script lang="ts">
	import { ChevronDown, MoreHorizontal, Settings, UserRound } from '@lucide/svelte';
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
	import DropdownMenu from '../../lib/components/navigation/DropdownMenu.svelte';

	type MenuItem = {
		label: string;
		description?: string;
		href?: string;
	};

	type Props = {
		triggerLabel?: string;
		triggerVariant?: 'nav' | 'icon';
		align?: 'start' | 'center' | 'end';
		minWidth?: string;
		maxWidth?: string;
		headerTitle?: string;
		headerActionLabel?: string;
		headerActionHref?: string;
		items?: MenuItem[];
	};

	let {
		triggerLabel = 'Resources',
		triggerVariant = 'nav',
		align = 'start',
		minWidth = '260px',
		maxWidth,
		headerTitle = 'Learning resources',
		headerActionLabel = 'View all',
		headerActionHref = '#',
		items = [
			{
				label: 'Daily plan',
				description: 'Review the next recommended lessons and drills.',
				href: '#daily-plan'
			},
			{
				label: 'Saved topics',
				description: 'Jump back into concepts you marked for later.',
				href: '#saved-topics'
			},
			{
				label: 'Progress report',
				description: 'See streaks, accuracy, and recent weak spots.',
				href: '#progress-report'
			}
		]
	}: Props = $props();
</script>

<div class="story-frame">
	<DropdownMenu
		{triggerVariant}
		{align}
		{minWidth}
		{maxWidth}
		header={{
			title: headerTitle,
			actionHref: headerActionHref,
			actionLabel: headerActionLabel
		}}
		triggerProps={{ 'aria-label': triggerVariant === 'icon' ? triggerLabel : undefined }}
	>
		{#snippet trigger()}
			{#if triggerVariant === 'icon'}
				<MoreHorizontal size={18} strokeWidth={2.25} aria-hidden="true" />
			{:else}
				{triggerLabel}
				<ChevronDown size={16} strokeWidth={2.25} aria-hidden="true" />
			{/if}
		{/snippet}

		<div class="dropdown-menu-group">
			{#each items as item (item.label)}
				<DropdownMenuPrimitive.Item closeOnSelect textValue={item.label}>
					{#snippet child({ props })}
						<a {...props} href={item.href ?? '#'} class="dropdown-menu-link layout-stack">
							<strong>{item.label}</strong>
							{#if item.description}
								<span>{item.description}</span>
							{/if}
						</a>
					{/snippet}
				</DropdownMenuPrimitive.Item>
			{/each}

			<DropdownMenuPrimitive.Item closeOnSelect>
				{#snippet child({ props })}
					<button {...props} type="button" class="dropdown-menu-button">
						<Settings size={16} strokeWidth={2.25} aria-hidden="true" />
						Menu settings
					</button>
				{/snippet}
			</DropdownMenuPrimitive.Item>
		</div>
	</DropdownMenu>

	<div class="story-context" aria-hidden="true">
		<UserRound size={18} strokeWidth={2.25} />
		<span>Open the trigger to inspect menu positioning and item states.</span>
	</div>
</div>

<style>
	.story-frame {
		align-items: start;
		display: grid;
		gap: var(--space-6);
		min-block-size: 20rem;
		padding: var(--space-8);
	}

	.story-context {
		align-items: center;
		color: var(--color-text-muted);
		display: flex;
		font-size: 0.9rem;
		gap: var(--space-2);
	}
</style>
