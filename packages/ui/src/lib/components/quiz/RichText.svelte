<script lang="ts">
	import 'katex/dist/katex.min.css';

	import { render } from 'katex';
	import type { Attachment } from 'svelte/attachments';
	import { tokenizeRichText } from './richText';

	type RichTextProps = {
		content: string;
		class?: string;
	};

	let { content, class: className = '' }: RichTextProps = $props();

	let segments = $derived(tokenizeRichText(content));

	function renderMath(formula: string): Attachment<HTMLElement> {
		return (element) => {
			render(formula, element, {
				displayMode: false,
				throwOnError: false,
				trust: false
			});
		};
	}
</script>

<span class={['la-rich-text', className]}>
	{#each segments as segment (segment.id)}
		{#if segment.type === 'math'}
			<span class="la-rich-text__math" {@attach renderMath(segment.value)}>{segment.value}</span>
		{:else}
			{segment.value}
		{/if}
	{/each}
</span>

<style>
	.la-rich-text {
		white-space: normal;
	}

	.la-rich-text,
	.la-rich-text__math {
		white-space: pre-wrap;
	}

	.la-rich-text :global(.katex) {
		font-size: 1.21em;
	}
</style>
