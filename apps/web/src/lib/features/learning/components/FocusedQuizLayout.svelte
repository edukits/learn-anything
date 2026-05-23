<script lang="ts">
	import { goto } from '$app/navigation';
	import { getRememberedNonFocusedHref, resolveFocusedQuizExitHref } from '../focusedQuizRoute';
	import { X } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	type FocusedQuizLayoutProps = {
		children: Snippet;
		exitHref: string;
		exitLabel?: string;
	};

	let { children, exitHref, exitLabel = 'Exit quiz' }: FocusedQuizLayoutProps = $props();

	function exitQuiz() {
		void goto(
			resolveFocusedQuizExitHref({
				exitHref,
				rememberedHref: getRememberedNonFocusedHref(),
				referrer: document.referrer,
				origin: window.location.origin
			}),
			{ replaceState: true }
		);
	}
</script>

<div class="focused-quiz-layout">
	<button
		class="exit-button"
		type="button"
		aria-label={exitLabel}
		title={exitLabel}
		onclick={exitQuiz}
	>
		<X size={22} strokeWidth={2.4} aria-hidden="true" />
	</button>

	<div class="focused-quiz-content">
		{@render children()}
	</div>
</div>

<style>
	.focused-quiz-layout {
		background: var(--color-canvas);
		box-sizing: border-box;
		display: flex;
		inline-size: 100%;
		min-block-size: 100svh;
		overflow-x: clip;
		padding-block: max(72px, calc(env(safe-area-inset-top) + 24px))
			max(32px, calc(env(safe-area-inset-bottom) + 24px));
		padding-inline: max(var(--layout-page-gutter), env(safe-area-inset-left))
			max(var(--layout-page-gutter), env(safe-area-inset-right));
		position: relative;
	}

	.focused-quiz-content {
		display: grid;
		gap: 20px;
		inline-size: min(100%, 52rem);
		margin: auto;
	}

	.exit-button {
		align-items: center;
		appearance: none;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 999px;
		box-shadow: var(--shadow-sm);
		color: var(--color-text-muted);
		cursor: pointer;
		display: inline-flex;
		inset-block-start: max(18px, calc(env(safe-area-inset-top) + 12px));
		inset-inline-end: max(18px, calc(env(safe-area-inset-right) + 12px));
		justify-content: center;
		min-block-size: 2.75rem;
		min-inline-size: 2.75rem;
		position: fixed;
		transition:
			border-color 120ms ease-out,
			color 120ms ease-out,
			transform 100ms ease-out;
		z-index: 20;
	}

	.exit-button:hover {
		border-color: var(--color-text-muted);
		color: var(--color-text);
	}

	.exit-button:active {
		transform: scale(0.96);
	}

	.exit-button:focus-visible {
		outline: 3px solid color-mix(in srgb, var(--color-focus), transparent 40%);
		outline-offset: 2px;
	}
</style>
