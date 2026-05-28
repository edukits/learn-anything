<script lang="ts">
	import type { Component } from 'svelte';
	import InlineLessonInteraction from './InlineLessonInteraction.svelte';
	import type { LessonInteraction, LessonRenderBlock } from '../types';

	type RichTextRendererProps = {
		content: string;
	};

	type InteractiveLessonRendererProps = {
		blocks: LessonRenderBlock[];
		interactions: LessonInteraction[];
		oninteractioncompleted?: (interaction: LessonInteraction) => void;
		RichTextRenderer: Component<RichTextRendererProps>;
	};

	type ResolvedLessonBlock =
		| Extract<LessonRenderBlock, { type: 'markdown' }>
		| (Extract<LessonRenderBlock, { type: 'interaction' }> & {
				interaction: LessonInteraction | undefined;
		  });

	let {
		blocks,
		interactions,
		oninteractioncompleted,
		RichTextRenderer
	}: InteractiveLessonRendererProps = $props();

	let interactionBySlug = $derived(
		new Map(interactions.map((interaction) => [interaction.slug, interaction]))
	);
	let resolvedBlocks: ResolvedLessonBlock[] = $derived(
		blocks.map((block) =>
			block.type === 'interaction'
				? Object.assign({}, block, { interaction: interactionBySlug.get(block.slug) })
				: block
		)
	);

	function blockKey(block: ResolvedLessonBlock, index: number) {
		if (block.type === 'interaction') {
			return block.interaction?.submissionKey ?? `interaction:${block.slug}:${index}`;
		}

		return `markdown:${index}`;
	}
</script>

<div class="interactive-lesson">
	{#each resolvedBlocks as block, index (blockKey(block, index))}
		{#if block.type === 'markdown'}
			<RichTextRenderer content={block.markdown} />
		{:else if block.interaction}
			<InlineLessonInteraction
				interaction={block.interaction}
				oncompleted={oninteractioncompleted}
			/>
		{/if}
	{/each}
</div>

<style>
	.interactive-lesson {
		display: grid;
		gap: 10px;
	}
</style>
