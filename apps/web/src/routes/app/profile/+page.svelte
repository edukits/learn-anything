<script lang="ts">
	import type { PageProps } from './$types';
	import { Button } from '@learn-anything/ui';
	import { ShieldCheck, UserRound } from '@lucide/svelte';

	let { data, form }: PageProps = $props();

	let profileForm = $derived({
		displayName: form?.values?.displayName ?? data.profile.display_name,
		avatarUrl: form?.values?.avatarUrl ?? data.profile.avatar_url ?? '',
		titleRewardKey: form?.values?.titleRewardKey ?? data.profile.equipped_title_reward_key ?? '',
		bio: form?.values?.bio ?? data.profile.bio ?? '',
		leaderboardOptIn: form?.values?.leaderboardOptIn ?? data.profile.leaderboard_opt_in
	});
</script>

<main class="page profile-page">
	<section class="hero">
		<div class="hero-visual">
			<div class="avatar-preview">
				{#if profileForm.avatarUrl}
					<img src={profileForm.avatarUrl} alt="" />
				{:else}
					<UserRound size={48} />
				{/if}
			</div>
		</div>
		<div class="hero-text">
			<p class="eyebrow">Public profile</p>
			<h1>{profileForm.displayName || 'Your profile'}</h1>
			<p class="hero-subtitle">
				Only your display name, avatar, title, and bio appear on leaderboards.
			</p>
		</div>
	</section>

	<section class="form-section">
		<div class="form-header">
			<ShieldCheck size={20} />
			<div>
				<h2>Profile details</h2>
				<p>Control what other learners see on the leaderboard.</p>
			</div>
		</div>

		<form method="POST">
			<div class="field-group">
				<label>
					<span class="field-label">Display name</span>
					<input name="displayName" value={profileForm.displayName} maxlength="80" required />
				</label>

				<label>
					<span class="field-label">Avatar URL</span>
					<input
						name="avatarUrl"
						value={profileForm.avatarUrl}
						maxlength="500"
						placeholder="https://example.com/photo.jpg"
					/>
				</label>

				<label>
					<span class="field-label">Title</span>
					<select name="titleRewardKey" value={profileForm.titleRewardKey}>
						<option value="">No title</option>
						{#each data.titleRewards as reward (reward.reward_key)}
							<option value={reward.reward_key}>{reward.reward_label}</option>
						{/each}
					</select>
				</label>

				<label>
					<span class="field-label">Bio</span>
					<textarea name="bio" maxlength="240" placeholder="A few words about yourself"
						>{profileForm.bio}</textarea
					>
				</label>
			</div>

			<div class="opt-in-row">
				<label class="checkbox">
					<input
						name="leaderboardOptIn"
						type="checkbox"
						checked={profileForm.leaderboardOptIn}
					/>
					<span>Join public weekly leaderboards</span>
				</label>
			</div>

			<div class="form-actions">
				<Button type="submit" label="Save profile" />
			</div>

			{#if form?.error}
				<p class="message error">{form.error}</p>
			{:else if form?.saved}
				<p class="message success">Profile saved.</p>
			{/if}
		</form>
	</section>
</main>

<style>
	.profile-page {
		display: grid;
		gap: 32px;
		max-inline-size: 680px;
	}

	/* ---- Hero ---- */

	.hero {
		align-items: center;
		display: flex;
		gap: 24px;
		padding: clamp(20px, 4vw, 36px) 0;
		border-bottom: 1px dashed var(--color-border);
	}

	.avatar-preview {
		align-items: center;
		aspect-ratio: 1;
		background: var(--color-surface-raised);
		border: 2px solid var(--color-border);
		border-radius: 50%;
		color: var(--color-text-muted);
		display: grid;
		block-size: 80px;
		inline-size: 80px;
		justify-items: center;
		overflow: hidden;
		flex-shrink: 0;
	}

	.avatar-preview img {
		block-size: 100%;
		inline-size: 100%;
		object-fit: cover;
	}

	.hero-text {
		display: grid;
		gap: 4px;
	}

	.hero h1 {
		font-size: clamp(1.6rem, 4vw, 2.2rem);
		letter-spacing: 0;
		line-height: 1;
		margin: 0;
	}

	.hero p {
		margin: 0;
	}

	.hero-subtitle {
		color: var(--color-text-muted);
		max-inline-size: 40ch;
	}

	/* ---- Form section ---- */

	.form-section {
		display: grid;
		gap: 24px;
	}

	.form-header {
		align-items: start;
		display: flex;
		gap: 12px;
		color: var(--color-text-muted);
	}

	.form-header div {
		display: grid;
		gap: 2px;
	}

	.form-header h2 {
		font-size: 1.1rem;
		letter-spacing: 0;
		margin: 0;
		color: var(--color-text);
	}

	.form-header p {
		color: var(--color-text-muted);
		font-size: 0.9rem;
		margin: 0;
	}

	form {
		display: grid;
		gap: 20px;
	}

	.field-group {
		display: grid;
		gap: 16px;
	}

	label {
		display: grid;
		gap: 6px;
	}

	.field-label {
		font-size: 0.85rem;
		font-weight: 700;
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
		transition: border-color 0.15s;
	}

	input:focus,
	select:focus,
	textarea:focus {
		border-color: var(--color-accent);
		outline: 3px solid color-mix(in srgb, var(--color-accent), transparent 75%);
		outline-offset: 0;
	}

	textarea {
		min-block-size: 88px;
		resize: vertical;
	}

	.opt-in-row {
		background: var(--color-surface-raised);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		padding: 14px 16px;
	}

	.checkbox {
		align-items: center;
		display: flex;
		gap: 10px;
	}

	.checkbox input {
		inline-size: 18px;
		block-size: 18px;
		flex-shrink: 0;
	}

	.checkbox span {
		font-weight: 600;
	}

	.form-actions {
		align-items: center;
		display: flex;
		gap: 12px;
	}

	@media (max-width: 540px) {
		.hero {
			flex-direction: column;
			align-items: start;
		}
	}
</style>
