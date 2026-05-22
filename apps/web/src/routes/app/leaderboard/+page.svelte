<script lang="ts">
	import type { PageProps } from './$types';
	import { Button } from '@learn-anything/ui';
	import { ShieldCheck, Trophy, UserRound } from '@lucide/svelte';

	let { data, form }: PageProps = $props();
	let selectedTopicId = $derived(data.activeTopicId ?? '');
	let selectedTopicName = $derived(
		data.enrollments.find((enrollment) => enrollment.topic_area_id === selectedTopicId)?.topic_name ??
			'Weekly league'
	);
	let profileForm = $derived({
		displayName: form?.values?.displayName ?? data.profile.display_name,
		avatarUrl: form?.values?.avatarUrl ?? data.profile.avatar_url ?? '',
		titleRewardKey: form?.values?.titleRewardKey ?? data.profile.equipped_title_reward_key ?? '',
		bio: form?.values?.bio ?? data.profile.bio ?? '',
		leaderboardOptIn: form?.values?.leaderboardOptIn ?? data.profile.leaderboard_opt_in
	});
</script>

<main class="page leaderboard-page">
	<section class="hero">
		<Trophy size={32} />
		<p class="eyebrow">Leaderboard</p>
		<h1>{selectedTopicName}</h1>
		<p>
			{#if data.profile.leaderboard_opt_in}
				{data.membership?.league_key ?? 'Topic leaderboard'} · public profile fields only
			{:else}
				Opt in with a public profile to compare weekly XP.
			{/if}
		</p>
	</section>

	<section class="profile-panel">
		<div>
			<ShieldCheck size={22} />
			<div>
				<h2>Public profile</h2>
				<p>Only display name, avatar, title, and bio appear on leaderboards.</p>
			</div>
		</div>
		<form method="POST" action="?/profile">
			<label>
				<span>Display name</span>
				<input name="displayName" value={profileForm.displayName} maxlength="80" required />
			</label>
			<label>
				<span>Avatar URL</span>
				<input name="avatarUrl" value={profileForm.avatarUrl} maxlength="500" />
			</label>
			<label>
				<span>Title</span>
				<select name="titleRewardKey" value={profileForm.titleRewardKey}>
					<option value="">No title</option>
					{#each data.titleRewards as reward (reward.reward_key)}
						<option value={reward.reward_key}>{reward.reward_label}</option>
					{/each}
				</select>
			</label>
			<label>
				<span>Bio</span>
				<textarea name="bio" maxlength="240">{profileForm.bio}</textarea>
			</label>
			<label class="checkbox">
				<input
					name="leaderboardOptIn"
					type="checkbox"
					checked={profileForm.leaderboardOptIn}
				/>
				<span>Join public weekly leaderboards</span>
			</label>
			<Button type="submit" label="Save profile" />
			{#if form?.error}
				<p class="message error">{form.error}</p>
			{:else if form?.saved}
				<p class="message">Profile saved.</p>
			{/if}
		</form>
	</section>

	<section class="leaderboard-panel">
		<div class="tabs" aria-label="Leaderboard scopes">
			<a class:active={!selectedTopicId} href="/app/leaderboard">Weekly league</a>
			{#each data.enrollments as enrollment (enrollment.topic_area_id)}
				<a
					class:active={selectedTopicId === enrollment.topic_area_id}
					href={`/app/leaderboard?topic=${enrollment.topic_area_id}`}
				>
					{enrollment.topic_name}
				</a>
			{/each}
		</div>

		{#if data.profile.leaderboard_opt_in}
			{#if data.entries.length}
				<ol>
					{#each data.entries as entry (entry.entry_key)}
						<li class:viewer={entry.is_viewer}>
							<span>{entry.rank}</span>
							<div class="avatar" aria-hidden="true">
								{#if entry.avatar_url}
									<img src={entry.avatar_url} alt="" />
								{:else}
									<UserRound size={20} />
								{/if}
							</div>
							<div>
								<strong>{entry.display_name}</strong>
								{#if entry.title}
									<em>{entry.title}</em>
								{/if}
							</div>
							<span>{entry.xp_points} XP</span>
						</li>
					{/each}
				</ol>
			{:else}
				<p class="empty">No leaderboard activity yet this week.</p>
			{/if}
		{:else}
			<p class="empty">Leaderboard entries are hidden until you opt in.</p>
		{/if}
	</section>
</main>

<style>
	.leaderboard-page {
		display: grid;
		gap: 20px;
	}

	.hero,
	.profile-panel,
	.leaderboard-panel {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		display: grid;
		gap: 16px;
		padding: clamp(20px, 4vw, 32px);
	}

	.hero h1,
	.hero p,
	.profile-panel h2,
	.profile-panel p,
	.empty {
		margin: 0;
	}

	.hero h1 {
		font-size: clamp(2rem, 4vw, 3.2rem);
		letter-spacing: 0;
		line-height: 1;
	}

	.hero > p:not(.eyebrow),
	.profile-panel p,
	.empty,
	em {
		color: var(--color-text-muted);
	}

	.profile-panel > div {
		align-items: start;
		display: grid;
		gap: 10px;
		grid-template-columns: auto 1fr;
	}

	form {
		display: grid;
		gap: 12px;
		max-inline-size: 620px;
	}

	label {
		display: grid;
		gap: 6px;
	}

	label span,
	.tabs a,
	li > span {
		font-size: 0.85rem;
		font-weight: 780;
	}

	input,
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
		min-block-size: 88px;
		resize: vertical;
	}

	.checkbox {
		align-items: center;
		display: flex;
		gap: 10px;
	}

	.checkbox input {
		inline-size: 18px;
		block-size: 18px;
	}

	.tabs {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.tabs a {
		background: var(--color-surface-raised);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		padding: 8px 10px;
	}

	.tabs a.active {
		background: var(--color-text);
		color: var(--color-surface);
	}

	ol {
		display: grid;
		gap: 8px;
		list-style: none;
		margin: 0;
		padding: 0;
	}

	li {
		align-items: center;
		background: var(--color-surface-raised);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		display: grid;
		gap: 12px;
		grid-template-columns: 32px 40px 1fr auto;
		padding: 12px;
	}

	li.viewer {
		border-color: var(--color-text);
	}

	.avatar {
		align-items: center;
		aspect-ratio: 1;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 50%;
		display: grid;
		justify-items: center;
		overflow: hidden;
	}

	img {
		block-size: 100%;
		inline-size: 100%;
		object-fit: cover;
	}

	li div:nth-child(3) {
		display: grid;
		gap: 2px;
		min-inline-size: 0;
	}

	em {
		font-style: normal;
	}

	@media (max-width: 640px) {
		li {
			grid-template-columns: 28px 36px 1fr;
		}

		li > span:last-child {
			grid-column: 3;
		}
	}
</style>
