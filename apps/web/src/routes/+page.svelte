<script lang="ts">
	import type { PageProps } from './$types';
	import { Button } from '@learn-anything/ui';
	import {
		ArrowRight,
		BookOpen,
		Clock,
		Flame,
		Map,
		RefreshCw,
		Sparkles,
		Trophy
	} from '@lucide/svelte';
	import { pluralize } from '$lib/shared/utils/format';
	import logoUrl from '../../../../packages/ui/src/lib/assets/brand/logo-dark-md.png';
	import heroImageUrl from '$lib/assets/hero-path.png';

	let { data }: PageProps = $props();

	const avatarHues = [200, 32, 280, 140, 350, 220, 95, 12];

	function formatDuration(minutes: number) {
		if (minutes < 60) return `${minutes} min`;
		const hours = Math.round(minutes / 60);
		return `${hours} hr`;
	}

	const features = [
		{
			icon: Map,
			title: 'Structured paths',
			description: 'Follow concept-first lessons that build on each other — no wandering, no gaps.'
		},
		{
			icon: RefreshCw,
			title: 'Spaced repetition',
			description: 'Review at the right time so knowledge sticks long after the lesson ends.'
		},
		{
			icon: Sparkles,
			title: 'AI-guided practice',
			description: 'Adaptive quizzes that target what you need to work on most.'
		},
		{
			icon: Flame,
			title: 'XP & streaks',
			description: 'Earn progress, keep your streak alive, and climb the leaderboard.'
		}
	];

	const logoSparklePath =
		'M102.23,218.89s-23.55-49.65-34.98-95.02c-6.27-24.9-6.92-46.44-2.64-62.61C76.67,15.61,112.13,1.66,150.23.52s78.08,38.1,92.03,75.44-3.47,95.64-62.61,122.21c-44.51,19.99-118.64,39.37-161.06-10.82-41.11-48.66-4.66-103.45,35.08-116.29,36.21-11.69,107.26-20,156.19,44.77,48.25,63.86-5.24,140.21-44.54,146.09-47.9,7.17-89.47-70.64-70.91-132.87,19.6-65.73,90.62-84.52,165.21-30.07,53.56,39.1,25.27,129.75-45.45,163.83-25,12.05-59.41,19.26-82.56.32-20.87-17.08-29.38-44.24-29.38-44.24Z';

	let showStats = $derived(
		data.stats.subjectCount > 0 ||
			data.stats.topicCount > 0 ||
			data.stats.lessonCount > 0 ||
			data.stats.quizCount > 0
	);
</script>

