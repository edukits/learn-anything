<script lang="ts">
	import { Check } from '@lucide/svelte';
	import { Tooltip } from 'bits-ui';
	import type { TopicModuleVersion } from '../types';

	type ModuleNumberNavItem = TopicModuleVersion & {
		completed?: boolean;
	};

	type Props = {
		modules: ModuleNumberNavItem[];
		anchorFor: (slug: string) => string;
	};

	let { modules, anchorFor }: Props = $props();

	let activeModuleId = $state<string | null>(null);
	let moduleTargets = $derived(
		modules.map((module) => ({
			id: module.topic_module_id,
			anchorId: anchorFor(module.slug)
		}))
	);
	let displayedActiveModuleId = $derived(
		moduleTargets.some((target) => target.id === activeModuleId)
			? activeModuleId
			: (moduleTargets[0]?.id ?? null)
	);
	let scheduledFrame: number | null = null;

	function updateActiveModule() {
		const readingLineY = window.innerHeight * 0.36;
		let closestModuleId = moduleTargets[0]?.id ?? null;
		let closestDistance = Number.POSITIVE_INFINITY;

		for (const target of moduleTargets) {
			const section = document.getElementById(target.anchorId);
			if (!section) continue;

			const rect = section.getBoundingClientRect();
			const distance =
				rect.top <= readingLineY && rect.bottom >= readingLineY
					? 0
					: Math.min(Math.abs(rect.top - readingLineY), Math.abs(rect.bottom - readingLineY));

			if (distance < closestDistance) {
				closestDistance = distance;
				closestModuleId = target.id;
			}
		}

		activeModuleId = closestModuleId;
		scheduledFrame = null;
	}

	function scheduleActiveModuleUpdate() {
		if (scheduledFrame !== null) return;
		scheduledFrame = requestAnimationFrame(updateActiveModule);
	}

	function moduleVariant(module: ModuleNumberNavItem) {
		const active = module.topic_module_id === displayedActiveModuleId;
		if (module.completed) return active ? 'success' : 'success-secondary';
		return active ? 'primary' : 'secondary';
	}

	$effect(() => {
		if (moduleTargets.length > 0) scheduleActiveModuleUpdate();

		return () => {
			if (scheduledFrame !== null) {
				cancelAnimationFrame(scheduledFrame);
				scheduledFrame = null;
			}
		};
	});
</script>

<svelte:window onscroll={scheduleActiveModuleUpdate} onresize={scheduleActiveModuleUpdate} />

