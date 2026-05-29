<script lang="ts">
	import type { PageProps } from './$types';
	import { Button } from '@learn-anything/ui';
	import { ShieldCheck, Shuffle } from '@lucide/svelte';
	import {
		avatarBackgroundColors,
		avatarBeardOptions,
		avatarBodyIconOptions,
		avatarBrowOptions,
		avatarEyeOptions,
		avatarGestureOptions,
		avatarGlassesOptions,
		avatarHairOptions,
		avatarLipOptions,
		buildNotionistsAvatarUrl,
		createAvatarOptionsFromSeed,
		normalizeAvatarOptions,
		type PublicAvatarOptions
	} from '$lib/features/social';

	let { data, form }: PageProps = $props();

	const avatarPanels = [
		{ key: 'seed', label: 'Seed' },
		{ key: 'backgroundColor', label: 'Background' },
		{ key: 'hair', label: 'Hair' },
		{ key: 'eyes', label: 'Eyes' },
		{ key: 'brows', label: 'Brows' },
		{ key: 'lips', label: 'Lips' },
		{ key: 'beard', label: 'Beard' },
		{ key: 'glasses', label: 'Glasses' },
		{ key: 'bodyIcon', label: 'Body icon' },
		{ key: 'gesture', label: 'Gesture' }
	] as const;

	const avatarOptionGroups = {
		backgroundColor: avatarBackgroundColors,
		hair: avatarHairOptions,
		eyes: avatarEyeOptions,
		brows: avatarBrowOptions,
		lips: avatarLipOptions,
		beard: avatarBeardOptions,
		glasses: avatarGlassesOptions,
		bodyIcon: avatarBodyIconOptions,
		gesture: avatarGestureOptions
	} as const;

	type AvatarPanelKey = (typeof avatarPanels)[number]['key'];
	type AvatarChoiceKey = Exclude<AvatarPanelKey, 'seed'>;

	let avatarOptions = $derived(
		normalizeAvatarOptions(form?.values?.avatarOptions ?? data.profile.avatar_options)
	);
	let activeAvatarPanel = $state<AvatarPanelKey>('hair');

	let profileForm = $derived({
		displayName: form?.values?.displayName ?? data.profile.display_name,
		titleRewardKey: form?.values?.titleRewardKey ?? data.profile.equipped_title_reward_key ?? '',
		bio: form?.values?.bio ?? data.profile.bio ?? '',
		leaderboardOptIn: form?.values?.leaderboardOptIn ?? data.profile.leaderboard_opt_in
	});

	let avatarUrl = $derived(buildNotionistsAvatarUrl(avatarOptions, 192));
	let activeAvatarPanelLabel = $derived(
		avatarPanels.find((panel) => panel.key === activeAvatarPanel)?.label ?? 'Avatar'
	);
	let activeAvatarChoicePanel = $derived<AvatarChoiceKey>(
		activeAvatarPanel === 'seed' ? 'hair' : activeAvatarPanel
	);
	let activeAvatarOptions = $derived(avatarOptionGroups[activeAvatarChoicePanel]);

	function randomizeAvatar() {
		const random =
			typeof crypto !== 'undefined' && 'randomUUID' in crypto
				? crypto.randomUUID().slice(0, 8)
				: Math.random().toString(36).slice(2, 10);
		updateAvatarSeed(`${profileForm.displayName || 'Learner'} ${random}`);
	}

	function updateAvatarSeed(seed: string) {
		avatarOptions = createAvatarOptionsFromSeed(seed);
	}

	function updateAvatarChoice(key: AvatarChoiceKey, value: string) {
		avatarOptions = { ...avatarOptions, [key]: value } as PublicAvatarOptions;
	}

	function previewAvatarUrl(key: AvatarChoiceKey, value: string) {
		return buildNotionistsAvatarUrl({ ...avatarOptions, [key]: value } as PublicAvatarOptions, 112);
	}

	function isActiveChoice(key: AvatarChoiceKey, value: string) {
		return avatarOptions[key] === value;
	}
</script>

