<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';

	type ProgressBarSize = 'sm' | 'md' | 'lg';

	type ProgressBarProps = Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children'> & {
		/** Current progress value (0–100) */
		value?: number;
		/** Maximum value (default 100) */
		max?: number;
		size?: ProgressBarSize;
		/** Custom accent hue (0–360) */
		h?: number;
		/** Custom accent saturation (0%–100%) */
		s?: number;
		/** Custom accent lightness (0%–100%) */
		l?: number;
		/** Fire spark particles on progress jumps above this threshold (default 10) */
		sparkThreshold?: number;
		/** Require this value to change before spark particles fire */
		sparkTrigger?: unknown;
		/** Disable spark particle effects */
		disableSparks?: boolean;
		class?: string;
	};

	let {
		value = 0,
		max = 100,
		size = 'md',
		h,
		s,
		l,
		sparkThreshold = 10,
		sparkTrigger,
		disableSparks = false,
		class: className = '',
		...rest
	}: ProgressBarProps = $props();

	let percent = $derived(Math.min(100, Math.max(0, (value / max) * 100)));

	let trackEl: HTMLDivElement | undefined = $state(undefined);
	let previousPercent = -1;
	let previousSparkTrigger: unknown = undefined;

	$effect(() => {
		const current = percent;
		const currentSparkTrigger = sparkTrigger;

		if (previousPercent < 0) {
			previousPercent = current;
			previousSparkTrigger = currentSparkTrigger;
			return;
		}

		const jump = current - previousPercent;
		const triggerChanged = currentSparkTrigger !== previousSparkTrigger;
		const shouldSpark = sparkTrigger === undefined || triggerChanged;

		if (jump > 0 && jump >= sparkThreshold && shouldSpark && !disableSparks && trackEl) {
			fireSparks(trackEl, current);
		}

		previousPercent = current;
		previousSparkTrigger = currentSparkTrigger;
	});

	async function fireSparks(container: HTMLElement, currentPercent: number) {
		const { default: confetti } = await import('canvas-confetti');

		const rect = container.getBoundingClientRect();
		const fillEdgeX = rect.left + (currentPercent / 100) * rect.width;
		const centerY = rect.top + rect.height / 2;

		const originX = (fillEdgeX / window.innerWidth) - 0.05;
		const originY = centerY / window.innerHeight;

		const pixelRatio = Math.max(1, window.devicePixelRatio || 1);

		const canvas = document.createElement('canvas');
		const width = document.documentElement.clientWidth;
		const height = document.documentElement.clientHeight;
		canvas.width = Math.round(width * pixelRatio);
		canvas.height = Math.round(height * pixelRatio);
		canvas.style.position = 'fixed';
		canvas.style.inset = '0';
		canvas.style.inlineSize = `${width}px`;
		canvas.style.blockSize = `${height}px`;
		canvas.style.pointerEvents = 'none';
		canvas.style.zIndex = '100';
		document.body.appendChild(canvas);

		const fire = confetti.create(canvas, { disableForReducedMotion: true });

		const sparkColors = getAccentConfettiColors(container);

		const animation = fire({
			angle: 20,
			particleCount: 50,
			startVelocity: 18 * pixelRatio,
			spread: 100,
			origin: { x: originX, y: originY },
			colors: sparkColors,
			gravity: 0.3 * pixelRatio,
			scalar: 0.3 * pixelRatio,
			decay: 0.92,
			ticks: 20,
			shapes: ['circle'],
			disableForReducedMotion: true
		});

		void animation?.finally(() => canvas.remove());
		if (!animation) {
			setTimeout(() => canvas.remove(), 800);
		}
	}

	function toHexByte(channel: number) {
		return Math.round(channel).toString(16).padStart(2, '0');
	}

	function rgbToHex(color: string, fallback: string) {
		const channels = color
			.match(/[\d.]+/g)
			?.slice(0, 3)
			.map((channel) => Number.parseFloat(channel));

		if (!channels || channels.length < 3 || channels.some((channel) => Number.isNaN(channel))) {
			return fallback;
		}

		return `#${channels.map(toHexByte).join('')}`;
	}

	function mixHexColor(hexColor: string, target: number, amount: number) {
		const hex = hexColor.slice(1);
		const red = Number.parseInt(hex.slice(0, 2), 16);
		const green = Number.parseInt(hex.slice(2, 4), 16);
		const blue = Number.parseInt(hex.slice(4, 6), 16);
		const mix = (channel: number) => channel + (target - channel) * amount;

		return `#${toHexByte(mix(red))}${toHexByte(mix(green))}${toHexByte(mix(blue))}`;
	}

	function getAccentConfettiColors(container: HTMLElement) {
		const probe = document.createElement('span');
		probe.hidden = true;
		probe.style.color = 'hsl(var(--_h) var(--_s) var(--_l))';
		container.appendChild(probe);

		const accentColor = rgbToHex(getComputedStyle(probe).color, '#22a06b');
		probe.remove();

		return [
			accentColor,
			mixHexColor(accentColor, 255, 0.34),
			mixHexColor(accentColor, 0, 0.18),
			'#ffffff'
		];
	}