<Tooltip.Provider delayDuration={180} skipDelayDuration={80} disableHoverableContent>
	<nav class="module-number-nav" aria-label="Modules">
		{#each modules as module (module.topic_module_id)}
			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props })}
						<a
							{...props}
							href={`#${anchorFor(module.slug)}`}
							aria-current={module.topic_module_id === displayedActiveModuleId ? 'location' : undefined}
							aria-label={`Module ${module.ordering}: ${module.title}${module.completed ? ' completed' : ''}`}
							data-module-state={module.completed ? 'completed' : 'available'}
							data-variant={moduleVariant(module)}
							onclick={() => {
								activeModuleId = module.topic_module_id;
							}}
						>
							{#if module.completed}
								<Check size={17} strokeWidth={3} aria-hidden="true" />
							{:else}
								{module.ordering}
							{/if}
						</a>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Portal>
					<Tooltip.Content side="top" sideOffset={12} class="module-tooltip">
						<span>Module {module.ordering}</span>
						<strong>{module.title}</strong>
					</Tooltip.Content>
				</Tooltip.Portal>
			</Tooltip.Root>
		{/each}
	</nav>
</Tooltip.Provider>

<style>
	.module-number-nav {
		align-items: center;
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.module-number-nav a {
		--module-nav-grad-from: hsl(var(--color-accent-h) 20% 98%);
		--module-nav-grad-to: hsl(var(--color-accent-h) 20% 93%);
		--module-nav-inset: hsl(var(--color-accent-h) 15% 100%);
		--module-nav-shadow-color: transparent;
		--module-nav-shadow-spread: 0px;
		align-items: center;
		aspect-ratio: 1;
		background: linear-gradient(
			to bottom,
			var(--module-nav-grad-from),
			var(--module-nav-grad-to)
		);
		border: 1px solid hsl(var(--color-accent-h) 22% 82%);
		border-radius: var(--radius-pill);
		box-shadow:
			0 2px 1px inset var(--module-nav-inset),
			0 1px var(--module-nav-shadow-spread) 0 var(--module-nav-shadow-color);
		color: var(--color-text);
		display: inline-flex;
		font-size: 0.88rem;
		font-weight: 700;
		justify-content: center;
		line-height: 1;
		min-inline-size: 2.35rem;
		padding: 0.45rem;
		text-decoration: none;
	}

	.module-number-nav a[data-variant='primary'] {
		--module-nav-grad-from: hsl(var(--color-accent-h) var(--color-accent-s) var(--color-accent-l));
		--module-nav-grad-to: hsl(
			var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) - 15%)
		);
		--module-nav-inset: hsl(
			var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) + 10%)
		);
		border-color: hsl(
			var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) - 25%)
		);
		color: var(--color-accent-contrast);
	}

	.module-number-nav a[data-variant='success-secondary'] {
		--module-nav-grad-from: hsl(var(--color-success-h) 30% 97%);
		--module-nav-grad-to: hsl(var(--color-success-h) 32% 91%);
		--module-nav-inset: hsl(var(--color-success-h) 28% 100%);
		border-color: hsl(var(--color-success-h) 36% 76%);
		color: hsl(var(--color-success-h) var(--color-success-s) 26%);
	}

	.module-number-nav a[data-variant='success'] {
		--module-nav-grad-from: hsl(var(--color-success-h) var(--color-success-s) var(--color-success-l));
		--module-nav-grad-to: hsl(
			var(--color-success-h) var(--color-success-s) calc(var(--color-success-l) - 12%)
		);
		--module-nav-inset: hsl(
			var(--color-success-h) calc(var(--color-success-s) - 15%) calc(var(--color-success-l) + 14%)
		);
		border-color: hsl(
			var(--color-success-h) var(--color-success-s) calc(var(--color-success-l) - 20%)
		);
		color: var(--color-success-contrast);
	}

	.module-number-nav a:hover {
		--module-nav-shadow-color: hsl(var(--color-accent-h) 15% 50% / 0.12);
		--module-nav-shadow-spread: 3px;
		border-color: hsl(var(--color-accent-h) 24% 74%);
	}

	.module-number-nav a[data-variant='success-secondary']:hover {
		--module-nav-grad-from: hsl(var(--color-success-h) 34% 98%);
		--module-nav-grad-to: hsl(var(--color-success-h) 36% 89%);
		--module-nav-shadow-color: hsl(var(--color-success-h) 38% 40% / 0.16);
		border-color: hsl(var(--color-success-h) 42% 68%);
	}

	.module-number-nav a[data-variant='primary']:hover {
		--module-nav-grad-from: hsl(
			var(--color-accent-h) calc(var(--color-accent-s) + 4%) calc(var(--color-accent-l) + 3%)
		);
		--module-nav-grad-to: hsl(
			var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) - 8%)
		);
		--module-nav-inset: hsl(
			var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) + 14%)
		);
		--module-nav-shadow-color: hsl(
			var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) - 20%) / 0.35
		);
		border-color: hsl(
			var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) - 18%)
		);
	}

	.module-number-nav a[data-variant='success']:hover {
		--module-nav-grad-from: hsl(
			var(--color-success-h) calc(var(--color-success-s) + 4%) calc(var(--color-success-l) + 3%)
		);
		--module-nav-grad-to: hsl(
			var(--color-success-h) var(--color-success-s) calc(var(--color-success-l) - 6%)
		);
		--module-nav-inset: hsl(
			var(--color-success-h) calc(var(--color-success-s) - 15%) calc(var(--color-success-l) + 14%)
		);
		--module-nav-shadow-color: hsl(
			var(--color-success-h) var(--color-success-s) calc(var(--color-success-l) - 20%) / 0.35
		);
		border-color: hsl(
			var(--color-success-h) var(--color-success-s) calc(var(--color-success-l) - 14%)
		);
	}

	.module-number-nav a:focus-visible {
		outline: 3px solid color-mix(in srgb, var(--color-focus), transparent 40%);
		outline-offset: 2px;
	}

	.module-number-nav a[aria-current='location'] {
		--module-nav-shadow-spread: 3px;
		box-shadow:
			0 2px 1px inset var(--module-nav-inset),
			0 1px var(--module-nav-shadow-spread) 0 var(--module-nav-shadow-color),
			0 0 0 3px color-mix(in srgb, var(--color-accent), transparent 72%);
	}

	.module-number-nav a[data-variant='success'][aria-current='location'] {
		box-shadow:
			0 2px 1px inset var(--module-nav-inset),
			0 1px var(--module-nav-shadow-spread) 0 var(--module-nav-shadow-color),
			0 0 0 3px color-mix(in srgb, var(--color-success), transparent 72%);
	}

	:global(.module-tooltip) {
		background: linear-gradient(
			to bottom,
			hsl(var(--color-accent-h) 18% 99%),
			hsl(var(--color-accent-h) 14% 96%)
		);
		border: 1px solid color-mix(in srgb, var(--color-accent), transparent 72%);
		border-radius: var(--radius-md);
		color: var(--color-text);
		display: grid;
		filter: drop-shadow(0 4px 12px rgb(0 0 0 / 0.1))
			drop-shadow(0 1px 2px rgb(0 0 0 / 0.06));
		gap: 3px;
		max-inline-size: min(18rem, calc(100vw - 2rem));
		overflow: visible;
		padding: 15px;
		position: relative;
		z-index: 40;
		transform-origin: var(--bits-tooltip-content-transform-origin);
	}

	:global(.module-tooltip span) {
		color: hsl(var(--color-accent-h) var(--color-accent-s) 38%);
		font-size: 0.68rem;
		font-weight: 750;
		letter-spacing: 0.06em;
		line-height: 1;
		text-transform: uppercase;
	}

	:global(.module-tooltip strong) {
		font-size: 0.84rem;
		font-weight: 600;
		line-height: 1.25;
		overflow-wrap: anywhere;
	}
</style>