<main class="page profile-page">
	<section class="hero">
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

				<div class="avatar-field">
					<span class="field-label">Avatar</span>
					<div class="avatar-builder">
						<div class="avatar-sidebar">
							<div class="avatar-nav" aria-label="Avatar settings">
								{#each avatarPanels as panel (panel.key)}
									<button
										type="button"
										class:is-active={activeAvatarPanel === panel.key}
										onclick={() => (activeAvatarPanel = panel.key)}
									>
										{panel.label}
									</button>
								{/each}
							</div>
						</div>

						<div class="avatar-config">
							<div class="avatar-stage">
								<img src={avatarUrl} alt="" />
							</div>

							<input type="hidden" name="avatarSeed" value={avatarOptions.seed} />
							<input type="hidden" name="avatarBackgroundColor" value={avatarOptions.backgroundColor} />
							<input type="hidden" name="avatarHair" value={avatarOptions.hair} />
							<input type="hidden" name="avatarEyes" value={avatarOptions.eyes} />
							<input type="hidden" name="avatarBrows" value={avatarOptions.brows} />
							<input type="hidden" name="avatarLips" value={avatarOptions.lips} />
							<input type="hidden" name="avatarBeard" value={avatarOptions.beard} />
							<input type="hidden" name="avatarGlasses" value={avatarOptions.glasses} />
							<input type="hidden" name="avatarBodyIcon" value={avatarOptions.bodyIcon} />
							<input type="hidden" name="avatarGesture" value={avatarOptions.gesture} />

							{#if activeAvatarPanel === 'seed'}
								<div class="seed-panel">
									<label>
										<span class="field-label">Seed</span>
										<div class="seed-row">
											<input
												value={avatarOptions.seed}
												maxlength="120"
												required
												oninput={(event) =>
													updateAvatarSeed((event.currentTarget as HTMLInputElement).value)}
											/>
											<button
												type="button"
												class="icon-button"
												onclick={randomizeAvatar}
												title="Randomize avatar"
											>
												<Shuffle size={18} />
											</button>
										</div>
									</label>
								</div>
							{:else}
								<div class="option-panel">
									<div class="option-panel-heading">
										<h3>{activeAvatarPanelLabel}</h3>
									</div>
									<div class="visual-options" data-panel={activeAvatarChoicePanel}>
										{#each activeAvatarOptions as option (option)}
											<button
												type="button"
												class="visual-option"
												class:is-selected={isActiveChoice(activeAvatarChoicePanel, option)}
												style:--option-color={activeAvatarChoicePanel === 'backgroundColor'
													? `#${option}`
													: undefined}
												onclick={() => updateAvatarChoice(activeAvatarChoicePanel, option)}
												aria-label={`Choose ${activeAvatarPanelLabel} option`}
												aria-pressed={isActiveChoice(activeAvatarChoicePanel, option)}
											>
												<span class="option-avatar">
													<img src={previewAvatarUrl(activeAvatarChoicePanel, option)} alt="" />
												</span>
												{#if isActiveChoice(activeAvatarChoicePanel, option)}
													<span class="selected-indicator">Selected</span>
												{/if}
											</button>
										{/each}
									</div>
								</div>
							{/if}
						</div>
					</div>
				</div>

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
		max-inline-size: 920px;
	}

	/* ---- Hero ---- */

	.hero {
		align-items: center;
		display: flex;
		gap: 24px;
		padding: clamp(20px, 4vw, 36px) 0;
		border-bottom: 1px dashed var(--color-border);
	}

	.avatar-field {
		display: grid;
		gap: 8px;
	}

	.avatar-builder {
		align-items: start;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		display: grid;
		gap: 18px;
		grid-template-columns: 180px minmax(0, 1fr);
		padding: 18px;
	}

	.avatar-sidebar {
		display: grid;
		gap: 16px;
	}

	.avatar-stage {
		align-items: center;
		aspect-ratio: 1;
		background: var(--color-surface-raised);
		border: 1px solid var(--color-border);
		border-radius: 50%;
		display: grid;
		inline-size: min(100%, 176px);
		justify-items: center;
		overflow: hidden;
		justify-self: center;
	}

	.avatar-stage img {
		block-size: 100%;
		inline-size: 100%;
		object-fit: cover;
	}

	.avatar-nav {
		display: grid;
		gap: 6px;
	}

	.avatar-nav button {
		background: transparent;
		border: 1px solid transparent;
		border-radius: var(--radius-sm);
		color: var(--color-text-muted);
		cursor: pointer;
		font: inherit;
		font-weight: 700;
		padding: 9px 12px;
		text-align: start;
	}

	.avatar-nav button:hover,
	.avatar-nav button.is-active {
		background: var(--color-surface-raised);
		border-color: var(--color-border);
		color: var(--color-text);
	}

	.avatar-nav button.is-active {
		border-color: color-mix(in srgb, var(--color-accent), transparent 45%);
		box-shadow: inset 3px 0 0 var(--color-accent);
	}

	.avatar-config {
		background: var(--color-surface-raised);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		display: grid;
		gap: 16px;
		min-inline-size: 0;
		padding: 16px;
		justify-items: stretch;
	}

	.seed-panel {
		display: grid;
		max-inline-size: 420px;
	}

	.seed-row {
		align-items: stretch;
		display: grid;
		gap: 8px;
		grid-template-columns: 1fr 44px;
	}

	.icon-button {
		align-items: center;
		background: var(--color-surface-raised);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		color: var(--color-text);
		cursor: pointer;
		display: inline-flex;
		justify-content: center;
		padding: 0;
	}

	.icon-button:hover {
		border-color: var(--color-accent);
		color: var(--color-accent);
	}

	.option-panel {
		display: grid;
		gap: 14px;
	}

	.option-panel-heading h3 {
		font-size: 1rem;
		letter-spacing: 0;
		margin: 0;
	}

	.visual-options {
		display: grid;
		gap: 10px;
		grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
	}

	.visual-option {
		align-items: center;
		aspect-ratio: 1;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		color: var(--color-text);
		cursor: pointer;
		display: grid;
		justify-items: center;
		padding: 10px;
		position: relative;
	}

	.visual-option:hover,
	.visual-option.is-selected {
		border-color: var(--color-accent);
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-accent), transparent 75%);
	}

	.visual-options[data-panel='backgroundColor'] .visual-option {
		background: var(--option-color, var(--color-surface));
	}

	.option-avatar {
		align-items: center;
		aspect-ratio: 1;
		background: var(--color-surface-raised);
		border: 1px solid var(--color-border);
		border-radius: 50%;
		display: grid;
		inline-size: min(100%, 82px);
		justify-items: center;
		overflow: hidden;
	}

	.option-avatar img {
		block-size: 100%;
		inline-size: 100%;
		object-fit: cover;
	}

	.selected-indicator {
		background: var(--color-accent);
		border-radius: 999px;
		color: var(--color-accent-contrast);
		font-size: 0.68rem;
		font-weight: 800;
		inset-block-end: 8px;
		line-height: 1;
		padding: 4px 7px;
		position: absolute;
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

	label,
	.avatar-field {
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

		.avatar-builder {
			grid-template-columns: 1fr;
		}

		.avatar-stage {
			inline-size: 144px;
		}

		.avatar-nav {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.visual-options {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>
