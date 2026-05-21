<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import RichText from './RichText.svelte';

	type NativeSectionProps = Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'>;

	type QuestionProps = NativeSectionProps & {
		eyebrow?: string;
		question: string;
		description?: string;
		class?: string;
		children?: Snippet;
	};

	let {
		eyebrow,
		question,
		description,
		children,
		class: className = '',
		...rest
	}: QuestionProps = $props();
</script>

<section {...rest} class={['la-question', className]}>
	<div class="la-question__header">
		{#if eyebrow}
			<p class="la-question__eyebrow">{eyebrow}</p>
		{/if}

		<h2 class="la-question__prompt">
			<RichText content={question} />
		</h2>

		{#if description}
			<p class="la-question__description">
				<RichText content={description} />
			</p>
		{/if}
	</div>

	{#if children}
		<div class="la-question__answer">
			{@render children()}
		</div>
	{/if}
</section>

<style>
	.la-question {
		background: var(--color-surface);
		border: 1px solid color-mix(in srgb, var(--color-border), transparent 12%);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-md);
		display: grid;
		gap: var(--space-6);
		inline-size: min(100%, 25rem);
		padding: var(--space-6);
	}

	.la-question__header {
		display: grid;
		gap: var(--space-3);
	}

	.la-question__eyebrow,
	.la-question__description,
	h2 {
		margin-block: 0;
	}

	.la-question__eyebrow {
		color: var(--color-accent);
		font-size: 0.8125rem;
		font-weight: 700;
		letter-spacing: 0;
		text-transform: uppercase;
	}

	.la-question__prompt {
		color: var(--color-text);
		font-size: clamp(1.375rem, 2vw, 1.75rem);
		line-height: 1.32;
		max-inline-size: 40rem;
	}

	.la-question__description {
		color: var(--color-text-muted);
		font-size: 1rem;
		line-height: 1.55;
		max-inline-size: 36rem;
	}

	.la-question__answer {
	}

	@media (max-width: 560px) {
		.la-question {
			border-radius: var(--radius-md);
			padding: var(--space-5);
		}

	}
</style>
