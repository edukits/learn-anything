<script lang="ts">
	import { Button, Select, type SelectOption } from '@learn-anything/ui';

	type ContentIssueReportFormProps = {
		contentType: string;
		contentId: string;
		contentVersion?: number | null;
		compact?: boolean;
		targets?: { value: string; label: string }[];
	};

	const issueTypeOptions: SelectOption[] = [
		{ value: 'accuracy', label: 'Accuracy' },
		{ value: 'clarity', label: 'Clarity' },
		{ value: 'typo', label: 'Typo' },
		{ value: 'accessibility', label: 'Accessibility' },
		{ value: 'technical', label: 'Technical' },
		{ value: 'other', label: 'Other' }
	];

	let {
		contentType,
		contentId,
		contentVersion = null,
		compact = false,
		targets = []
	}: ContentIssueReportFormProps = $props();

	let issueType = $state('accuracy');
	let selectedTarget = $state('');

	let targetOptions = $derived(
		targets.map((entry) => ({
			value: entry.value,
			label: entry.label
		}))
	);

	function getTargetValue() {
		if (selectedTarget && targets.some((entry) => entry.value === selectedTarget)) {
			return selectedTarget;
		}

		return targets[0]?.value ?? '';
	}

	function setTargetValue(value: string) {
		selectedTarget = value;
	}
</script>

<form class:compact method="POST" action="?/reportIssue">
	<input type="hidden" name="contentType" value={contentType} />
	<input type="hidden" name="contentId" value={contentId} />
	<input type="hidden" name="contentVersion" value={contentVersion ?? ''} />
	{#if targets.length === 1}
		<input type="hidden" name="target" value={targets[0].value} />
		<div class="static-field">
			<span>Current problem</span>
			<p>{targets[0].label}</p>
		</div>
	{:else if targets.length > 1}
		<label>
			<span>Content</span>
			<Select
				name="target"
				options={targetOptions}
				bind:value={getTargetValue, setTargetValue}
				required
				ariaLabel="Content"
			/>
		</label>
	{/if}
	<label>
		<span>Report an issue</span>
		<Select
			name="issueType"
			options={issueTypeOptions}
			bind:value={issueType}
			ariaLabel="Issue category"
		/>
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

	label span,
	.static-field span {
		color: var(--color-text-muted);
		font-size: 0.8rem;
		font-weight: 780;
		text-transform: uppercase;
	}

	.static-field {
		display: grid;
		gap: 6px;
	}

	.static-field p {
		background: var(--color-surface-raised);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		color: var(--color-text);
		font: inherit;
		margin: 0;
		padding: 10px 12px;
	}

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
