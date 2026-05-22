import DefaultRichTextRenderer from './default/RichTextRenderer.svelte';
import { literaryDevicesRenderer } from './literary-devices';
import type { TopicRendererConfig } from './types';

const topicRenderers: Record<string, TopicRendererConfig> = {
	'literary-devices': literaryDevicesRenderer
};

export function getTopicRenderer(topicSlug: string) {
	const renderer = topicRenderers[topicSlug] ?? {};

	return {
		RichTextRenderer: renderer.RichTextRenderer ?? DefaultRichTextRenderer
	};
}
