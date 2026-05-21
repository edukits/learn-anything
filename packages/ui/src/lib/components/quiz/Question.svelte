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

	type PromptScale = 'short' | 'medium' | 'long' | 'extra-long';

	const MEDIUM_PROMPT_LENGTH = 90;
	const LONG_PROMPT_LENGTH = 180;
	const EXTRA_LONG_PROMPT_LENGTH = 280;
	const MULTIPARAGRAPH_LONG_PROMPT_LENGTH = 120;
	const MULTIPARAGRAPH_EXTRA_LONG_PROMPT_LENGTH = 220;

	function getReadableText(content: string) {
		return content
			.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
			.replace(/\\text\{([^}]*)\}/g, '$1')
			.replace(/\\[a-zA-Z]+\*?(?:\[[^\]]*\])?(?:\{([^{}]*)\})?/g, '$1')
			.replace(/[$`*_~>#|]/g, ' ')
			.replace(/<[^>]+>/g, ' ')
			.replace(/\s+/g, ' ')
			.trim();
	}

	function getPromptScale(content: string): PromptScale {
		const readableTextLength = getReadableText(content).length;
		const paragraphCount = content
			.trim()
			.split(/\n\s*\n/)
			.filter(Boolean).length;

		if (
			readableTextLength > EXTRA_LONG_PROMPT_LENGTH ||
			(paragraphCount > 1 && readableTextLength > MULTIPARAGRAPH_EXTRA_LONG_PROMPT_LENGTH)
		) {
			return 'extra-long';
		}

		if (
			readableTextLength > LONG_PROMPT_LENGTH ||
			(paragraphCount > 1 && readableTextLength > MULTIPARAGRAPH_LONG_PROMPT_LENGTH)
		) {
			return 'long';
		}

		if (readableTextLength > MEDIUM_PROMPT_LENGTH) {
			return 'medium';
		}

		return 'short';
	}

	let {
		eyebrow,
		question,
		description,
		children,
		class: className = '',
		...rest
	}: QuestionProps = $props();

	let promptScale = $derived(getPromptScale(question));
</script>

<section {...rest} class={['question', className]}>
	<div class="header">
		{#if eyebrow}
			<p class="eyebrow">{eyebrow}</p>
		{/if}

		<div class={['prompt', `prompt-${promptScale}`]}>
			<RichText content={question} />
		</div>

		{#if description}
			<div class="description">
				<RichText content={description} />
			</div>
		{/if}
	</div>

	{#if children}
		<div class="answer">
			{@render children()}
		</div>
	{/if}
</section>

<style>
	.question {
		display: grid;
		gap: var(--space-6);
		inline-size: 100%;
	}

	.header {
		display: grid;
		gap: var(--space-3);
	}

	.eyebrow,
	.description {
		margin-block: 0;
	}

	.eyebrow {
		color: var(--color-accent);
		font-size: 0.8125rem;
		font-weight: 700;
		letter-spacing: 0;
		text-transform: uppercase;
	}

	.prompt {
		color: var(--color-text);
		max-inline-size: 40rem;
	}

	.prompt-short {
		font-size: clamp(1.375rem, 2vw, 1.75rem);
		line-height: 1.32;
	}

	.prompt-medium {
		font-size: clamp(1.25rem, 1.6vw, 1.5rem);
		line-height: 1.38;
	}

	.prompt-long {
		font-size: clamp(1.125rem, 1.35vw, 1.25rem);
		line-height: 1.48;
	}

	.prompt-extra-long {
		font-size: 1rem;
		line-height: 1.55;
	}

	.description {
		color: var(--color-text-muted);
		font-size: 1rem;
		line-height: 1.55;
		max-inline-size: 36rem;
	}
</style>
