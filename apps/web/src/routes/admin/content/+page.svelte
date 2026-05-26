<script lang="ts">
	import type { PageProps } from './$types';
	import { Button } from '@learn-anything/ui';
	import { AlertCircle, ClipboardCheck, FileWarning, Gauge, Rocket } from '@lucide/svelte';
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
	let totalOpenIssuesInMetrics = $derived(
		data.qualityMetrics.reduce((total, metric) => total + metric.open_issue_count, 0)
	);

	function formatEvidenceDate(value: string | null) {
		if (!value) return 'missing';
		return `${new Date(value).toISOString().slice(0, 16).replace('T', ' ')} UTC`;
	}

	function formatCorrectRate(value: number | null) {
		if (value === null) return 'n/a';
		return `${Math.round(value * 100)}%`;
	}

	function reviewStatusTone(status: string) {
		if (status === 'approved' || status === 'published') return 'success';
		if (status === 'rejected' || status === 'rolled_back') return 'danger';
		return 'neutral';
	}

	function severityTone(severity: string) {
		if (severity === 'critical' || severity === 'high') return 'danger';
		if (severity === 'medium') return 'warning';
		return 'neutral';
	}
</script>

<main class="page content-admin-page">
	<header class="hero">
		<div class="hero-text">
			<p class="eyebrow">Content admin</p>
			<h1>Quality dashboard</h1>
			<p class="hero-subtitle">
				<span class="role-badge">{data.admin.role}</span>
				Monitor content quality, triage issues, and manage release reviews.
			</p>
		</div>

		<div class="hero-stats" aria-label="Dashboard summary">
			<div class="stat">
				<strong>{totalQuestionCount}</strong>
				<span>Questions</span>
			</div>
			<div class="stat-divider" aria-hidden="true"></div>
			<div class="stat">
				<strong>{data.qualityMetrics.length}</strong>
				<span>Metric slices</span>
			</div>
			<div class="stat-divider" aria-hidden="true"></div>
			<div class="stat">
				<strong class:warn={openIssueCount > 0}>{openIssueCount}</strong>
				<span>Open issues</span>
			</div>
			<div class="stat-divider" aria-hidden="true"></div>
			<div class="stat">
				<strong>{reviewedReleaseCount}</strong>
				<span>Release reviews</span>
			</div>
		</div>
	</header>

	{#if form?.error}
		<p class="message error" role="alert">{form.error}</p>
	{:else if form?.saved}
		<p class="message success" role="status">Changes saved.</p>
	{/if}

	<section class="panel quality-panel" aria-labelledby="quality-heading">
		<header class="section-header">
			<div class="section-title">
				<Gauge size={18} aria-hidden="true" />
				<h2 id="quality-heading">Content quality</h2>
			</div>
			<p>
				{data.qualityMetrics.length} slices · {totalQuestionCount} questions · {totalOpenIssuesInMetrics}
				tracked issues
			</p>
		</header>

		{#if data.qualityMetrics.length === 0}
			<p class="empty-state">No quality metrics yet. Import or publish content to populate this view.</p>
		{:else}
			<div class="table-scroll" aria-label="Content quality metrics">
				<table class="metrics-table">
					<thead>
						<tr>
							<th scope="col">Subject</th>
							<th scope="col">Topic</th>
							<th scope="col">Release</th>
							<th scope="col">Purpose</th>
							<th scope="col">Response</th>
							<th scope="col" class="num">Questions</th>
							<th scope="col" class="num">Answers</th>
							<th scope="col" class="num">Correct</th>
							<th scope="col" class="num">Issues</th>
						</tr>
					</thead>
					<tbody>
						{#each data.qualityMetrics as metric (`${metric.release_id}:${metric.question_purpose}:${metric.response_type}`)}
							<tr class:has-issues={metric.open_issue_count > 0}>
								<td data-label="Subject">{metric.subject_name}</td>
								<td data-label="Topic">{metric.topic_name}</td>
								<td data-label="Release">{metric.release_title}</td>
								<td data-label="Purpose">{metric.question_purpose}</td>
								<td data-label="Response">{metric.response_type}</td>
								<td class="num" data-label="Questions">{metric.question_count}</td>
								<td class="num" data-label="Answers">{metric.answer_count}</td>
								<td class="num" data-label="Correct">{formatCorrectRate(metric.correct_rate)}</td>
								<td class="num" data-label="Issues">
									{#if metric.open_issue_count > 0}
										<span class="issue-count">{metric.open_issue_count}</span>
									{:else}
										0
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>

	<div class="two-col">
		<section class="panel" aria-labelledby="releases-heading">
			<header class="section-header">
				<div class="section-title">
					<Rocket size={18} aria-hidden="true" />
					<h2 id="releases-heading">Release controls</h2>
				</div>
				<p>{reviewedReleaseCount} release{reviewedReleaseCount === 1 ? '' : 's'} awaiting review</p>
			</header>

			<div class="release-list">
				{#each data.releaseReviews as review (review.release_id)}
					<article class="workflow-card">
						<div class="card-head">
							<div class="card-title">
								<strong>{review.content_release?.title ?? review.release_id}</strong>
								<div class="badge-row">
									<span class="badge" data-tone={reviewStatusTone(review.review_status)}>
										{review.review_status}
									</span>
									<span class="badge neutral">
										{review.content_release?.status ?? 'unknown'}
									</span>
								</div>
							</div>
						</div>

						<div class="evidence-grid" aria-label="Release evidence">
							<span class="evidence" class:ok={review.validation_passed}>
								Validation {review.validation_passed ? 'passed' : 'failed'}
							</span>
							<span class="evidence">Staged {formatEvidenceDate(review.staging_imported_at)}</span>
							<span class="evidence">Smoke {formatEvidenceDate(review.smoke_tested_at)}</span>
							<span class="evidence">{getDiffSummaryLabel(review.diff_report)}</span>
						</div>

						<form method="POST" action="?/reviewRelease" class="workflow-form">
							<input type="hidden" name="releaseId" value={review.release_id} />
							<label class="field">
								<span>Reviewer notes</span>
								<textarea name="notes" placeholder="Add context for this decision"
									>{review.reviewer_notes ?? ''}</textarea
								>
							</label>
							<div class="button-row">
								<Button type="submit" name="decision" value="approved" size="sm" label="Approve" />
								<Button
									type="submit"
									name="decision"
									value="rejected"
									size="sm"
									variant="secondary"
									label="Reject"
								/>
								{#if canPublishRelease(data.admin.role, review)}
									<Button
										type="submit"
										name="decision"
										value="published"
										size="sm"
										variant="secondary"
										label="Publish"
									/>
								{/if}
								{#if canRollbackRelease(data.admin.role, review)}
									<Button
										type="submit"
										name="decision"
										value="rolled_back"
										size="sm"
										variant="ghost"
										label="Rollback"
									/>
								{/if}
							</div>
						</form>
					</article>
				{:else}
					<p class="empty-state">
						<ClipboardCheck size={20} aria-hidden="true" />
						No release reviews staged.
					</p>
				{/each}
			</div>
		</section>

		<section class="panel" aria-labelledby="issues-heading">
			<header class="section-header">
				<div class="section-title">
					<FileWarning size={18} aria-hidden="true" />
					<h2 id="issues-heading">Open issues</h2>
				</div>
				<p>{openIssueCount} issue{openIssueCount === 1 ? '' : 's'} need attention</p>
			</header>

			<div class="issue-list">
				{#each data.openIssues as issue (issue.id)}
					<article class="workflow-card">
						<div class="card-head">
							<div class="card-title">
								<strong>{issue.content_type}: {issue.content_id}</strong>
								<div class="badge-row">
									<span class="badge" data-tone={severityTone(issue.severity)}>{issue.severity}</span>
									<span class="badge neutral">{issue.issue_type}</span>
									<span class="badge" data-tone={issue.status === 'open' ? 'warning' : 'neutral'}>
										{issue.status}
									</span>
								</div>
							</div>
						</div>

						<p class="issue-message">{issue.message}</p>

						<form method="POST" action="?/updateIssue" class="workflow-form">
							<input type="hidden" name="issueId" value={issue.id} />
							<label class="field">
								<span>Status</span>
								<select name="status">
									<option value="triaged" selected={issue.status === 'triaged'}>Triaged</option>
									<option value="resolved" selected={issue.status === 'resolved'}>Resolved</option>
									<option value="dismissed" selected={issue.status === 'dismissed'}>Dismissed</option>
									<option value="open" selected={issue.status === 'open'}>Open</option>
								</select>
							</label>
							<label class="field">
								<span>Resolution notes</span>
								<textarea name="notes" placeholder="Document what changed or why this was dismissed"
									>{issue.resolution_notes ?? ''}</textarea
								>
							</label>
							<div class="button-row">
								<Button type="submit" size="sm" variant="secondary" label="Update issue" />
							</div>
						</form>
					</article>
				{:else}
					<p class="empty-state">
						<AlertCircle size={20} aria-hidden="true" />
						No open content issues.
					</p>
				{/each}
			</div>
		</section>
	</div>
</main>

<style>
	.content-admin-page {
		display: grid;
		gap: 28px;
		padding-block: 32px 56px;
	}

	h1,
	h2,
	p {
		margin: 0;
	}

	/* ---- Hero ---- */

	.hero {
		align-items: center;
		border-bottom: 1px dashed var(--color-border);
		display: flex;
		gap: 32px;
		justify-content: space-between;
		padding-block: clamp(12px, 3vw, 20px) clamp(20px, 4vw, 28px);
	}

	.hero-text {
		display: grid;
		gap: 6px;
		max-inline-size: 36rem;
	}

	.hero h1 {
		font-size: clamp(2rem, 4.5vw, 2.8rem);
		letter-spacing: 0;
		line-height: 1;
	}

	.hero-subtitle {
		align-items: center;
		color: var(--color-text-muted);
		display: flex;
		flex-wrap: wrap;
		font-size: 0.92rem;
		gap: 8px;
	}

	.role-badge {
		background: var(--color-surface-accent);
		border: 1px solid color-mix(in srgb, var(--color-accent), transparent 70%);
		border-radius: var(--radius-pill);
		color: hsl(var(--color-accent-h) var(--color-accent-s) 36%);
		font-size: 0.72rem;
		font-weight: 750;
		letter-spacing: 0.03em;
		padding: 3px 10px;
		text-transform: uppercase;
	}

	.hero-stats {
		align-items: center;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		display: flex;
		flex-shrink: 0;
		gap: 18px;
		padding: 16px 20px;
	}

	.stat {
		display: grid;
		gap: 2px;
		min-inline-size: 4.5rem;
		text-align: center;
	}

	.stat strong {
		font-size: 1.5rem;
		line-height: 1;
	}

	.stat strong.warn {
		color: var(--color-warning);
	}

	.stat span {
		color: var(--color-text-muted);
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
	}

	.stat-divider {
		background: var(--color-border);
		block-size: 28px;
		inline-size: 1px;
	}

	/* ---- Panels ---- */

	.panel {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		display: grid;
		gap: 16px;
		padding: clamp(18px, 3vw, 24px);
	}

	.section-header {
		display: grid;
		gap: 4px;
	}

	.section-title {
		align-items: center;
		display: flex;
		gap: 8px;
	}

	.section-title :global(svg) {
		color: var(--color-text-muted);
		flex-shrink: 0;
	}

	.section-header h2 {
		font-size: 1.15rem;
		letter-spacing: 0;
	}

	.section-header p {
		color: var(--color-text-muted);
		font-size: 0.88rem;
	}

	.empty-state {
		align-items: center;
		color: var(--color-text-muted);
		display: flex;
		font-size: 0.92rem;
		gap: 8px;
		justify-content: center;
		padding: 28px 16px;
		text-align: center;
	}

	/* ---- Quality table ---- */

	.table-scroll {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
	}

	.metrics-table {
		border-collapse: collapse;
		font-size: 0.88rem;
		inline-size: 100%;
		min-inline-size: 860px;
	}

	.metrics-table th,
	.metrics-table td {
		border-block-end: 1px solid var(--color-border);
		padding: 10px 12px;
		text-align: start;
		vertical-align: top;
	}

	.metrics-table th {
		background: var(--color-surface-raised);
		color: var(--color-text-muted);
		font-size: 0.72rem;
		font-weight: 750;
		letter-spacing: 0.03em;
		position: sticky;
		top: 0;
		text-transform: uppercase;
		white-space: nowrap;
		z-index: 1;
	}

	.metrics-table tbody tr:last-child td {
		border-block-end: 0;
	}

	.metrics-table tbody tr:hover {
		background: color-mix(in srgb, var(--color-surface-raised), transparent 35%);
	}

	.metrics-table tbody tr.has-issues {
		background: color-mix(in srgb, var(--color-warning), transparent 94%);
	}

	.metrics-table .num {
		font-variant-numeric: tabular-nums;
		text-align: end;
		white-space: nowrap;
	}

	.issue-count {
		background: color-mix(in srgb, var(--color-warning), transparent 82%);
		border-radius: var(--radius-pill);
		color: hsl(var(--color-warning-h) var(--color-warning-s) 32%);
		display: inline-block;
		font-size: 0.78rem;
		font-weight: 700;
		min-inline-size: 1.4rem;
		padding: 2px 8px;
		text-align: center;
	}

	/* ---- Two-column workflow ---- */

	.two-col {
		align-items: start;
		display: grid;
		gap: 20px;
		grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
	}

	.release-list,
	.issue-list {
		display: grid;
		gap: 12px;
	}

	.workflow-card {
		background: var(--color-surface-raised);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		display: grid;
		gap: 14px;
		padding: 16px;
	}

	.card-title {
		display: grid;
		gap: 8px;
	}

	.card-title strong {
		font-size: 0.98rem;
		line-height: 1.3;
		overflow-wrap: anywhere;
	}

	.badge-row {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.badge {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-pill);
		color: var(--color-text-muted);
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.02em;
		padding: 3px 9px;
		text-transform: uppercase;
	}

	.badge[data-tone='success'] {
		background: color-mix(in srgb, var(--color-success), transparent 90%);
		border-color: color-mix(in srgb, var(--color-success), transparent 55%);
		color: hsl(var(--color-success-h) var(--color-success-s) 32%);
	}

	.badge[data-tone='danger'] {
		background: color-mix(in srgb, var(--color-danger), transparent 90%);
		border-color: color-mix(in srgb, var(--color-danger), transparent 55%);
		color: hsl(var(--color-danger-h) var(--color-danger-s) 38%);
	}

	.badge[data-tone='warning'] {
		background: color-mix(in srgb, var(--color-warning), transparent 88%);
		border-color: color-mix(in srgb, var(--color-warning), transparent 55%);
		color: hsl(var(--color-warning-h) var(--color-warning-s) 32%);
	}

	.evidence-grid {
		display: grid;
		gap: 8px;
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	.evidence {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		color: var(--color-text-muted);
		font-size: 0.8rem;
		line-height: 1.35;
		padding: 8px 10px;
	}

	.evidence.ok {
		background: color-mix(in srgb, var(--color-success), transparent 92%);
		border-color: color-mix(in srgb, var(--color-success), transparent 60%);
		color: hsl(var(--color-success-h) var(--color-success-s) 32%);
	}

	.issue-message {
		color: var(--color-text);
		font-size: 0.9rem;
		line-height: 1.45;
	}

	.workflow-form {
		display: grid;
		gap: 12px;
	}

	.field {
		display: grid;
		gap: 6px;
	}

	.field > span {
		color: var(--color-text-muted);
		font-size: 0.78rem;
		font-weight: 700;
		text-transform: uppercase;
	}

	select,
	textarea {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		color: var(--color-text);
		font: inherit;
		padding: 10px 12px;
	}

	textarea {
		min-block-size: 72px;
		resize: vertical;
	}

	select {
		min-block-size: auto;
	}

	/* ---- Responsive ---- */

	@media (max-width: 960px) {
		.two-col {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 760px) {
		.hero {
			align-items: start;
			flex-direction: column;
		}

		.hero-stats {
			align-self: stretch;
			flex-wrap: wrap;
			justify-content: center;
		}

		.stat-divider {
			display: none;
		}

		.table-scroll {
			border: 0;
			overflow-x: visible;
		}

		.metrics-table {
			min-inline-size: 0;
		}

		.metrics-table thead {
			display: none;
		}

		.metrics-table,
		.metrics-table tbody,
		.metrics-table tr,
		.metrics-table td {
			display: block;
			inline-size: 100%;
		}

		.metrics-table tr {
			background: var(--color-surface-raised);
			border: 1px solid var(--color-border);
			border-radius: var(--radius-sm);
			margin-block-end: 10px;
			padding: 12px;
		}

		.metrics-table tr.has-issues {
			border-color: color-mix(in srgb, var(--color-warning), transparent 45%);
		}

		.metrics-table td {
			border: 0;
			display: grid;
			gap: 2px;
			grid-template-columns: minmax(6rem, 38%) 1fr;
			padding: 6px 0;
		}

		.metrics-table td::before {
			color: var(--color-text-muted);
			content: attr(data-label);
			font-size: 0.72rem;
			font-weight: 700;
			text-transform: uppercase;
		}

		.metrics-table td.num {
			text-align: start;
		}

		.evidence-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
