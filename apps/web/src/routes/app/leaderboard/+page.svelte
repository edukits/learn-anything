<script lang="ts">
	import type { PageProps } from './$types';
	import { Button, Tabs, type TabItem } from '@learn-anything/ui';
	import { Crown, Settings, Trophy, UserRound } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { buildNotionistsAvatarUrl, type PublicAvatarOptions } from '$lib/features/social';

	let { data }: PageProps = $props();

	let selectedTopicId = $derived(data.activeTopicId ?? '');
	let selectedTopicName = $derived(
		data.enrollments.find((enrollment) => enrollment.topic_area_id === selectedTopicId)
			?.topic_name ?? 'Weekly league'
	);
	let leaderboardTabs = $derived.by((): TabItem[] => [
		{ value: null, label: 'Weekly league' },
		...data.enrollments.map((enrollment) => ({
			value: enrollment.topic_area_id,
			label: enrollment.topic_name
		}))
	]);

	let podiumEntries = $derived(data.entries.slice(0, 3));
	let remainingEntries = $derived(data.entries.slice(3));
	let viewerEntry = $derived(data.entries.find((e) => e.is_viewer));
	let viewerRank = $derived(viewerEntry?.rank ?? null);

	function handleLeaderboardTabChange(topicId: string | null) {
		void goto(topicId ? `/app/leaderboard?topic=${topicId}` : '/app/leaderboard');
	}

	function ordinal(n: number): string {
		const s = ['th', 'st', 'nd', 'rd'];
		const v = n % 100;
		return n + (s[(v - 20) % 10] || s[v] || s[0]);
	}

	function safeAvatarUrl(options: PublicAvatarOptions | null | undefined, size: number) {
		if (!options) return null;
		try {
			return buildNotionistsAvatarUrl(options, size);
		} catch {
			return null;
		}
	}
</script>