<main class="landing">
	<section class="hero">
		<div class="hero-atmosphere" aria-hidden="true">
			<div class="atmosphere-wash"></div>
			<div class="atmosphere-stars"></div>
			<div class="atmosphere-horizon"></div>
		</div>

		<div class="hero-inner page">
			<div class="hero-copy">
				<div class="hero-brand">
					<div class="brand-logo">
						<img src={logoUrl} alt="" aria-hidden="true" decoding="async" />
						<svg
							class="logo-sparkle-layer"
							viewBox="0 0 287.97 275.25"
							aria-hidden="true"
							focusable="false"
						>
							<defs>
								<filter id="hero-logo-sparkle-glow" x="-95%" y="-95%" width="290%" height="290%">
									<feGaussianBlur in="SourceGraphic" stdDeviation="9" result="violet-blur" />
									<feColorMatrix
										in="violet-blur"
										type="matrix"
										values="0 0 0 0 0.74 0 0 0 0 0.34 0 0 0 0 1 0 0 0 0.68 0"
										result="violet-glow"
									/>
									<feGaussianBlur in="SourceGraphic" stdDeviation="4.8" result="cyan-blur" />
									<feColorMatrix
										in="cyan-blur"
										type="matrix"
										values="0 0 0 0 0.28 0 0 0 0 0.94 0 0 0 0 1 0 0 0 1 0"
										result="cyan-glow"
									/>
									<feGaussianBlur in="SourceGraphic" stdDeviation="3" result="soft-source" />
									<feMerge>
										<feMergeNode in="violet-glow" />
										<feMergeNode in="cyan-glow" />
										<feMergeNode in="soft-source" />
									</feMerge>
								</filter>
								<radialGradient id="hero-logo-sparkle-core" cx="50%" cy="50%" r="50%">
									<stop offset="0%" stop-color="#ffffff" />
									<stop offset="45%" stop-color="#8ff7ff" />
									<stop offset="100%" stop-color="#ba72ff" stop-opacity="0" />
								</radialGradient>
							</defs>
							<path id="hero-logo-sparkle-path" d={logoSparklePath} fill="none" stroke="none" />

							<g class="logo-sparkle logo-sparkle-primary">
								<circle r="5.7" fill="url(#hero-logo-sparkle-core)" />
								<path
									d="M0 -12V12M-12 0H12"
									stroke="#ffffff"
									stroke-width="2"
									stroke-linecap="round"
								/>
								<animateMotion dur="9.5s" repeatCount="indefinite" rotate="auto">
									<mpath href="#hero-logo-sparkle-path" />
								</animateMotion>
							</g>

							<g class="logo-sparkle logo-sparkle-secondary">
								<circle r="3.8" fill="url(#hero-logo-sparkle-core)" />
								<path
									d="M0 -8V8M-8 0H8"
									stroke="#dffbff"
									stroke-width="1.5"
									stroke-linecap="round"
								/>
								<animateMotion dur="12.5s" begin="-4.3s" repeatCount="indefinite" rotate="auto">
									<mpath href="#hero-logo-sparkle-path" />
								</animateMotion>
							</g>

							<g class="logo-sparkle logo-sparkle-tertiary">
								<circle r="2.8" fill="url(#hero-logo-sparkle-core)" />
								<animateMotion dur="15s" begin="-8.2s" repeatCount="indefinite" rotate="auto">
									<mpath href="#hero-logo-sparkle-path" />
								</animateMotion>
							</g>
						</svg>
					</div>
					<p class="eyebrow hero-eyebrow">Free self-study platform</p>
				</div>

				<h1>Master any topic, one path at a time</h1>
				<p class="lede">
					Stop bouncing between tutorials. Follow a clear path from first principles to real
					mastery — and actually remember it.
				</p>

				<div class="button-row">
					<Button href="/sign-in" size="lg">Start learning <ArrowRight size={18} /></Button>
					<Button href="/subjects" variant="ghost" size="lg" label="Browse catalogue" />
				</div>
			</div>

			<div class="hero-media">
				<img
					src={heroImageUrl}
					alt="A glowing path of connected concept cards leading upward to mastery"
					decoding="async"
					fetchpriority="high"
				/>
			</div>
		</div>
	</section>

	{#if showStats}
		<section class="stats page" aria-label="Catalogue overview">
			<div class="stat">
				<strong>{data.stats.subjectCount}</strong>
				<span>{pluralize(data.stats.subjectCount, 'subject')}</span>
			</div>
			<div class="stat">
				<strong>{data.stats.topicCount}</strong>
				<span>{pluralize(data.stats.topicCount, 'topic')}</span>
			</div>
			<div class="stat">
				<strong>{data.stats.lessonCount}</strong>
				<span>{pluralize(data.stats.lessonCount, 'lesson')}</span>
			</div>
			<div class="stat">
				<strong>{data.stats.quizCount}</strong>
				<span>{pluralize(data.stats.quizCount, 'quiz', 'quizzes')}</span>
			</div>
		</section>
	{/if}

	<section class="features page" aria-labelledby="features-heading">
		<header class="section-heading">
			<p class="eyebrow">How it works</p>
			<h2 id="features-heading">Learn smarter, not harder</h2>
			<p class="muted">
				Short lessons, targeted quizzes, and spaced review — everything you need to actually retain
				what you learn.
			</p>
		</header>

		<div class="feature-grid">
			{#each features as feature (feature.title)}
				<article class="feature-card">
					<div class="feature-icon">
						<feature.icon size={22} strokeWidth={2.25} />
					</div>
					<h3>{feature.title}</h3>
					<p class="muted">{feature.description}</p>
				</article>
			{/each}
		</div>
	</section>

	{#if data.subjects.length > 0}
		<section class="showcase page" aria-labelledby="subjects-heading">
			<header class="section-heading section-heading-row">
				<div>
					<p class="eyebrow">Catalogue</p>
					<h2 id="subjects-heading">Browse subjects</h2>
					<p class="muted">Pick a subject to explore its topic paths.</p>
				</div>
				<a class="see-all" href="/subjects">
					See all subjects
					<ArrowRight size={16} strokeWidth={2.5} />
				</a>
			</header>

			<div class="subject-list">
				{#each data.subjects as subject, i (subject.id)}
					<a
						class="catalogue-row subject"
						href={`/subjects/${subject.slug}`}
						style:--avatar-h={avatarHues[i % avatarHues.length]}
					>
						<span class="avatar" aria-hidden="true">{subject.name.charAt(0)}</span>
						<div class="subject-body">
							<div class="subject-head">
								<h3>{subject.name}</h3>
								<span class="count muted">{pluralize(subject.topicCount, 'topic')}</span>
							</div>
							<p class="muted">{subject.summary}</p>
						</div>
						<span class="row-arrow" aria-hidden="true">
							<ArrowRight size={16} strokeWidth={2.5} />
						</span>
					</a>
				{/each}
			</div>
		</section>
	{/if}

	{#if data.topics.length > 0}
		<section class="showcase page" aria-labelledby="topics-heading">
			<header class="section-heading section-heading-row">
				<div>
					<p class="eyebrow">Learning paths</p>
					<h2 id="topics-heading">Featured topics</h2>
					<p class="muted">Preview any path before signing in to practice and track progress.</p>
				</div>
				<a class="see-all" href="/topics">
					See all topics
					<ArrowRight size={16} strokeWidth={2.5} />
				</a>
			</header>

			<div class="topic-list">
				{#each data.topics as topic (topic.topic_area_id)}
					<a class="topic-card" href={`/topics/${topic.slug}/preview`}>
						<span class="topic-level">{topic.level_label}</span>
						<h3>{topic.name}</h3>
						<p class="summary muted">{topic.public_summary}</p>
						<div class="topic-foot">
							<div class="fact-inline">
								<span><BookOpen size={14} /> {pluralize(topic.lesson_count, 'lesson')}</span>
								<span><Trophy size={14} /> {pluralize(topic.quiz_count, 'quiz', 'quizzes')}</span>
								<span><Clock size={14} /> {formatDuration(topic.estimated_minutes)}</span>
							</div>
							<span class="card-arrow" aria-hidden="true">
								<ArrowRight size={16} strokeWidth={2.5} />
							</span>
						</div>
					</a>
				{/each}
			</div>
		</section>
	{/if}

	<section class="cta-band">
		<div class="cta-inner page">
			<h2>Ready to start learning?</h2>
			<p class="muted">Sign in with a magic link — no password needed. It's free.</p>
			<div class="button-row">
				<Button href="/sign-in" size="lg">Start learning <ArrowRight size={18} /></Button>
			</div>
		</div>
	</section>

	<footer class="landing-footer page">
		<div class="footer-brand">
			<strong>Clarifyst</strong>
			<p class="muted">Free, structured self-study for the perpetually curious.</p>
		</div>
		<nav class="footer-nav" aria-label="Footer">
			<a href="/subjects">Subjects</a>
			<a href="/topics">Topics</a>
			<a href="/sign-in">Sign in</a>
		</nav>
	</footer>
</main>

<style>
	.landing {
		display: grid;
		gap: 0;
	}

	/* ── Hero ── */

	.hero {
		background:
			radial-gradient(ellipse 78% 62% at 96% 70%, rgb(0 198 226 / 0.38), transparent 58%),
			radial-gradient(ellipse 64% 52% at 0% 98%, rgb(133 45 255 / 0.48), transparent 58%),
			radial-gradient(ellipse 70% 42% at 50% 48%, rgb(36 104 255 / 0.16), transparent 66%),
			linear-gradient(153deg, #030823 0%, #061037 42%, #082653 73%, #073044 100%);
		overflow: hidden;
		padding-block: clamp(64px, 10vw, 120px) clamp(56px, 8vw, 96px);
		position: relative;
	}

	.hero-atmosphere {
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

	.hero-inner {
		align-items: center;
		animation: fade-up 500ms cubic-bezier(0.22, 1, 0.36, 1) both;
		display: grid;
		gap: clamp(32px, 5vw, 64px);
		grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
		position: relative;
		z-index: 1;
	}

	.hero-copy {
		display: grid;
		gap: 20px;
		max-inline-size: 56ch;
	}

	.hero-media {
		position: relative;
	}

	.hero-media img {
		aspect-ratio: 4 / 5;
		block-size: auto;
		border: 1px solid rgb(125 200 255 / 0.28);
		border-radius: var(--radius-lg);
		box-shadow:
			0 1px 0 inset rgb(255 255 255 / 0.18),
			0 24px 60px rgb(3 12 40 / 0.55),
			0 8px 24px rgb(0 140 200 / 0.28);
		display: block;
		inline-size: 100%;
		object-fit: cover;
	}

	.hero-brand {
		align-items: center;
		display: flex;
		gap: 16px;
	}

	.brand-logo {
		align-items: center;
		block-size: 3.5rem;
		display: inline-flex;
		inline-size: 3.5rem;
		justify-content: center;
		position: relative;
	}

	.brand-logo img {
		block-size: 100%;
		display: block;
		inline-size: 100%;
		object-fit: contain;
	}

	.logo-sparkle-layer {
		block-size: calc(100% * 138 / 144);
		display: block;
		filter: saturate(1.2);
		inline-size: 100%;
		inset-block-start: calc(100% * 3 / 144);
		inset-inline-start: 0;
		overflow: visible;
		pointer-events: none;
		position: absolute;
	}

	.logo-sparkle-layer path[id='hero-logo-sparkle-path'] {
		fill: none;
		stroke: transparent;
	}

	.logo-sparkle {
		animation: sparkle-pulse 9.5s ease-in-out infinite;
		filter: url('#hero-logo-sparkle-glow');
		mix-blend-mode: screen;
		opacity: 0;
	}

	.logo-sparkle-secondary {
		animation-delay: -4.3s;
		animation-duration: 12.5s;
	}

	.logo-sparkle-tertiary {
		animation-delay: -8.2s;
		animation-duration: 15s;
	}

	.hero-eyebrow {
		color: hsl(var(--color-accent-h) 40% 72%);
		margin: 0;
	}

	h1 {
		color: #ffffff;
		font-size: clamp(2.25rem, 4.5vw, 3.75rem);
		letter-spacing: -0.02em;
		line-height: 1;
		margin: 0;
		max-inline-size: 16ch;
	}

	.lede {
		color: hsl(var(--color-accent-h) 30% 72%);
		font-size: clamp(1.05rem, 1.4vw, 1.2rem);
		line-height: 1.55;
		margin: 0;
		max-inline-size: 52ch;
	}

	/* ── Stats ── */

	.stats {
		border-block-end: 1px solid var(--color-border);
		display: grid;
		gap: 24px;
		grid-template-columns: repeat(4, 1fr);
		padding-block: 40px;
	}

	.stat {
		display: grid;
		gap: 4px;
		text-align: center;
	}

	.stat strong {
		font-family: var(--font-display);
		font-size: clamp(1.75rem, 3vw, 2.5rem);
		font-weight: 600;
		letter-spacing: -0.02em;
		line-height: 1;
	}

	.stat span {
		color: var(--color-text-muted);
		font-size: 0.875rem;
	}

	/* ── Features ── */

	.features {
		display: grid;
		gap: 40px;
		padding-block: clamp(56px, 8vw, 96px);
	}

	.section-heading {
		display: grid;
		gap: 8px;
	}

	.section-heading-row {
		align-items: end;
		gap: 16px;
		grid-template-columns: 1fr auto;
	}

	h2,
	h3,
	p {
		margin: 0;
	}

	h2 {
		font-size: clamp(2rem, 4vw, 3rem);
		letter-spacing: -0.02em;
		line-height: 1.05;
	}

	.feature-grid {
		display: grid;
		gap: 16px;
		grid-template-columns: repeat(4, 1fr);
	}

	.feature-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		display: grid;
		gap: 12px;
		padding: clamp(20px, 3vw, 28px);
	}

	.feature-icon {
		align-items: center;
		background: linear-gradient(
			to bottom,
			hsl(var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) + 4%)),
			hsl(var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) - 8%))
		);
		block-size: 44px;
		border: 1px solid
			hsl(var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) - 16%));
		border-radius: var(--radius-md);
		box-shadow:
			0 1px 0 inset
				hsl(var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) + 14%)),
			0 2px 6px hsl(var(--color-accent-h) 30% 40% / 0.2);
		color: var(--color-accent-contrast);
		display: inline-flex;
		inline-size: 44px;
		justify-content: center;
	}

	h3 {
		font-size: 1.1rem;
		letter-spacing: -0.005em;
	}

	.feature-card p {
		font-size: 0.92rem;
		line-height: 1.5;
	}

	/* ── Showcase (subjects & topics) ── */

	.showcase {
		display: grid;
		gap: 28px;
		padding-block: clamp(48px, 6vw, 72px);
	}

	.see-all {
		align-items: center;
		color: var(--color-text-muted);
		display: inline-flex;
		font-size: 0.875rem;
		font-weight: 550;
		gap: 6px;
		text-decoration: none;
		transition: color var(--transition-ease);
		white-space: nowrap;
	}

	.see-all:hover,
	.see-all:focus-visible {
		color: var(--color-accent);
		outline: none;
	}

	.subject-list {
		display: grid;
		gap: 10px;
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	.topic-list {
		display: grid;
		gap: 16px;
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	.topic-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		color: inherit;
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: clamp(20px, 3vw, 26px);
		text-decoration: none;
		transition:
			border-color var(--transition-ease),
			box-shadow var(--transition-ease),
			transform var(--transition-ease);
	}

	.topic-card:hover,
	.topic-card:focus-visible {
		border-color: color-mix(in srgb, var(--color-accent), transparent 40%);
		box-shadow: 0 10px 30px rgb(15 30 60 / 0.08);
		outline: none;
		transform: translateY(-2px);
	}

	.topic-level {
		align-self: flex-start;
		background: color-mix(in srgb, var(--color-accent), transparent 90%);
		border-radius: 100px;
		color: color-mix(in srgb, var(--color-accent), var(--color-text) 25%);
		font-size: 0.7rem;
		font-weight: 750;
		letter-spacing: 0.04em;
		padding: 4px 11px;
		text-transform: uppercase;
	}

	.topic-card .summary {
		-webkit-box-orient: vertical;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		overflow: hidden;
	}

	.topic-foot {
		align-items: center;
		border-block-start: 1px solid var(--color-border);
		display: flex;
		gap: 12px;
		justify-content: space-between;
		margin-block-start: auto;
		padding-block-start: 14px;
	}

	.card-arrow {
		color: var(--color-text-muted);
		flex-shrink: 0;
		opacity: 0;
		transform: translateX(-4px);
		transition:
			opacity var(--transition-ease),
			transform var(--transition-ease),
			color var(--transition-ease);
	}

	.topic-card:hover .card-arrow,
	.topic-card:focus-visible .card-arrow {
		color: var(--color-accent);
		opacity: 1;
		transform: none;
	}

	.subject {
		align-items: center;
		gap: 16px;
		grid-template-columns: 44px 1fr auto;
	}

	.avatar {
		align-items: center;
		background: linear-gradient(
			to bottom,
			hsl(var(--avatar-h) 70% 95%),
			hsl(var(--avatar-h) 65% 91%)
		);
		block-size: 44px;
		border: 1px solid hsl(var(--avatar-h) 40% 84%);
		border-radius: var(--radius-md);
		box-shadow: 0 1px 0 inset hsl(var(--avatar-h) 80% 98%);
		color: hsl(var(--avatar-h) 55% 38%);
		display: inline-flex;
		font-family: var(--font-display);
		font-size: 1.15rem;
		font-weight: 600;
		inline-size: 44px;
		justify-content: center;
	}

	.subject-body {
		display: grid;
		gap: 4px;
		min-inline-size: 0;
	}

	.subject-head {
		align-items: baseline;
		display: flex;
		gap: 10px;
	}

	.count {
		font-size: 0.82rem;
	}

	.subject-body p {
		font-size: 0.95rem;
		line-height: 1.45;
	}

	.summary {
		font-size: 0.95rem;
		line-height: 1.45;
	}

	.row-arrow {
		color: var(--color-text-muted);
		opacity: 0;
		transform: translateX(-3px);
		transition:
			opacity var(--transition-ease),
			transform var(--transition-ease),
			color var(--transition-ease);
	}

	.subject:hover .row-arrow,
	.subject:focus-visible .row-arrow {
		color: var(--color-accent);
		opacity: 1;
		transform: none;
	}

	/* ── CTA band ── */

	.cta-band {
		background: color-mix(in srgb, var(--color-accent), transparent 94%);
		border-block: 1px solid color-mix(in srgb, var(--color-accent), transparent 80%);
		padding-block: clamp(56px, 8vw, 80px);
	}

	.cta-inner {
		display: grid;
		gap: 16px;
		text-align: center;
	}

	.cta-inner h2 {
		margin-inline: auto;
		max-inline-size: 20ch;
	}

	.cta-inner p {
		margin-inline: auto;
		max-inline-size: 40ch;
	}

	.cta-inner .button-row {
		justify-content: center;
	}

	/* ── Footer ── */

	.landing-footer {
		align-items: start;
		display: grid;
		gap: 24px;
		grid-template-columns: 1fr auto;
		padding-block: 48px 64px;
	}

	.footer-brand {
		display: grid;
		gap: 6px;
	}

	.footer-brand strong {
		font-family: var(--font-display);
		font-size: 1.1rem;
	}

	.footer-brand p {
		font-size: 0.875rem;
		max-inline-size: 36ch;
	}

	.footer-nav {
		display: flex;
		flex-wrap: wrap;
		gap: 20px;
	}

	.footer-nav a {
		color: var(--color-text-muted);
		font-size: 0.875rem;
		font-weight: 500;
		transition: color var(--transition-ease);
	}

	.footer-nav a:hover,
	.footer-nav a:focus-visible {
		color: var(--color-text);
		outline: none;
	}

	/* ── Animations ── */

	@keyframes fade-up {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
	}

	@keyframes sparkle-pulse {
		0%,
		100% {
			opacity: 0;
		}

		8% {
			opacity: 0.96;
		}

		18% {
			opacity: 0.42;
		}

		29% {
			opacity: 0.88;
		}

		42% {
			opacity: 0.18;
		}

		57% {
			opacity: 1;
		}

		71% {
			opacity: 0.28;
		}

		84% {
			opacity: 0.76;
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

	/* ── Responsive ── */

	@media (max-width: 960px) {
		.feature-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 880px) {
		.hero-inner {
			grid-template-columns: 1fr;
		}

		.hero-media {
			margin-inline: auto;
			max-inline-size: 420px;
		}

		.stats {
			grid-template-columns: repeat(2, 1fr);
		}

		.section-heading-row {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 640px) {
		.feature-grid {
			grid-template-columns: 1fr;
		}

		.subject-list,
		.topic-list {
			grid-template-columns: 1fr;
		}

		.subject {
			grid-template-columns: 40px 1fr;
		}

		.avatar {
			block-size: 40px;
			font-size: 1rem;
			inline-size: 40px;
		}

		.row-arrow {
			display: none;
		}

		.landing-footer {
			grid-template-columns: 1fr;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.hero-inner,
		.atmosphere-wash,
		.atmosphere-stars,
		.atmosphere-horizon,
		.logo-sparkle {
			animation: none;
		}

		.logo-sparkle-layer {
			display: none;
		}
	}
</style>
