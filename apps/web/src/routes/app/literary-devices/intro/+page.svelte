<script lang="ts">
	import { Button, RichText } from '@learn-anything/ui';

	let { data, form } = $props();
</script>

<main class="page lesson-page">
	<article class="surface lesson">
		<p class="eyebrow">Lesson</p>
		<RichText content={data.lesson.body_markdown} />

		{#if form?.error}
			<p class="message error">{form.error}</p>
		{/if}

		<form method="POST" action="?/complete">
			<Button
				type="submit"
				label={data.progress.intro_lesson_completed ? 'Continue to map' : 'Mark complete'}
			/>
			<Button href="/app/literary-devices" variant="secondary" label="Back to map" />
		</form>
	</article>
</main>

<style>
	.lesson-page {
		display: grid;
		gap: 20px;
		max-width: 700px;
	}

	.lesson {
		display: grid;
		gap: 18px;
		padding: 30px;
		font-size: 18px;
	}

	/* Lesson element styling */
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
		padding: 3px 2px;
		margin: 1px 0;
	}

	form {
		align-items: center;
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
	}

</style>