</script>

<div
	bind:this={trackEl}
	class={['progress-bar', className]}
	data-size={size}
	role="progressbar"
	aria-valuenow={value}
	aria-valuemin={0}
	aria-valuemax={max}
	style:--bar-h={h != null ? `${h}` : undefined}
	style:--bar-s={s != null ? `${s}%` : undefined}
	style:--bar-l={l != null ? `${l}%` : undefined}
	{...rest}
>
	<div class="progress-bar__fill" style:inline-size="{percent}%"></div>
	<div class="progress-bar__sheen"></div>
</div>

<style>
	@property --fill-width {
		syntax: '<percentage>';
		inherits: false;
		initial-value: 0%;
	}

	.progress-bar {
		--_h: var(--bar-h, var(--color-accent-h, 142));
		--_s: var(--bar-s, var(--color-accent-s, 70%));
		--_l: var(--bar-l, var(--color-accent-l, 48%));

		position: relative;
		overflow: hidden;
		border-radius: 999px;
		background: color-mix(in srgb, var(--color-border), transparent 58%);
		box-shadow:
			inset 0 0 1px 1px hsl(0 0% 0% / 0.1),
			0 1px 1px hsl(var(--_h) calc(var(--_s) * 0.1) 22% / 30%);
	}

	[data-size='sm'] {
		block-size: 0.5rem;
	}

	[data-size='md'] {
		block-size: 0.75rem;
	}

	[data-size='lg'] {
		block-size: 1.125rem;
	}

	.progress-bar__fill {
		position: absolute;
		inset: 0;
		inline-size: 0%;
		border-radius: inherit;

		background: linear-gradient(
			to bottom,
			hsl(var(--_h) var(--_s) calc(var(--_l) + 12%)),
			hsl(var(--_h) var(--_s) var(--_l)),
			hsl(var(--_h) var(--_s) calc(var(--_l) - 8%))
		);
		border-block-start: 1px solid hsl(var(--_h) var(--_s) calc(var(--_l) + 22%) / 0.6);

		box-shadow:
			inset 0 1px 1px hsl(var(--_h) var(--_s) calc(var(--_l) + 28%) / 0.5),
			0 0 6px 1px hsl(var(--_h) var(--_s) var(--_l) / 0.35);

		transition: inline-size 400ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.progress-bar__sheen {
		position: absolute;
		inset: 0;
		border-radius: inherit;
		pointer-events: none;
		background: linear-gradient(
			to bottom,
			hsl(0 0% 100% / 0.22) 0%,
			hsl(0 0% 100% / 0.06) 45%,
			transparent 50%,
			hsl(0 0% 0% / 0.08) 100%
		);
	}
</style>
