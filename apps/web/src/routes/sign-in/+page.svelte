<script lang="ts">
	import { Button } from '@learn-anything/ui';

	let { form } = $props();
</script>

<main class="sign-in page">
	<section class="surface panel">
		<h1>Sign In</h1>

		{#if form?.error}
			<p class="message error">{form.error}</p>
		{/if}

		{#if form?.sent}
			<p class="message success">Check Mailpit for the sign-in link sent to {form.email}.</p>
		{/if}

		<form method="POST">
			<label>
				Email
				<input name="email" type="email" autocomplete="email" required value={form?.email ?? ''} />
			</label>
			<Button type="submit" label="Send magic link" />
		</form>
	</section>
</main>

<style>
	.sign-in {
		align-items: center;
		display: grid;
		min-block-size: 100svh;
		padding-block: 32px;
	}

	.panel {
		display: grid;
		gap: 18px;
		inline-size: min(100%, 520px);
		margin-inline: auto;
		padding: 28px;
	}

	h1,
	p {
		margin: 0;
	}

	h1 {
		letter-spacing: 0;
		line-height: 1;
	}

	form,
	label {
		display: grid;
		gap: 10px;
	}

	input {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		min-block-size: 46px;
		padding-inline: 12px;
	}

</style>
