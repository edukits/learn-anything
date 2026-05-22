import type { Component } from 'svelte';

export type RichTextRendererProps = {
	content: string;
};

export type TopicRendererConfig = {
	RichTextRenderer?: Component<RichTextRendererProps>;
};
