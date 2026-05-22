<script lang="ts">
	import type { Attachment } from 'svelte/attachments';

	type ActionSubmitterProps = {
		action: string;
		fields: Record<string, string>;
		submitKey: number;
	};

	let { action, fields, submitKey }: ActionSubmitterProps = $props();
	let submittedKey = 0;

	const submitWhenRequested: Attachment<HTMLFormElement> = (form) => {
		$effect(() => {
			if (submitKey <= 0 || submitKey === submittedKey) return;
			submittedKey = submitKey;
			form.requestSubmit();
		});
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
