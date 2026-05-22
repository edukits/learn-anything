<script lang="ts">
	type PageHeaderProps = {
		eyebrow?: string;
		title: string;
		description?: string;
		class?: string;
	};

	let { eyebrow, title, description, class: className = '' }: PageHeaderProps = $props();
</script>

<header class={['page-header', className]}>
	{#if eyebrow}
		<p class="eyebrow">{eyebrow}</p>
	{/if}
	<h1>{title}</h1>
	{#if description}
		<p class="muted">{description}</p>
	{/if}
</header>

<style>
	.page-header {
		display: grid;
		gap: 0;
	}

	h1 {
		font-size: clamp(2.4rem, 5vw, 3rem);
		letter-spacing: 0;
		line-height: 0.95;
		margin: 0.75rem 0;
	}

	p {
		margin: 0;
	}
</style>
