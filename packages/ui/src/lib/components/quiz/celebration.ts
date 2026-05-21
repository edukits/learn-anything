export const MULTIPLE_SELECT_CELEBRATION_STAGGER_MS = 100;

function createHiDpiConfettiCanvas() {
	const pixelRatio = Math.max(1, window.devicePixelRatio || 1);
	const width = document.documentElement.clientWidth;
	const height = document.documentElement.clientHeight;
	const canvas = document.createElement('canvas');

	canvas.width = Math.round(width * pixelRatio);
	canvas.height = Math.round(height * pixelRatio);
	canvas.style.position = 'fixed';
	canvas.style.inset = '0';
	canvas.style.inlineSize = `${width}px`;
	canvas.style.blockSize = `${height}px`;
	canvas.style.pointerEvents = 'none';
	canvas.style.zIndex = '100';
	document.body.appendChild(canvas);

	return { canvas, pixelRatio };
}

function toHexByte(channel: number) {
	return Math.round(channel).toString(16).padStart(2, '0');
}

function getCssVariableColorHex(variableName: string, fallback: string) {
	const probe = document.createElement('span');
	probe.hidden = true;
	probe.style.color = `var(${variableName})`;
	document.documentElement.appendChild(probe);

	const color = getComputedStyle(probe).color;
	probe.remove();

	const channels = color
		.match(/[\d.]+/g)
		?.slice(0, 3)
		.map((value) => Number.parseFloat(value));
	if (!channels || channels.length < 3) {
		return fallback;
	}

	if (channels.some((value) => Number.isNaN(value))) {
		return fallback;
	}

	return `#${channels.map((value) => Math.round(value).toString(16).padStart(2, '0')).join('')}`;
}

function mixHexColor(hexColor: string, target: number, amount: number) {
	const hex = hexColor.slice(1);
	const red = Number.parseInt(hex.slice(0, 2), 16);
	const green = Number.parseInt(hex.slice(2, 4), 16);
	const blue = Number.parseInt(hex.slice(4, 6), 16);
	const mix = (channel: number) => channel + (target - channel) * amount;

	return `#${toHexByte(mix(red))}${toHexByte(mix(green))}${toHexByte(mix(blue))}`;
}

function getCorrectConfettiColors() {
	const correctColor = getCssVariableColorHex('--color-correct', '#22a06b');

	return [correctColor, mixHexColor(correctColor, 255, 0.34), mixHexColor(correctColor, 0, 0.2)];
}

function getCelebrationOrigin(sourceElement?: HTMLElement) {
	const bounds = sourceElement?.getBoundingClientRect();

	if (!bounds) {
		return { x: 0.5, y: 0.45 };
	}

	return {
		x: (bounds.left + bounds.width / 2) / window.innerWidth,
		y: (bounds.top + bounds.height / 2 + 25) / window.innerHeight
	};
}

function delay(milliseconds: number) {
	return new Promise<void>((resolve) => {
		window.setTimeout(resolve, milliseconds);
	});
}

export async function celebrateCorrectAnswer(sourceElement?: HTMLElement) {
	const { default: confetti } = await import('canvas-confetti');
	const { canvas, pixelRatio } = createHiDpiConfettiCanvas();
	const fireConfetti = confetti.create(canvas, {
		disableForReducedMotion: true
	});

	const animation = fireConfetti({
		colors: getCorrectConfettiColors(),
		decay: 0.91,
		disableForReducedMotion: true,
		gravity: 2 * pixelRatio,
		origin: getCelebrationOrigin(sourceElement),
		particleCount: 50,
		scalar: 0.72 * pixelRatio,
		spread: 60,
		startVelocity: 30 * pixelRatio,
		ticks: 50
	});

	void animation?.finally(() => {
		canvas.remove();
	});

	if (!animation) {
		window.setTimeout(() => {
			canvas.remove();
		}, 1000);
	}
}

export const celebrateCorrectMultipleChoice = celebrateCorrectAnswer;

export async function celebrateCorrectMultipleSelect(sourceElements: HTMLElement[]) {
	const { default: confetti } = await import('canvas-confetti');
	const { canvas, pixelRatio } = createHiDpiConfettiCanvas();
	const fireConfetti = confetti.create(canvas, {
		disableForReducedMotion: true
	});
	const animations = sourceElements.map(async (sourceElement, index) => {
		await delay(index * MULTIPLE_SELECT_CELEBRATION_STAGGER_MS);

		return fireConfetti({
			colors: getCorrectConfettiColors(),
			decay: 0.91,
			disableForReducedMotion: true,
			gravity: 2 * pixelRatio,
			origin: getCelebrationOrigin(sourceElement),
			particleCount: 34,
			scalar: 0.62 * pixelRatio,
			spread: 54,
			startVelocity: 26 * pixelRatio,
			ticks: 46
		});
	});

	if (animations.length > 0) {
		void Promise.all(animations).finally(() => {
			canvas.remove();
		});
		return;
	}

	window.setTimeout(() => {
		canvas.remove();
	}, 1000);
}
