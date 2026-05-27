<script lang="ts">
	import { Button } from '@learn-anything/ui';
	import { ArrowLeft, Sparkles, Mail } from '@lucide/svelte';
	import logoUrl from '../../../../../packages/ui/src/lib/assets/brand/logo-dark-md.png';

	let { form } = $props();

	let submitted = $derived(!!form?.sent);
</script>

<main class="sign-in-page">
	<aside class="brand-panel">
		<div class="brand-atmosphere" aria-hidden="true">
			<div class="atmosphere-wash"></div>
			<div class="atmosphere-stars"></div>
			<div class="atmosphere-horizon"></div>
		</div>
		<div class="brand-content">
			<div class="atmosphere-orb" aria-hidden="true"></div>
			<div class="brand-logo">
				<img src={logoUrl} alt="" aria-hidden="true" decoding="async" />
			</div>
			<h2 class="brand-title">Clarifyst</h2>
			<p class="brand-tagline">
				Master any topic with structured paths, spaced repetition, and AI-guided practice.
			</p>
			<div class="brand-features">
				<div class="feature-pill">
					<Sparkles size={14} />
					<span>Adaptive quizzes</span>
				</div>
				<div class="feature-pill">
					<Sparkles size={14} />
					<span>Spaced review</span>
				</div>
				<div class="feature-pill">
					<Sparkles size={14} />
					<span>Skill tracking</span>
				</div>
			</div>
		</div>
	</aside>

	<section class="form-panel">
		<div class="form-container">
			<header class="form-header">
				<a href="/" class="back-link">
					<ArrowLeft size={14} strokeWidth={2.25} />
					Home
				</a>
				<h1>Sign in</h1>
				<p class="subtitle">Enter your email and we'll send a magic link — no password needed.</p>
			</header>

			{#if form?.error}
				<div class="alert alert-error" role="alert">
					<span class="alert-dot"></span>
					{form.error}
				</div>
			{/if}

			{#if submitted}
				<div class="success-state">
					<div class="success-icon">
						<Mail size={24} strokeWidth={2} />
					</div>
					<h2 class="success-title">Check your inbox</h2>
					<p class="success-text">
						We sent a sign-in link to <strong>{form?.email}</strong>. Click it to continue.
					</p>
				</div>
			{:else}
				<form method="POST" class="auth-form">
					<div class="field">
						<label for="email-input">Email address</label>
						<div class="input-wrapper">
							<Mail size={18} strokeWidth={2} aria-hidden="true" class="input-icon" />
							<input
								id="email-input"
								name="email"
								type="email"
								autocomplete="email"
								required
								placeholder="you@example.com"
								value={form?.email ?? ''}
							/>
						</div>
					</div>
					<Button type="submit" size="lg">Send magic link</Button>
				</form>
			{/if}

			<footer class="form-footer">
				<p>By signing in you agree to our terms of service.</p>
			</footer>
		</div>
	</section>
</main>

<style>
	.sign-in-page {
		display: grid;
		grid-template-columns: 1fr 1fr;
		min-block-size: 100svh;
	}

	/* ── Brand Panel ── */

	.brand-panel {
		align-items: center;
		background:
			radial-gradient(ellipse 78% 62% at 96% 70%, rgb(0 198 226 / 0.38), transparent 58%),
			radial-gradient(ellipse 64% 52% at 0% 98%, rgb(133 45 255 / 0.48), transparent 58%),
			radial-gradient(ellipse 70% 42% at 50% 48%, rgb(36 104 255 / 0.16), transparent 66%),
			linear-gradient(153deg, #030823 0%, #061037 42%, #082653 73%, #073044 100%);
		display: flex;
		justify-content: center;
		overflow: hidden;
		padding: var(--space-10);
		position: relative;
	}

	.brand-panel::before {
		animation: atmosphere-drift 24s ease-in-out infinite alternate;
		background:
			radial-gradient(ellipse 54% 42% at 102% 64%, rgb(0 226 245 / 0.26), transparent 72%),
			linear-gradient(118deg, rgb(38 75 255 / 0.14), transparent 34%),
			linear-gradient(247deg, transparent 42%, rgb(0 220 245 / 0.16) 72%, transparent 91%);
		content: '';
		filter: blur(40px);
		inset: -18%;
		mix-blend-mode: screen;
		opacity: 0.72;
		position: absolute;
		transform: translate3d(-1%, 0, 0) scale(1.04);
	}

	.brand-panel::after {
		background-image:
			linear-gradient(rgb(255 255 255 / 0.008) 1px, transparent 1px),
			linear-gradient(90deg, rgb(255 255 255 / 0.007) 1px, transparent 1px);
		background-size: 56px 56px;
		content: '';
		inset: 0;
		mask-image: linear-gradient(to bottom, transparent 0%, black 28%, black 74%, transparent 100%);
		opacity: 0.22;
		position: absolute;
	}

	.brand-atmosphere {
		inset: 0;
		pointer-events: none;
		position: absolute;
	}

	.atmosphere-wash {
		animation: color-shift 18s ease-in-out infinite alternate;
		background:
			radial-gradient(ellipse 62% 48% at 92% 70%, rgb(0 228 245 / 0.32), transparent 70%),
			radial-gradient(ellipse 54% 46% at 0% 94%, rgb(154 49 255 / 0.42), transparent 68%),
			radial-gradient(ellipse 44% 32% at 55% 88%, rgb(74 115 255 / 0.16), transparent 76%);
		filter: blur(24px) saturate(1.28);
		inset: -12%;
		mix-blend-mode: screen;
		position: absolute;
		transform: translate3d(0, 0, 0);
	}

	.atmosphere-orb {
		animation: orb-drift 8s ease-in-out infinite alternate;
		aspect-ratio: 1;
		filter: blur(18px) saturate(1.44);
		inline-size: clamp(370px, 182%, 680px);
		inset-block-start: 50%;
		inset-inline-start: 50%;
		mask-image: radial-gradient(circle, black 0 42%, rgb(0 0 0 / 0.64) 52%, transparent 72%);
		mix-blend-mode: screen;
		opacity: 0.86;
		position: absolute;
		transform: translate(-50%, -50%) rotate(-9deg);
		z-index: -1;
	}

	.atmosphere-orb::before {
		background: conic-gradient(
			from -10deg,
			transparent 0deg 26deg,
			rgb(84 184 255 / 0.78) 44deg,
			rgb(0 240 255 / 0.7) 60deg,
			transparent 88deg 212deg,
			rgb(154 63 255 / 0.76) 235deg,
			rgb(77 124 255 / 0.58) 258deg,
			transparent 286deg 360deg
		);
		border-radius: 50%;
		content: '';
		filter: blur(12px);
		inset: 7%;
		mask-image: radial-gradient(circle, transparent 0 58%, black 66%, transparent 78%);
		position: absolute;
	}

	.atmosphere-stars {
		animation: star-glimmer 7s ease-in-out infinite alternate;
		background-image:
			radial-gradient(circle at 21% 18%, rgb(95 185 255 / 0.72) 0 1px, transparent 1.5px),
			radial-gradient(circle at 31% 25%, rgb(123 80 255 / 0.58) 0 1px, transparent 1.5px),
			radial-gradient(circle at 57% 28%, rgb(191 113 255 / 0.68) 0 1px, transparent 1.5px),
			radial-gradient(circle at 23% 46%, rgb(56 211 255 / 0.52) 0 1px, transparent 1.5px),
			radial-gradient(circle at 72% 34%, rgb(255 255 255 / 0.42) 0 1px, transparent 1.5px),
			radial-gradient(circle at 39% 36%, rgb(55 128 255 / 0.5) 0 0.8px, transparent 1.3px),
			radial-gradient(circle at 47% 19%, rgb(0 219 255 / 0.36) 0 0.8px, transparent 1.3px);
		filter: drop-shadow(0 0 7px rgb(73 143 255 / 0.72));
		inset: 0;
		opacity: 0.66;
		position: absolute;
	}

	.atmosphere-horizon {
		animation: horizon-breathe 16s ease-in-out infinite alternate;
		background:
			radial-gradient(ellipse 48% 72% at 6% 78%, rgb(150 45 255 / 0.38), transparent 70%),
			radial-gradient(ellipse 72% 52% at 78% 55%, rgb(0 204 224 / 0.22), transparent 74%),
			linear-gradient(110deg, rgb(94 60 255 / 0.16), rgb(14 181 255 / 0.14));
		block-size: 40%;
		border-block-start: 1px solid rgb(90 190 255 / 0.78);
		border-radius: 50% 50% 0 0 / 100% 100% 0 0;
		box-shadow:
			0 -1px 10px rgb(117 203 255 / 0.9),
			0 -7px 24px rgb(121 74 255 / 0.42),
			0 -22px 58px rgb(0 184 255 / 0.2);
		filter: saturate(1.2);
		inline-size: 200%;
		inset-block-end: -22%;
		inset-inline-start: 0;
		opacity: 0.86;
		position: absolute;
		transform: rotate(-6deg);
		transform-origin: 50% 0;
	}

	.brand-content {
		display: grid;
		gap: var(--space-6);
		isolation: isolate;
		max-inline-size: 380px;
		position: relative;
		z-index: 2;
	}

	.brand-logo {
		align-items: center;
		display: inline-flex;
		height: 4.5rem;
		justify-content: center;
		width: 4.5rem;
	}

	.brand-logo img {
		display: block;
		height: 100%;
		object-fit: contain;
		width: 100%;
	}

	.brand-title {
		color: #ffffff;
		font-family: var(--font-display);
		font-size: clamp(1.75rem, 3vw, 2.5rem);
		font-weight: 600;
		letter-spacing: -0.02em;
		line-height: 1.1;
		margin: 0;
	}

	.brand-tagline {
		color: hsl(var(--color-accent-h) 30% 72%);
		font-size: 1.0625rem;
		line-height: 1.55;
		margin: 0;
	}

	.brand-features {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		margin-block-start: var(--space-2);
	}

	.feature-pill {
		align-items: center;
		background: hsl(var(--color-accent-h) 40% 22% / 0.6);
		border: 1px solid hsl(var(--color-accent-h) 30% 36% / 0.4);
		border-radius: 100px;
		color: hsl(var(--color-accent-h) 50% 82%);
		display: inline-flex;
		font-size: 0.8125rem;
		font-weight: 500;
		gap: 6px;
		padding: 6px 12px;
	}

	/* ── Form Panel ── */

	.form-panel {
		align-items: center;
		background: var(--color-canvas);
		display: flex;
		justify-content: center;
		padding: var(--space-10);
	}

	.back-link {
		align-items: center;
		color: var(--color-text-muted);
		display: inline-flex;
		font-size: 0.8125rem;
		font-weight: 500;
		gap: var(--space-1);
		text-decoration: none;
		transition: color 120ms ease;
	}

	.back-link:hover {
		color: var(--color-text);
	}

	.form-container {
		display: grid;
		gap: var(--space-8);
		inline-size: min(100%, 400px);
	}

	.form-header {
		display: grid;
		gap: var(--space-2);
	}

	.form-header .back-link {
		margin-block-end: var(--space-4);
	}

	.form-header h1 {
		font-size: clamp(1.5rem, 2.5vw, 2rem);
		letter-spacing: -0.02em;
		line-height: 1.1;
		margin: 0;
	}

	.subtitle {
		color: var(--color-text-muted);
		font-size: 0.9375rem;
		margin: 0;
	}

	/* ── Form ── */

	.auth-form {
		display: grid;
		gap: var(--space-5);
	}

	.field {
		display: grid;
		gap: var(--space-2);
	}

	.field label {
		color: var(--color-text);
		font-size: 0.875rem;
		font-weight: 550;
	}

	.input-wrapper {
		align-items: center;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		display: flex;
		gap: var(--space-2);
		padding-inline: var(--space-3);
		transition:
			border-color 120ms ease,
			box-shadow 120ms ease;
	}

	.input-wrapper:focus-within {
		border-color: var(--color-accent);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent), transparent 80%);
	}

	.input-wrapper :global(.input-icon) {
		color: var(--color-text-muted);
		flex-shrink: 0;
	}

	.input-wrapper input {
		background: transparent;
		border: none;
		color: var(--color-text);
		flex: 1;
		font-family: inherit;
		font-size: 0.9375rem;
		min-block-size: 48px;
		outline: none;
	}

	.input-wrapper input::placeholder {
		color: color-mix(in srgb, var(--color-text-muted), transparent 30%);
	}

	/* ── Alerts ── */

	.alert {
		align-items: center;
		border-radius: var(--radius-md);
		display: flex;
		font-size: 0.875rem;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-4);
	}

	.alert-error {
		background: hsl(var(--color-danger-h) 70% 96%);
		border: 1px solid hsl(var(--color-danger-h) 60% 88%);
		color: hsl(var(--color-danger-h) 70% 38%);
	}

	.alert-dot {
		background: hsl(var(--color-danger-h) var(--color-danger-s) var(--color-danger-l));
		block-size: 6px;
		border-radius: 50%;
		flex-shrink: 0;
		inline-size: 6px;
	}

	/* ── Success State ── */

	.success-state {
		display: grid;
		gap: var(--space-3);
		padding-block: var(--space-6);
	}

	.success-icon {
		align-items: center;
		background: linear-gradient(
			to bottom,
			hsl(var(--color-success-h) 50% 92%),
			hsl(var(--color-success-h) 50% 86%)
		);
		border: 1px solid hsl(var(--color-success-h) 40% 78%);
		border-radius: 50%;
		box-shadow:
			0 2px 1px inset hsl(var(--color-success-h) 50% 97%),
			0 1px 3px 0 hsl(var(--color-success-h) 40% 50% / 0.15);
		color: hsl(var(--color-success-h) var(--color-success-s) calc(var(--color-success-l) - 4%));
		display: flex;
		height: 48px;
		justify-content: center;
		width: 48px;
	}

	.success-title {
		font-size: 1.25rem;
		margin: 0;
	}

	.success-text {
		color: var(--color-text-muted);
		font-size: 0.9375rem;
		margin: 0;
	}

	/* ── Footer ── */

	.form-footer {
		border-block-start: 1px solid var(--color-border);
		padding-block-start: var(--space-5);
	}

	.form-footer p {
		color: var(--color-text-muted);
		font-size: 0.8125rem;
		margin: 0;
	}

	/* ── Responsive ── */

	@media (max-width: 840px) {
		.sign-in-page {
			grid-template-columns: 1fr;
		}

		.brand-panel {
			min-block-size: 280px;
			padding: var(--space-8);
		}

		.atmosphere-horizon {
			block-size: 44%;
			inset-block-end: -28%;
		}

		.brand-features {
			display: none;
		}

		.form-panel {
			padding: var(--space-8) var(--space-6);
		}
	}

	@media (max-width: 480px) {
		.brand-panel {
			min-block-size: 220px;
			padding: var(--space-6);
		}

		.brand-title {
			font-size: 1.5rem;
		}

		.form-panel {
			padding: var(--space-6) var(--space-4);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.brand-panel::before,
		.atmosphere-wash,
		.atmosphere-orb,
		.atmosphere-stars,
		.atmosphere-horizon {
			animation: none;
		}
	}

	@keyframes atmosphere-drift {
		from {
			opacity: 0.62;
			transform: translate3d(-3%, -1%, 0) scale(1.04);
		}

		to {
			opacity: 0.9;
			transform: translate3d(4%, 2%, 0) scale(1.12);
		}
	}

	@keyframes color-shift {
		from {
			opacity: 0.72;
			transform: translate3d(-2%, 1%, 0) scale(1);
		}

		to {
			opacity: 0.95;
			transform: translate3d(3%, -2%, 0) scale(1.08);
		}
	}

	@keyframes orb-drift {
		from {
			opacity: 0.6;
			transform: translate(-51.5%, -44.5%) rotate(-11deg) scale(0.98);
		}

		to {
			opacity: 0.8;
			transform: translate(-58.5%, -44.5%) rotate(-7deg) scale(1.04);
		}
	}

	@keyframes star-glimmer {
		from {
			opacity: 0.42;
		}

		to {
			opacity: 0.78;
		}
	}

	@keyframes horizon-breathe {
		from {
			opacity: 0.76;
			transform: rotate(-6.8deg) translate3d(-1%, 1%, 0);
		}

		to {
			opacity: 1;
			transform: rotate(-4.8deg) translate3d(2%, -1%, 0);
		}
	}
</style>
