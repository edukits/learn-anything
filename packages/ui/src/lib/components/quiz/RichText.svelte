<script lang="ts">
	import 'katex/dist/katex.min.css';

	import { renderRichTextMarkdown } from './richText';

	type RichTextProps = {
		content: string;
		class?: string;
	};

	let { content, class: className = '' }: RichTextProps = $props();

	// renderRichTextMarkdown sanitizes Markdown and KaTeX output before {@html} renders it.
	let html = $derived(renderRichTextMarkdown(content));
</script>

<div class={['rich-text', className]}>{@html html}</div>

<style>
	.rich-text {
		display: flow-root;
	}

	.rich-text :global(:where(p, ol, ul, pre, blockquote)) {
		margin-block: 0;
	}

	.rich-text :global(:where(p, ol, ul, pre, blockquote) + :where(p, ol, ul, pre, blockquote)) {
		margin-block-start: var(--space-3);
	}

	.rich-text :global(:where(ol, ul)) {
		padding-inline-start: 1.35em;
	}

	.rich-text :global(li + li) {
		margin-block-start: var(--space-1);
	}

	.rich-text :global(code) {
		background: color-mix(in srgb, var(--color-border), transparent 58%);
		border-radius: var(--radius-sm);
		font-family: var(--font-mono);
		font-size: 0.9em;
		padding: 0.08em 0.28em;
	}

	.rich-text :global(pre) {
		background: color-mix(in srgb, var(--color-text), transparent 94%);
		border: 1px solid color-mix(in srgb, var(--color-border), transparent 20%);
		border-radius: var(--radius-md);
		overflow-x: auto;
		padding: var(--space-3);
	}

	.rich-text :global(pre code) {
		background: transparent;
		border-radius: 0;
		display: block;
		font-size: 0.875rem;
		line-height: 1.5;
		padding: 0;
	}

	.rich-text :global(table) {
		border-collapse: collapse;
		display: block;
		max-inline-size: 100%;
		overflow-x: auto;
	}

	.rich-text :global(:where(th, td)) {
		border: 1px solid color-mix(in srgb, var(--color-border), transparent 18%);
		padding: var(--space-2) var(--space-3);
		text-align: start;
	}

	.rich-text :global(th) {
		background: color-mix(in srgb, var(--color-border), transparent 70%);
		font-weight: 700;
	}

	.rich-text :global(.katex) {
		font-size: 1.21em;
	}

	.rich-text :global(eq) {
		display: inline-block;
	}

	.rich-text :global(section) {
		display: block;
	}

	.rich-text :global(eqn) {
		display: block;
		overflow-x: auto;
		overflow-y: hidden;
	}
</style>
