<script lang="ts">
	import { Check, X } from '@lucide/svelte';
	import type { MultipleChoiceOptionState } from './types';

	type GradingIndicatorProps = {
		state?: MultipleChoiceOptionState;
		selected?: boolean;
		selectedMark?: 'dot' | 'check' | 'none';
		incorrectShape?: 'circle' | 'square';
		size?: string;
		dotSize?: string;
		iconSize?: number;
		animateCorrectMarker?: boolean;
		triggerCorrectAnimation?: boolean;
		ariaLabel?: string;
		element?: HTMLElement;
		class?: string;
	};

	let {
		state: gradeState = 'neutral',
		selected = false,
		selectedMark = 'none',
		incorrectShape = 'circle',
		size = '1.5rem',
		dotSize = 'calc(var(--grading-size) * 0.45)',
		iconSize = 14,
		animateCorrectMarker = false,
		triggerCorrectAnimation = false,
		ariaLabel,
		element = $bindable<HTMLElement>(),
		class: className = ''
	}: GradingIndicatorProps = $props();

	let hasTrackedState = $state(false);
	let previousGradeState = $state<MultipleChoiceOptionState>('neutral');
	let previousCorrectAnimationTrigger = $state(false);
	let playCorrectAnimation = $state(false);
	let resolvedAriaLabel = $derived(
		ariaLabel ??
			(gradeState === 'correct' ? 'Correct' : gradeState === 'incorrect' ? 'Incorrect' : undefined)
	);

	$effect(() => {
		if (!hasTrackedState) {
			hasTrackedState = true;
			previousGradeState = gradeState;
			previousCorrectAnimationTrigger = triggerCorrectAnimation;
			return;
		}

		const previous = previousGradeState;
		const previousTrigger = previousCorrectAnimationTrigger;

		if (
			gradeState === 'correct' &&
			(previous !== 'correct' || (triggerCorrectAnimation && !previousTrigger))
		) {
			playCorrectAnimation = true;
		} else if (gradeState !== 'correct') {
			playCorrectAnimation = false;
		}

		previousGradeState = gradeState;
		previousCorrectAnimationTrigger = triggerCorrectAnimation;
	});
</script>

<span
	bind:this={element}
	class={[
		'grading-indicator',
		`state-${gradeState}`,
		`incorrect-${incorrectShape}`,
		selected && 'selected',
		selected && `selected-mark-${selectedMark}`,
		playCorrectAnimation && 'correct-animated',
		animateCorrectMarker && 'correct-marker-entrance',
		className
	]}
	style:--grading-size={size}
	style:--grading-dot-size={dotSize}
	aria-label={resolvedAriaLabel}
	aria-hidden={resolvedAriaLabel ? undefined : 'true'}
>
	{#if gradeState === 'correct'}
		<span class="icon">
			<Check size={iconSize} strokeWidth={4} />
		</span>
	{:else if gradeState === 'incorrect'}
		<span class="icon">
			<X size={iconSize} strokeWidth={4} />
		</span>
	{:else if selected && selectedMark === 'check'}
		<span class="icon">
			<Check size={iconSize} strokeWidth={4} />
		</span>
	{:else if selected && selectedMark === 'dot'}
		<span class="selected-dot"></span>
	{/if}
</span>

<style>
	.grading-indicator {
		--accent: var(--color-accent);
		background: var(--color-surface);
		border: 1px solid color-mix(in srgb, var(--color-border), var(--color-text-muted) 18%);
		border-radius: calc(var(--grading-size) / 2);
		box-shadow: 0 1px 1px rgb(0 0 0 / 0.08) inset;
		box-sizing: border-box;
		color: var(--color-surface);
		display: grid;
		inline-size: var(--grading-size);
		aspect-ratio: 1;
		place-items: center;
		pointer-events: none;
		transform: rotate(0deg);
		transition:
			background 180ms ease-out,
			border-color 180ms ease-out,
			border-radius 220ms ease-out,
			box-shadow 180ms ease-out,
			transform 400ms cubic-bezier(0.16, 1, 0.3, 1);
		will-change: border-radius, transform;
	}

	.selected,
	.state-correct,
	.state-incorrect {
		border-color: color-mix(in srgb, var(--accent), black 12%);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent), transparent 82%);
	}

	.selected-mark-check {
		background: var(--accent);
		border-radius: 0.25rem;
	}

	.state-correct {
		--accent: var(--color-success);
		background: var(--accent);
		border-radius: 0.1875rem;
		transform: rotate(45deg);
	}

	.state-correct.correct-marker-entrance {
		animation: correct-marker-in 260ms cubic-bezier(0.16, 1, 0.3, 1);
		animation-fill-mode: both;
	}

	.state-incorrect {
		--accent: var(--color-danger);
		background: var(--accent);
	}

	.state-incorrect.incorrect-square {
		border-radius: 0.25rem;
	}

	.icon {
		display: grid;
		place-items: center;
		transform-origin: center;
	}

	.state-correct .icon {
		transform: rotate(-45deg);
	}

	.state-correct.correct-animated .icon {
		animation: correct-icon-in 500ms cubic-bezier(0.16, 1, 0.3, 1);
		animation-delay: 180ms;
		animation-fill-mode: both;
	}

	.selected-dot {
		background: var(--accent);
		border-radius: 999px;
		display: block;
		inline-size: var(--grading-dot-size);
		aspect-ratio: 1;
	}

	@keyframes correct-icon-in {
		from {
			filter: blur(1px);
			opacity: 0;
			transform: rotate(-45deg) scale(1.5);
		}

		to {
			filter: blur(0);
			opacity: 1;
			transform: rotate(-45deg) scale(1);
		}
	}

	@keyframes correct-marker-in {
		from {
			opacity: 0;
			transform: rotate(45deg) scale(0.72);
		}

		to {
			opacity: 1;
			transform: rotate(45deg) scale(1);
		}
	}
</style>
