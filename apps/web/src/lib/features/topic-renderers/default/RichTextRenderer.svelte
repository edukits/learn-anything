<script lang="ts">
	import { RichText } from '@learn-anything/ui';

	let { content }: { content: string } = $props();
</script>

<RichText {content} />
