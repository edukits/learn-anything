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
		normalizeAvatarOptions,
		type PublicAvatarOptions
	} from '$lib/features/social';

	let { data, form }: PageProps = $props();

	let avatarOptions = $derived(
		normalizeAvatarOptions(form?.values?.avatarOptions ?? data.profile.avatar_options)
	);

	let profileForm = $derived({
		displayName: form?.values?.displayName ?? data.profile.display_name,
		titleRewardKey: form?.values?.titleRewardKey ?? data.profile.equipped_title_reward_key ?? '',
		bio: form?.values?.bio ?? data.profile.bio ?? '',
		leaderboardOptIn: form?.values?.leaderboardOptIn ?? data.profile.leaderboard_opt_in
	});

	let avatarUrl = $derived(buildNotionistsAvatarUrl(avatarOptions, 192));

	function randomizeAvatar() {
		const random =
			typeof crypto !== 'undefined' && 'randomUUID' in crypto
				? crypto.randomUUID().slice(0, 8)
				: Math.random().toString(36).slice(2, 10);
		updateAvatarOption('seed', `${profileForm.displayName || 'Learner'} ${random}`);
	}

	function updateAvatarOption<Key extends keyof PublicAvatarOptions>(
		key: Key,
		value: PublicAvatarOptions[Key]
	) {
		avatarOptions = { ...avatarOptions, [key]: value };
	}

	function controlValue(event: Event) {
		return (event.currentTarget as HTMLInputElement | HTMLSelectElement).value;
	}

	function optionLabel(value: string) {
		if (value === 'none') return 'None';
		return value
			.replace(/([a-z])([A-Z])/g, '$1 $2')
			.replace(/^variant0?/, 'Variant ')
			.replace(/^./, (match) => match.toUpperCase());
	}
</script>

