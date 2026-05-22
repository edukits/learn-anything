<script lang="ts">
	import { Button } from '@learn-anything/ui';

	type ContentIssueReportFormProps = {
		contentType: string;
		contentId: string;
		contentVersion?: number | null;
		compact?: boolean;
		targets?: { value: string; label: string }[];
	};

	let {
		contentType,
		contentId,
		contentVersion = null,
		compact = false,
		targets = []
	}: ContentIssueReportFormProps = $props();
</script>

<form class:compact method="POST" action="?/reportIssue">
	<input type="hidden" name="contentType" value={contentType} />
	<input type="hidden" name="contentId" value={contentId} />
	<input type="hidden" name="contentVersion" value={contentVersion ?? ''} />
	{#if targets.length}
		<label>
			<span>Content</span>
			<select name="target" required>
				{#each targets as target (target.value)}
					<option value={target.value}>{target.label}</option>
				{/each}
			</select>
		</label>
	{/if}
	<label>
		<span>Report an issue</span>
		<select name="issueType">
			<option value="accuracy">Accuracy</option>
			<option value="clarity">Clarity</option>
			<option value="typo">Typo</option>
			<option value="accessibility">Accessibility</option>
			<option value="technical">Technical</option>
			<option value="other">Other</option>
		</select>
	</label>
	<label>
		<span>Details</span>
		<textarea name="message" minlength="3" maxlength="2000" required></textarea>
	</label>
	<Button type="submit" variant="secondary" label="Send report" />
</form>

<style>
	form {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		display: grid;
		gap: 12px;
		padding: 16px;
	}

	form.compact {
		font-size: 0.9rem;
	}

	label {
		display: grid;
		gap: 6px;
	}

	label span {
		color: var(--color-text-muted);
		font-size: 0.8rem;
		font-weight: 780;
		text-transform: uppercase;
	}

	select,
	textarea {
		background: var(--color-surface-raised);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		color: var(--color-text);
		font: inherit;
		padding: 10px 12px;
	}

	textarea {
		min-block-size: 84px;
		resize: vertical;
	}
</style>
