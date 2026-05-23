<script lang="ts">
	import { Button } from '@learn-anything/ui';
	import { ArrowLeft, BookOpenCheck, Sparkles, Mail } from '@lucide/svelte';

	let { form } = $props();

	let submitted = $derived(!!form?.sent);
</script>

<main class="sign-in-page">
	<aside class="brand-panel">
		<div class="brand-content">
			<div class="brand-logo">
				<BookOpenCheck size={28} strokeWidth={2.25} />
			</div>
			<h2 class="brand-title">Learn Anything</h2>
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
		<div class="brand-glow" aria-hidden="true"></div>
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
			radial-gradient(
				ellipse 80% 60% at 50% 100%,
				hsl(var(--color-accent-h) 60% 20% / 0.5),
				transparent
			),
			linear-gradient(
				160deg,
				hsl(var(--color-accent-h) 70% 14%),
				hsl(var(--color-accent-h) 55% 8%)
			);
		display: flex;
		justify-content: center;
		overflow: hidden;
		padding: var(--space-10);
		position: relative;
	}

	.brand-content {
		display: grid;
		gap: var(--space-6);
		max-inline-size: 380px;
		position: relative;
		z-index: 1;
	}

	.brand-logo {
		align-items: center;
		background: linear-gradient(
			to bottom,
			hsl(var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) + 4%)),
			hsl(var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) - 14%))
		);
		border: 1px solid hsl(var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) - 24%));
		border-radius: var(--radius-lg);
		box-shadow:
			0 2px 1px inset hsl(var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) + 14%)),
			0 1px 3px 0 hsl(var(--color-accent-h) 60% 20% / 0.5),
			0 4px 16px hsl(var(--color-accent-h) 60% 30% / 0.4);
		color: var(--color-accent-contrast);
		display: inline-flex;
		height: 3rem;
		justify-content: center;
		width: 3rem;
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

	.brand-glow {
		background: radial-gradient(
			circle 300px at 30% 80%,
			hsl(var(--color-accent-h) 80% 50% / 0.15),
			transparent
		);
		inset: 0;
		pointer-events: none;
		position: absolute;
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
</style>