<main class="page leaderboard-page">
	<section class="hero">
		<div class="hero-text">
			<p class="eyebrow">Leaderboard</p>
			<h1>{selectedTopicName}</h1>
			<p class="hero-subtitle">
				{#if data.profile.leaderboard_opt_in}
					{data.membership?.league_key ?? 'Topic rankings'} · resets weekly
				{:else}
					Opt in to compare weekly XP with other learners.
				{/if}
			</p>
		</div>
		<div class="hero-actions">
			{#if !data.profile.leaderboard_opt_in}
				<Button href="/app/profile" label="Set up profile" />
			{:else}
				<Button href="/app/profile" variant="secondary">
					<Settings size={16} />
					Profile
				</Button>
			{/if}
		</div>
	</section>

	<Tabs
		items={leaderboardTabs}
		value={data.activeTopicId}
		ariaLabel="Leaderboard scopes"
		onchange={handleLeaderboardTabChange}
	/>

	{#if !data.profile.leaderboard_opt_in}
		<section class="opt-in-prompt">
			<div class="opt-in-icon">
				<Trophy size={32} />
			</div>
			<h2>Join the leaderboard</h2>
			<p>Set up your public profile to see how you rank against other learners this week.</p>
			<Button href="/app/profile" label="Set up profile" />
		</section>
	{:else if data.entries.length === 0}
		<section class="opt-in-prompt">
			<Trophy size={32} />
			<h2>No activity yet</h2>
			<p>Nobody has earned XP this week. Start learning to claim the top spot.</p>
		</section>
	{:else}
		{#if viewerEntry}
			{@const viewerAvatarUrl = safeAvatarUrl(viewerEntry.avatar_options, 72)}
			<section class="viewer-strip" aria-label="Your ranking">
				<div class="viewer-avatar">
					{#if viewerAvatarUrl}
						<img src={viewerAvatarUrl} alt="" />
					{:else}
						<UserRound size={18} />
					{/if}
				</div>
				<div class="viewer-info">
					<strong>Your rank</strong>
					<span>{ordinal(viewerEntry.rank)} place · {viewerEntry.xp_points} XP</span>
				</div>
			</section>
		{/if}

		{#if podiumEntries.length >= 3}
			{@const podiumOrder = [podiumEntries[1], podiumEntries[0], podiumEntries[2]]}
			<section class="podium" aria-label="Top 3 learners">
				{#each podiumOrder as entry, i (entry.entry_key)}
					{@const place = i === 1 ? 1 : i === 0 ? 2 : 3}
					{@const avatarUrl = safeAvatarUrl(entry.avatar_options, place === 1 ? 144 : 112)}
					<article class="podium-slot" data-place={place} class:is-viewer={entry.is_viewer}>
						<div class="podium-avatar" data-place={place}>
							{#if avatarUrl}
								<img src={avatarUrl} alt="" />
							{:else}
								<UserRound size={place === 1 ? 28 : 22} />
							{/if}
							<span class="place-badge" data-place={place}>
								{#if place === 1}
									<Crown size={12} />
								{:else}
									{place}
								{/if}
							</span>
						</div>
						<strong class="podium-name">{entry.display_name}</strong>
						{#if entry.title}
							<span class="podium-title">{entry.title}</span>
						{/if}
						<span class="podium-xp">{entry.xp_points} XP</span>
					</article>
				{/each}
			</section>
		{:else}
			<section class="podium-compact" aria-label="Top learners">
				{#each podiumEntries as entry (entry.entry_key)}
					{@const avatarUrl = safeAvatarUrl(entry.avatar_options, 80)}
					<article class="rank-row" class:is-viewer={entry.is_viewer}>
						<span class="rank-num" data-place={entry.rank}>{entry.rank}</span>
						<div class="rank-avatar">
							{#if avatarUrl}
								<img src={avatarUrl} alt="" />
							{:else}
								<UserRound size={20} />
							{/if}
						</div>
						<div class="rank-info">
							<strong>{entry.display_name}</strong>
							{#if entry.title}<em>{entry.title}</em>{/if}
						</div>
						<span class="rank-xp">{entry.xp_points} XP</span>
					</article>
				{/each}
			</section>
		{/if}

		{#if remainingEntries.length > 0}
			<section class="rankings" aria-label="Rankings">
				{#each remainingEntries as entry (entry.entry_key)}
					{@const avatarUrl = safeAvatarUrl(entry.avatar_options, 80)}
					<article class="rank-row" class:is-viewer={entry.is_viewer}>
						<span class="rank-num">{entry.rank}</span>
						<div class="rank-avatar">
							{#if avatarUrl}
								<img src={avatarUrl} alt="" />
							{:else}
								<UserRound size={20} />
							{/if}
						</div>
						<div class="rank-info">
							<strong>{entry.display_name}</strong>
							{#if entry.title}<em>{entry.title}</em>{/if}
						</div>
						<span class="rank-xp">{entry.xp_points} XP</span>
					</article>
				{/each}
			</section>
		{/if}
	{/if}
</main>

<style>
	.leaderboard-page {
		display: grid;
		gap: 24px;
	}

	/* ---- Hero ---- */

	.hero {
		align-items: center;
		display: flex;
		gap: 24px;
		justify-content: space-between;
		padding: clamp(20px, 4vw, 36px) 0;
		border-bottom: 1px dashed var(--color-border);
	}

	.hero-text {
		display: grid;
		gap: 4px;
	}

	.hero h1 {
		font-size: clamp(2rem, 4.5vw, 2.8rem);
		letter-spacing: 0;
		line-height: 1;
		margin: 0;
	}

	.hero p {
		margin: 0;
	}

	.hero-subtitle {
		color: var(--color-text-muted);
	}

	.hero-actions {
		flex-shrink: 0;
	}

	/* ---- Viewer strip ---- */

	.viewer-strip {
		align-items: center;
		background: var(--color-surface-accent);
		border: 1px solid color-mix(in srgb, var(--color-accent), transparent 70%);
		border-radius: var(--radius-md);
		display: flex;
		gap: 14px;
		padding: 14px 20px;
	}

	.viewer-avatar {
		align-items: center;
		aspect-ratio: 1;
		background: var(--color-surface);
		border: 2px solid var(--color-accent);
		border-radius: 50%;
		color: var(--color-accent);
		display: grid;
		block-size: 36px;
		inline-size: 36px;
		justify-items: center;
		overflow: hidden;
		flex-shrink: 0;
	}

	.viewer-avatar img {
		block-size: 100%;
		inline-size: 100%;
		object-fit: cover;
	}

	.viewer-info {
		display: grid;
		gap: 1px;
	}

	.viewer-info strong {
		font-size: 0.9rem;
	}

	.viewer-info span {
		color: var(--color-text-muted);
		font-size: 0.84rem;
	}

	/* ---- Opt-in / empty state ---- */

	.opt-in-prompt {
		align-items: center;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		color: var(--color-text-muted);
		display: grid;
		gap: 14px;
		justify-items: center;
		padding: 56px 32px;
		text-align: center;
	}

	.opt-in-icon {
		--tone-top: calc(var(--color-accent-l) + 10%);
		--tone-bottom: calc(var(--color-accent-l) - 12%);
		--tone-border: calc(var(--color-accent-l) - 22%);
		align-items: center;
		background: linear-gradient(
			to bottom,
			hsl(var(--color-accent-h) var(--color-accent-s) var(--tone-top)),
			hsl(var(--color-accent-h) var(--color-accent-s) var(--tone-bottom))
		);
		border: 1px solid hsl(var(--color-accent-h) var(--color-accent-s) var(--tone-border));
		border-radius: 999px;
		box-shadow:
			inset 0 2px 1px
				hsl(
					var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) + 20%) / 0.5
				),
			0 2px 0 hsl(var(--color-accent-h) var(--color-accent-s) var(--tone-border));
		color: var(--color-accent-contrast);
		display: grid;
		block-size: 64px;
		inline-size: 64px;
		justify-items: center;
	}

	.opt-in-prompt h2 {
		color: var(--color-text);
		font-size: 1.2rem;
		margin: 0;
	}

	.opt-in-prompt p {
		margin: 0;
		max-inline-size: 36ch;
	}

	/* ---- Podium (top 3) ---- */

	.podium {
		display: grid;
		gap: 12px;
		grid-template-columns: 1fr 1.15fr 1fr;
		align-items: end;
		padding-block-start: 24px;
	}

	.podium-slot {
		align-items: center;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		display: grid;
		gap: 6px;
		justify-items: center;
		padding: 24px 16px 20px;
		text-align: center;
		transition:
			border-color 0.2s,
			box-shadow 0.2s;
	}

	.podium-slot[data-place='1'] {
		padding-block: 32px 28px;
	}

	.podium-slot.is-viewer {
		border-color: var(--color-accent);
		box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-accent), transparent 60%);
	}

	.podium-avatar {
		position: relative;
		display: grid;
		align-items: center;
		justify-items: center;
	}

	.podium-avatar[data-place='1'] {
		block-size: 72px;
		inline-size: 72px;
		background: var(--color-surface-raised);
		border: 3px solid hsl(var(--color-star-h) var(--color-star-s) var(--color-star-l));
		border-radius: 50%;
		box-shadow: 0 0 16px hsl(var(--color-star-h) var(--color-star-s) var(--color-star-l) / 0.2);
		color: var(--color-text-muted);
		overflow: hidden;
	}

	.podium-avatar[data-place='2'],
	.podium-avatar[data-place='3'] {
		block-size: 56px;
		inline-size: 56px;
		background: var(--color-surface-raised);
		border: 2px solid var(--color-border);
		border-radius: 50%;
		color: var(--color-text-muted);
		overflow: hidden;
	}

	.podium-avatar img {
		block-size: 100%;
		inline-size: 100%;
		object-fit: cover;
	}

	.place-badge {
		align-items: center;
		border-radius: 50%;
		display: inline-flex;
		font-size: 0.7rem;
		font-weight: 800;
		block-size: 22px;
		inline-size: 22px;
		justify-content: center;
		position: absolute;
		inset-block-end: -4px;
		inset-inline-end: -4px;
	}

	.place-badge[data-place='1'] {
		background: linear-gradient(
			to bottom,
			hsl(var(--color-star-h) var(--color-star-s) calc(var(--color-star-l) + 8%)),
			hsl(var(--color-star-h) var(--color-star-s) calc(var(--color-star-l) - 8%))
		);
		border: 1px solid hsl(var(--color-star-h) var(--color-star-s) calc(var(--color-star-l) - 18%));
		box-shadow: inset 0 1px 1px
			hsl(var(--color-star-h) var(--color-star-s) calc(var(--color-star-l) + 22%) / 0.5);
		color: #fff;
	}

	.place-badge[data-place='2'] {
		background: linear-gradient(to bottom, hsl(0 0% 82%), hsl(0 0% 68%));
		border: 1px solid hsl(0 0% 58%);
		box-shadow: inset 0 1px 1px hsl(0 0% 100% / 0.4);
		color: #fff;
	}

	.place-badge[data-place='3'] {
		background: linear-gradient(to bottom, hsl(28 60% 60%), hsl(28 60% 46%));
		border: 1px solid hsl(28 60% 36%);
		box-shadow: inset 0 1px 1px hsl(28 60% 72% / 0.45);
		color: #fff;
	}

	.podium-name {
		font-size: 0.95rem;
		line-height: 1.2;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-inline-size: 100%;
	}

	.podium-slot[data-place='1'] .podium-name {
		font-size: 1.05rem;
	}

	.podium-title {
		color: var(--color-text-muted);
		font-size: 0.78rem;
		font-style: normal;
	}

	.podium-xp {
		color: var(--color-text-muted);
		font-size: 0.82rem;
		font-weight: 700;
	}

	.podium-slot[data-place='1'] .podium-xp {
		color: hsl(var(--color-star-h) var(--color-star-s) 42%);
	}

	/* ---- Rank rows ---- */

	.rankings,
	.podium-compact {
		display: grid;
		gap: 6px;
	}

	.rank-row {
		align-items: center;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		display: grid;
		gap: 14px;
		grid-template-columns: 36px 40px 1fr auto;
		padding: 12px 16px;
		transition:
			border-color 0.15s,
			background 0.15s;
	}

	.rank-row:hover {
		background: var(--color-surface-raised);
	}

	.rank-row.is-viewer {
		border-color: var(--color-accent);
		background: color-mix(in srgb, var(--color-accent), transparent 96%);
	}

	.rank-num {
		font-family: var(--font-display);
		font-size: 0.95rem;
		font-weight: 700;
		text-align: center;
		color: var(--color-text-muted);
	}

	.rank-num[data-place='1'] {
		color: hsl(var(--color-star-h) var(--color-star-s) 42%);
	}

	.rank-num[data-place='2'] {
		color: hsl(0 0% 52%);
	}

	.rank-num[data-place='3'] {
		color: hsl(28 55% 48%);
	}

	.rank-avatar {
		align-items: center;
		aspect-ratio: 1;
		background: var(--color-surface-raised);
		border: 1px solid var(--color-border);
		border-radius: 50%;
		color: var(--color-text-muted);
		display: grid;
		justify-items: center;
		overflow: hidden;
	}

	.rank-avatar img {
		block-size: 100%;
		inline-size: 100%;
		object-fit: cover;
	}

	.rank-info {
		display: grid;
		gap: 2px;
		min-inline-size: 0;
	}

	.rank-info strong {
		font-size: 0.95rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.rank-info em {
		color: var(--color-text-muted);
		font-size: 0.82rem;
		font-style: normal;
	}

	.rank-xp {
		font-size: 0.88rem;
		font-weight: 700;
		color: var(--color-text-muted);
		white-space: nowrap;
	}

	/* ---- Responsive ---- */

	@media (max-width: 640px) {
		.hero {
			flex-direction: column;
			align-items: start;
		}

		.podium {
			grid-template-columns: 1fr;
			align-items: stretch;
			padding-block-start: 0;
		}

		.podium-slot {
			grid-template-columns: auto 1fr auto;
			grid-auto-flow: column;
			justify-items: start;
			text-align: start;
			padding: 16px;
			gap: 12px;
		}

		.podium-slot[data-place='1'] {
			padding: 16px;
		}

		.podium-avatar[data-place='1'],
		.podium-avatar[data-place='2'],
		.podium-avatar[data-place='3'] {
			block-size: 44px;
			inline-size: 44px;
			border-width: 2px;
		}

		.podium-title,
		.podium-xp {
			grid-column: 2;
		}

		.rank-row {
			grid-template-columns: 28px 36px 1fr auto;
			gap: 10px;
			padding: 10px 14px;
		}
	}
</style>
