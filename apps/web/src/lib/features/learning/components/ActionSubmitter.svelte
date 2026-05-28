<script lang="ts">
	import { enhance } from '$app/forms';
	import type { Attachment } from 'svelte/attachments';
	import type { ActionResult } from '@sveltejs/kit';

	type ActionSubmitterProps = {
		action: string;
		background?: boolean;
		fields: Record<string, string>;
		onresult?: (result: ActionResult) => void;
		submitKey: number;
	};

	let { action, background = false, fields, onresult, submitKey }: ActionSubmitterProps = $props();
	let submittedKey = 0;

	const submitWhenRequested: Attachment<HTMLFormElement> = (form) => {
		const cleanup = background
			? enhance(form, () => {
					return async ({ result }) => {
						onresult?.(result);
					};
				})
			: undefined;

		$effect(() => {
			if (submitKey <= 0 || submitKey === submittedKey) return;
			submittedKey = submitKey;
			form.requestSubmit();
		});

		return () => {
			cleanup?.destroy();
		};
	};
</script>

<form {@attach submitWhenRequested} class="action-submitter" method="POST" {action}>
	{#each Object.entries(fields) as [name, value] (name)}
		<input type="hidden" {name} {value} />
	{/each}
</form>

<style>
	.action-submitter {
		display: none;
	}
</style>
