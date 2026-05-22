<script lang="ts">
	import type { PageProps } from './$types';
	import { Button, RichText } from '@learn-anything/ui';
	import { Lock } from '@lucide/svelte';

	let { data, form }: PageProps = $props();
</script>

<main class="page lesson-page">
	{#if data.locked || !data.lesson}
		<section class="locked">
			<Lock size={32} />
			<h1>Lesson locked</h1>
			<p>Complete the previous path item first.</p>
			<Button href="/app/literary-devices" label="Back to map" />
		</section>
	{:else}
		<article class="lesson">
			<p class="eyebrow">Lesson</p>
			<RichText content={data.lesson.body_markdown} />

			{#if form?.error}
				<p class="message error">{form.error}</p>
			{/if}

			<form method="POST" action="?/complete">
				<Button
					type="submit"
					label={data.itemProgress?.state === 'completed' ? 'Continue to map' : 'Mark complete'}
				/>
				<Button href="/app/literary-devices" variant="secondary" label="Back to map" />
			</form>
		</article>
	{/if}
</main>

<style>
	.lesson-page {
		display: grid;
		gap: 20px;
		max-width: 700px;
	}

	.lesson,
	.locked {
		display: grid;
		gap: 18px;
		padding: 30px;
	}

	.lesson {
		font-size: 18px;
	}

	.locked {
		align-items: start;
	}

	.locked h1,
	.locked p {
		margin: 0;
	}

	.lesson :global(h1) {
		font-size: 2.5em;
		line-height: 1.2;
		margin: 0 0 4px 0;
	}

	.lesson :global(h2) {
		font-size: 1.875em;
		line-height: 1.3;
		margin: 1em 0 4px 0;
	}

	.lesson :global(h3) {
		font-size: 1.5em;
		line-height: 1.3;
		margin: 1em 0 1px 0;
	}

	.lesson :global(h4) {
		font-size: 1.25em;
		line-height: 1.3;
		margin: 1em 0 1px 0;
	}

	.lesson :global(p),
	.lesson :global(li) {
		font-size: 1em;
		line-height: 1.5;
		margin: 1px 0;
		padding: 3px 2px;
	}

	form {
		align-items: center;
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
	}
</style>
