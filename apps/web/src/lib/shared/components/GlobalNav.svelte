<script lang="ts">
	import { BookOpenCheck, ChevronDown, LogOut, User } from '@lucide/svelte';
	import { Button } from '@learn-anything/ui';
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
	import { DropdownMenu } from '$lib/shared/components/dropdown-menu';

	type NavSubject = {
		id: string;
		slug: string;
		name: string;
		summary: string;
	};

	type NavUser = {
		email?: string;
	};

	let {
		subjects = [],
		user = null
	}: {
		subjects?: NavSubject[];
		user?: NavUser | null;
	} = $props();
</script>

<div class="global-nav-strip">
	<header class="global-nav">
		<a class="brand" href={user ? '/app' : '/'}>
			<BookOpenCheck size={24} /> Learn Anything
		</a>

		<nav aria-label="Global navigation" class="nav-links">
			<DropdownMenu
				minWidth="280px"
				maxWidth="320px"
				header={{ title: 'Browse Subjects', actionHref: '/subjects', actionLabel: 'View all' }}
			>
				{#snippet trigger()}
					Catalogue <ChevronDown size={16} />
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
				<a class="nav-link" href="/app">My Learning</a>
			{/if}
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
						<div class="avatar"><User size={18} /></div>
					{/snippet}
					{#snippet children()}
						<form method="POST" action="/app/logout">
							<DropdownMenuPrimitive.Item closeOnSelect>
								{#snippet child({ props })}
									<button {...props} type="submit" class="dropdown-menu-button">
										<LogOut size={16} /> Log out
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
</div>

<style>
	.global-nav-strip {
		background: var(--color-surface);
		border-block-end: 1px solid var(--color-border);
		position: sticky;
		top: 0;
		z-index: 50;
	}

	.global-nav {
		align-items: center;
		display: grid;
		gap: 24px;
		grid-template-columns: auto 1fr auto;
		margin-inline: auto;
		max-inline-size: 1440px;
		padding: 12px clamp(16px, 4vw, 36px);
	}

	.brand {
		align-items: center;
		color: var(--color-text);
		display: inline-flex;
		font-size: 1.1rem;
		font-weight: 800;
		gap: 8px;
		letter-spacing: -0.02em;
	}

	.nav-links {
		align-items: center;
		display: flex;
		gap: 8px;
	}

	.nav-link {
		align-items: center;
		border-radius: var(--radius-sm);
		color: var(--color-text-muted);
		display: inline-flex;
		font-weight: 600;
		gap: 4px;
		padding: 8px 12px;
		transition:
			background 150ms ease,
			color 150ms ease;
	}

	.nav-link:hover {
		background: var(--color-surface-raised);
		color: var(--color-text);
	}

	.auth-controls {
		align-items: center;
		display: flex;
		justify-content: end;
	}

	.avatar {
		align-items: center;
		background: var(--color-surface-raised);
		border-radius: 999px;
		display: flex;
		height: 36px;
		justify-content: center;
		width: 36px;
	}

	form {
		margin: 0;
	}

	@media (max-width: 720px) {
		.global-nav {
			gap: 16px;
		}

		.nav-links {
			display: none; /* In a real app we'd add a mobile menu here */
		}
	}
</style>
