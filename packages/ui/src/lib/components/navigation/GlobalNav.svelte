<script lang="ts">
	import { tick } from 'svelte';
	import { Spring, prefersReducedMotion } from 'svelte/motion';
	import { BookOpenCheck, ChevronDown, ClipboardCheck, LogOut, User } from '@lucide/svelte';
	import Button from '../Button.svelte';
	import DropdownMenu from './DropdownMenu.svelte';
	import NavLink from './NavLink.svelte';
	import NavStrip from './NavStrip.svelte';
	import type { NavSubject, NavUser } from './types';
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';

	let {
		subjects = [],
		user = null,
		currentPathname = '',
		showAdmin = false,
		class: className = ''
	}: {
		subjects?: NavSubject[];
		user?: NavUser | null;
		currentPathname?: string;
		showAdmin?: boolean;
		class?: string;
	} = $props();

	let brandHref = $derived(user ? '/app' : '/');
	let myLearningCurrent = $derived(
		currentPathname === '/app' || currentPathname.startsWith('/app/')
	);

	let navEl: HTMLElement | undefined = $state();
	let indicatorVisible = $state(false);
	let indicatorMeasured = $state(false);

	const indicatorLeft = new Spring(0, { stiffness: 0.25, damping: 0.65, precision: 0.01 });
	const indicatorWidth = new Spring(0, { stiffness: 0.25, damping: 0.65, precision: 0.01 });

	async function updateIndicator({ instant = false } = {}) {
		await tick();

		if (!navEl) {
			indicatorVisible = false;
			return;
		}

		const activeEl = navEl.querySelector<HTMLElement>('[aria-current="page"]');
		if (!activeEl) {
			indicatorVisible = false;
			return;
		}

		const navRect = navEl.getBoundingClientRect();
		const activeRect = activeEl.getBoundingClientRect();
		const inset = 8;
		const snap = instant || !indicatorMeasured || prefersReducedMotion.current;

		indicatorVisible = true;
		indicatorMeasured = true;

		indicatorLeft.set(activeRect.left - navRect.left + inset, { instant: snap });
		indicatorWidth.set(Math.max(activeRect.width - inset * 2, 0), { instant: snap });
	}

	$effect(() => {
		void currentPathname;
		void showAdmin;
		void user;
		updateIndicator();
	});
</script>

<svelte:window onresize={() => updateIndicator({ instant: true })} />

<NavStrip tone="global" sticky class={className}>
	<header class="global-nav">
		<a class="brand" href={brandHref}>
			<span class="brand-mark" aria-hidden="true">
				<BookOpenCheck size={22} strokeWidth={2.25} />
			</span>
			Clarifyst
		</a>

		<nav
			bind:this={navEl}
			aria-label="Global navigation"
			class="nav-links"
			style:--indicator-left="{indicatorLeft.current}px"
			style:--indicator-width="{indicatorWidth.current}px"
			style:--indicator-opacity={indicatorVisible ? 1 : 0}
		>
			<DropdownMenu
				minWidth="280px"
				header={{ title: 'Browse Subjects', actionHref: '/subjects', actionLabel: 'View all' }}
			>
				{#snippet trigger()}
					Catalogue <ChevronDown size={16} strokeWidth={2.25} aria-hidden="true" />
				{/snippet}
				{#snippet children()}
					<div class="dropdown-menu-group">
						{#each subjects as subject (subject.id)}
							<DropdownMenuPrimitive.Item closeOnSelect textValue={subject.name}>
								{#snippet child({ props })}
									<a
										{...props}
										href={`/subjects/${subject.slug}`}
										class="dropdown-menu-link layout-stack"
									>
										<strong>{subject.name}</strong>
										<span>{subject.summary}</span>
									</a>
								{/snippet}
							</DropdownMenuPrimitive.Item>
						{/each}
						{#if subjects.length === 0}
							<p class="dropdown-menu-empty">No subjects available</p>
						{/if}
					</div>
				{/snippet}
			</DropdownMenu>

			{#if user}
				<NavLink href="/app" variant="global" current={myLearningCurrent}>
					My Learning
				</NavLink>
			{/if}

			{#if user && showAdmin}
				<NavLink
					href="/admin/content"
					variant="global"
					current={currentPathname.startsWith('/admin/content')}
				>
					Content Admin
				</NavLink>
			{/if}

			<span class="active-indicator" aria-hidden="true"></span>
		</nav>

		<div class="auth-controls">
			{#if user}
				<DropdownMenu
					triggerVariant="icon"
					align="end"
					minWidth="200px"
					maxWidth="280px"
					header={{ title: user.email ?? 'Account', tone: 'text' }}
					triggerProps={{ 'aria-label': 'User menu' }}
				>
					{#snippet trigger()}
						<User size={18} strokeWidth={2.25} aria-hidden="true" />
					{/snippet}
					{#snippet children()}
						<form method="POST" action="/app/logout">
							<DropdownMenuPrimitive.Item closeOnSelect>
								{#snippet child({ props })}
									<button {...props} type="submit" class="dropdown-menu-button">
										<LogOut size={16} strokeWidth={2.25} aria-hidden="true" />
										Log out
									</button>
								{/snippet}
							</DropdownMenuPrimitive.Item>
						</form>
					{/snippet}
				</DropdownMenu>
			{:else}
				<Button href="/sign-in" variant="primary" size="sm">Sign In</Button>
			{/if}
		</div>
	</header>
</NavStrip>

<style>
	.global-nav {
		align-items: center;
		display: grid;
		gap: var(--space-6);
		grid-template-columns: auto 1fr auto;
		inline-size: min(
			var(--layout-content-max-inline-size, 72rem),
			calc(100% - (var(--layout-page-gutter, 1.25rem) * 2))
		);
		margin-inline: auto;
		padding-block: var(--space-3);
	}

	.brand {
		align-items: center;
		color: var(--color-text);
		display: inline-flex;
		font-family: var(--font-display);
		font-size: 1.0625rem;
		font-weight: 800;
		gap: var(--space-2);
		letter-spacing: -0.02em;
		text-decoration: none;
	}

	.brand-mark {
		align-items: center;
		background: linear-gradient(
			to bottom,
			hsl(var(--color-accent-h) var(--color-accent-s) var(--color-accent-l)),
			hsl(var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) - 14%))
		);
		border: 1px solid hsl(var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) - 24%));
		border-radius: var(--radius-sm);
		box-shadow:
			0 1px 0 inset hsl(var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) + 10%)),
			0 2px 4px hsl(var(--color-accent-h) 20% 40% / 0.18);
		color: var(--color-accent-contrast);
		display: inline-flex;
		height: 2rem;
		justify-content: center;
		width: 2rem;
	}

	.nav-links {
		align-items: center;
		display: flex;
		gap: var(--space-1);
		position: relative;
	}

	.active-indicator {
		background: var(--color-accent);
		block-size: 2px;
		border-radius: 1px;
		bottom: calc(-1 * var(--space-3) - 1px);
		inline-size: var(--indicator-width);
		left: 0;
		opacity: var(--indicator-opacity);
		pointer-events: none;
		position: absolute;
		transform: translateX(var(--indicator-left));
		transition: opacity 120ms ease;
	}

	.auth-controls {
		align-items: center;
		display: flex;
		justify-content: end;
	}

	form {
		margin: 0;
	}

	@media (max-width: 720px) {
		.global-nav {
			gap: var(--space-4);
		}

		.nav-links {
			display: none;
		}
	}
</style>