<main class="page profile-page">
	<section class="hero">
		<div class="hero-visual">
			<div class="avatar-preview">
				<img src={avatarUrl} alt="" />
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

				<div class="avatar-field">
					<span class="field-label">Avatar</span>
					<div class="avatar-builder">
						<div class="avatar-stage">
							<img src={avatarUrl} alt="" />
						</div>

						<div class="avatar-controls">
							<label>
								<span class="field-label">Seed</span>
								<div class="seed-row">
									<input
										name="avatarSeed"
										value={avatarOptions.seed}
										maxlength="120"
										required
										oninput={(event) => updateAvatarOption('seed', controlValue(event))}
									/>
									<button type="button" class="icon-button" onclick={randomizeAvatar} title="Randomize avatar">
										<Shuffle size={18} />
									</button>
								</div>
							</label>

							<div class="swatch-group" aria-label="Avatar background color">
								<span class="field-label">Background</span>
								<div class="swatches">
									{#each avatarBackgroundColors as color (color)}
										<label class="swatch" style:--swatch-color={`#${color}`} title={`#${color}`}>
											<input
												type="radio"
												name="avatarBackgroundColor"
												value={color}
												checked={avatarOptions.backgroundColor === color}
												onchange={() => updateAvatarOption('backgroundColor', color)}
											/>
											<span></span>
										</label>
									{/each}
								</div>
							</div>

							<div class="avatar-select-grid">
								<label>
									<span class="field-label">Hair</span>
									<select
										name="avatarHair"
										value={avatarOptions.hair}
										onchange={(event) =>
											updateAvatarOption(
												'hair',
												controlValue(event) as PublicAvatarOptions['hair']
											)}
									>
										{#each avatarHairOptions as option (option)}
											<option value={option}>{optionLabel(option)}</option>
										{/each}
									</select>
								</label>

								<label>
									<span class="field-label">Eyes</span>
									<select
										name="avatarEyes"
										value={avatarOptions.eyes}
										onchange={(event) =>
											updateAvatarOption(
												'eyes',
												controlValue(event) as PublicAvatarOptions['eyes']
											)}
									>
										{#each avatarEyeOptions as option (option)}
											<option value={option}>{optionLabel(option)}</option>
										{/each}
									</select>
								</label>

								<label>
									<span class="field-label">Brows</span>
									<select
										name="avatarBrows"
										value={avatarOptions.brows}
										onchange={(event) =>
											updateAvatarOption(
												'brows',
												controlValue(event) as PublicAvatarOptions['brows']
											)}
									>
										{#each avatarBrowOptions as option (option)}
											<option value={option}>{optionLabel(option)}</option>
										{/each}
									</select>
								</label>

								<label>
									<span class="field-label">Lips</span>
									<select
										name="avatarLips"
										value={avatarOptions.lips}
										onchange={(event) =>
											updateAvatarOption(
												'lips',
												controlValue(event) as PublicAvatarOptions['lips']
											)}
									>
										{#each avatarLipOptions as option (option)}
											<option value={option}>{optionLabel(option)}</option>
										{/each}
									</select>
								</label>

								<label>
									<span class="field-label">Beard</span>
									<select
										name="avatarBeard"
										value={avatarOptions.beard}
										onchange={(event) =>
											updateAvatarOption(
												'beard',
												controlValue(event) as PublicAvatarOptions['beard']
											)}
									>
										{#each avatarBeardOptions as option (option)}
											<option value={option}>{optionLabel(option)}</option>
										{/each}
									</select>
								</label>

								<label>
									<span class="field-label">Glasses</span>
									<select
										name="avatarGlasses"
										value={avatarOptions.glasses}
										onchange={(event) =>
											updateAvatarOption(
												'glasses',
												controlValue(event) as PublicAvatarOptions['glasses']
											)}
									>
										{#each avatarGlassesOptions as option (option)}
											<option value={option}>{optionLabel(option)}</option>
										{/each}
									</select>
								</label>

								<label>
									<span class="field-label">Body icon</span>
									<select
										name="avatarBodyIcon"
										value={avatarOptions.bodyIcon}
										onchange={(event) =>
											updateAvatarOption(
												'bodyIcon',
												controlValue(event) as PublicAvatarOptions['bodyIcon']
											)}
									>
										{#each avatarBodyIconOptions as option (option)}
											<option value={option}>{optionLabel(option)}</option>
										{/each}
									</select>
								</label>

								<label>
									<span class="field-label">Gesture</span>
									<select
										name="avatarGesture"
										value={avatarOptions.gesture}
										onchange={(event) =>
											updateAvatarOption(
												'gesture',
												controlValue(event) as PublicAvatarOptions['gesture']
											)}
									>
										{#each avatarGestureOptions as option (option)}
											<option value={option}>{optionLabel(option)}</option>
										{/each}
									</select>
								</label>
							</div>
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
		gap: 20px;
		grid-template-columns: 148px 1fr;
		padding: 16px;
	}

	.avatar-stage {
		align-items: center;
		aspect-ratio: 1;
		background: var(--color-surface-raised);
		border: 1px solid var(--color-border);
		border-radius: 50%;
		display: grid;
		inline-size: 100%;
		justify-items: center;
		overflow: hidden;
	}

	.avatar-stage img {
		block-size: 100%;
		inline-size: 100%;
		object-fit: cover;
	}

	.avatar-controls {
		display: grid;
		gap: 14px;
		min-inline-size: 0;
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

	.swatch-group {
		display: grid;
		gap: 8px;
	}

	.swatches {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.swatch {
		display: block;
		position: relative;
	}

	.swatch input {
		block-size: 1px;
		inline-size: 1px;
		opacity: 0;
		position: absolute;
	}

	.swatch span {
		background: var(--swatch-color);
		border: 1px solid color-mix(in srgb, var(--swatch-color), #000 22%);
		border-radius: 999px;
		box-shadow: inset 0 1px 1px rgb(255 255 255 / 0.5);
		cursor: pointer;
		display: block;
		block-size: 28px;
		inline-size: 28px;
	}

	.swatch input:checked + span {
		outline: 3px solid color-mix(in srgb, var(--color-accent), transparent 55%);
		outline-offset: 2px;
	}

	.avatar-select-grid {
		display: grid;
		gap: 12px;
		grid-template-columns: repeat(2, minmax(0, 1fr));
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

		.avatar-select-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
