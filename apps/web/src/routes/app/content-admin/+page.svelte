<script lang="ts">
	import type { PageProps } from './$types';
	import { Button } from '@learn-anything/ui';
	import { ClipboardCheck, FileWarning, Gauge, Rocket } from '@lucide/svelte';
	import {
		canPublishRelease,
		canRollbackRelease,
		getDiffSummaryLabel
	} from '$lib/features/content-admin/release-controls';

	let { data, form }: PageProps = $props();
	let openIssueCount = $derived(data.openIssues.length);
	let reviewedReleaseCount = $derived(data.releaseReviews.length);
	let totalQuestionCount = $derived(
		data.qualityMetrics.reduce((total, metric) => total + metric.question_count, 0)
	);

	function formatEvidenceDate(value: string | null) {
		if (!value) return 'missing';
		return `${new Date(value).toISOString().slice(0, 16).replace('T', ' ')} UTC`;
	}
</script>

<main class="page content-admin-page">
	<section class="hero">
		<ClipboardCheck size={32} />
		<p class="eyebrow">Content admin</p>
		<h1>Quality dashboard</h1>
		<p>{data.admin.role} · {totalQuestionCount} questions · {openIssueCount} open issues</p>
	</section>

	<section class="metric-grid" aria-label="Admin summary">
		<article>
			<Gauge size={20} />
			<strong>{data.qualityMetrics.length}</strong>
			<span>metric slices</span>
		</article>
		<article>
			<FileWarning size={20} />
			<strong>{openIssueCount}</strong>
			<span>open issues</span>
		</article>
		<article>
			<Rocket size={20} />
			<strong>{reviewedReleaseCount}</strong>
			<span>release reviews</span>
		</article>
	</section>

	<section>
		<h2>Content quality</h2>
		<div class="table">
			<div class="row header">
				<span>Subject</span>
				<span>Topic</span>
				<span>Release</span>
				<span>Type</span>
				<span>Questions</span>
				<span>Answers</span>
				<span>Correct</span>
				<span>Issues</span>
			</div>
			{#each data.qualityMetrics as metric (`${metric.release_id}:${metric.question_type}`)}
				<div class="row">
					<span>{metric.subject_name}</span>
					<span>{metric.topic_name}</span>
					<span>{metric.release_title}</span>
					<span>{metric.question_type}</span>
					<span>{metric.question_count}</span>
					<span>{metric.answer_count}</span>
					<span>{metric.correct_rate === null ? 'n/a' : `${Math.round(metric.correct_rate * 100)}%`}</span>
					<span>{metric.open_issue_count}</span>
				</div>
			{/each}
		</div>
	</section>

	<section>
		<h2>Release controls</h2>
		{#if form?.error}
			<p class="message error">{form.error}</p>
		{:else if form?.saved}
			<p class="message">Release review updated.</p>
		{/if}
		<div class="release-list">
			{#each data.releaseReviews as review (review.release_id)}
				<article>
					<div>
						<strong>{review.content_release?.title ?? review.release_id}</strong>
						<span>{review.review_status} · {review.content_release?.status ?? 'unknown'}</span>
					</div>
					<div class="evidence-grid" aria-label="Release evidence">
						<span class:ok={review.validation_passed}>
							Validation {review.validation_passed ? 'passed' : 'failed'}
						</span>
						<span>Staged {formatEvidenceDate(review.staging_imported_at)}</span>
						<span>Smoke {formatEvidenceDate(review.smoke_tested_at)}</span>
						<span>{getDiffSummaryLabel(review.diff_report)}</span>
					</div>
					<form method="POST" action="?/reviewRelease">
						<input type="hidden" name="releaseId" value={review.release_id} />
						<textarea name="notes" placeholder="Reviewer notes">{review.reviewer_notes ?? ''}</textarea>
						<div>
							<Button type="submit" name="decision" value="approved" size="sm" label="Approve" />
							<Button type="submit" name="decision" value="rejected" size="sm" variant="secondary" label="Reject" />
							{#if canPublishRelease(data.admin.role, review)}
								<Button type="submit" name="decision" value="published" size="sm" variant="secondary" label="Publish" />
							{/if}
							{#if canRollbackRelease(data.admin.role, review)}
								<Button type="submit" name="decision" value="rolled_back" size="sm" variant="ghost" label="Rollback" />
							{/if}
						</div>
					</form>
				</article>
			{:else}
				<p>No release reviews staged.</p>
			{/each}
		</div>
	</section>

	<section>
		<h2>Open issues</h2>
		<div class="issue-list">
			{#each data.openIssues as issue (issue.id)}
				<article>
					<div>
						<strong>{issue.content_type}: {issue.content_id}</strong>
						<span>{issue.issue_type} · {issue.severity} · {issue.status}</span>
					</div>
					<p>{issue.message}</p>
					<form method="POST" action="?/updateIssue">
						<input type="hidden" name="issueId" value={issue.id} />
						<label>
							<span>Status</span>
							<select name="status">
								<option value="triaged" selected={issue.status === 'triaged'}>Triaged</option>
								<option value="resolved" selected={issue.status === 'resolved'}>Resolved</option>
								<option value="dismissed" selected={issue.status === 'dismissed'}>Dismissed</option>
								<option value="open" selected={issue.status === 'open'}>Open</option>
							</select>
						</label>
						<textarea name="notes" placeholder="Resolution notes">{issue.resolution_notes ?? ''}</textarea>
						<Button type="submit" size="sm" variant="secondary" label="Update issue" />
					</form>
				</article>
			{:else}
				<p>No open content issues.</p>
			{/each}
		</div>
	</section>
</main>

<style>
	.content-admin-page {
		display: grid;
		gap: 20px;
	}

	.hero,
	.metric-grid article,
	section {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
	}

	.hero,
	section {
		display: grid;
		gap: 14px;
		padding: clamp(20px, 4vw, 32px);
	}

	.hero h1,
	.hero p,
	h2,
	p {
		margin: 0;
	}

	.hero h1 {
		font-size: clamp(2rem, 4vw, 3.2rem);
		letter-spacing: 0;
		line-height: 1;
	}

	.hero > p:not(.eyebrow),
	.row.header,
	.release-list span,
	.issue-list span,
	section > p {
		color: var(--color-text-muted);
	}

	.metric-grid {
		display: grid;
		gap: 12px;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
	}

	.metric-grid article {
		display: grid;
		gap: 8px;
		padding: 16px;
	}

	.metric-grid strong {
		font-size: 1.8rem;
		line-height: 1;
	}

	.table,
	.release-list,
	.issue-list {
		display: grid;
		gap: 10px;
	}

	.row {
		background: var(--color-surface-raised);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		display: grid;
		gap: 10px;
		grid-template-columns: repeat(3, minmax(130px, 1.2fr)) repeat(5, minmax(74px, 1fr));
		padding: 10px 12px;
	}

	.row.header {
		background: transparent;
		border: 0;
		font-size: 0.82rem;
		font-weight: 780;
		padding-block: 0;
		text-transform: uppercase;
	}

	.release-list article,
	.issue-list article {
		background: var(--color-surface-raised);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		display: grid;
		gap: 12px;
		padding: 14px;
	}

	.release-list article > div,
	.issue-list article > div {
		display: grid;
		gap: 4px;
	}

	.evidence-grid {
		display: grid;
		gap: 8px;
		grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
	}

	.evidence-grid span {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		color: var(--color-text-muted);
		padding: 8px 10px;
	}

	.evidence-grid span.ok {
		color: var(--color-success, var(--color-text));
	}

	form {
		display: grid;
		gap: 10px;
	}

	form div {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	label {
		display: grid;
		gap: 6px;
	}

	select,
	textarea {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		color: var(--color-text);
		font: inherit;
		min-block-size: 68px;
		padding: 10px 12px;
		resize: vertical;
	}

	@media (max-width: 760px) {
		.row {
			grid-template-columns: 1fr 1fr;
		}

		.row.header {
			display: none;
		}
	}
</style>
