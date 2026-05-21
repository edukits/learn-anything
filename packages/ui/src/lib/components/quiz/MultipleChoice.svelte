<script lang="ts">
	import Button from '../Button.svelte';
	import MultipleChoiceOption from './MultipleChoiceOption.svelte';
	import type {
		MultipleChoiceInteractionMode,
		MultipleChoiceOptionData,
		MultipleChoiceOptionState,
		MultipleChoiceSubmitResult
	} from './types';

	type MultipleChoiceProps = {
		options: MultipleChoiceOptionData[];
		value?: string | null;
		name?: string;
		legend?: string;
		disabled?: boolean;
		interactionMode?: MultipleChoiceInteractionMode;
		correctValue?: string | null;
		submitted?: boolean;
		showSubmitButton?: boolean;
		submitLabel?: string;
		class?: string;
		onselect?: (value: string, option: MultipleChoiceOptionData) => void;
		onsubmit?: (result: MultipleChoiceSubmitResult) => void;
	};

	let {
		options,
		value = $bindable<string | null>(null),
		name = 'multiple-choice',
		legend = 'Answer choices',
		disabled = false,
		interactionMode = 'submit',
		correctValue = null,
		submitted = $bindable(false),
		showSubmitButton = false,
		submitLabel = 'Submit answer',
		class: className = '',
		onselect,
		onsubmit
	}: MultipleChoiceProps = $props();

	let resolvedCorrectValue = $derived(
		correctValue ?? options.find((option) => option.state === 'correct')?.value ?? null
	);
	let hasAnswerKey = $derived(resolvedCorrectValue !== null);
	let isLocked = $derived(disabled || submitted);
	let multipleChoiceElement: HTMLDivElement | undefined = $state();

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
		return Math.round(channel)
			.toString(16)
			.padStart(2, '0');
	}

	function normalizeHexColor(colorValue: string, fallback: string) {
		const hex = colorValue.trim().replace(/^#/, '');
		const normalized =
			hex.length === 3
				? hex
						.split('')
						.map((channel) => channel + channel)
						.join('')
				: hex;

		return /^[0-9a-f]{6}$/i.test(normalized) ? `#${normalized.toLowerCase()}` : fallback;
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
		const styles = getComputedStyle(document.documentElement);
		const correctColor = normalizeHexColor(styles.getPropertyValue('--color-correct'), '#22a06b');

		return [correctColor, mixHexColor(correctColor, 255, 0.34), mixHexColor(correctColor, 0, 0.2)];
	}

	function getRadioControlElement(event?: Event) {
		const input = event?.currentTarget;

		if (!(input instanceof HTMLInputElement)) {
			return undefined;
		}

		const control = input.nextElementSibling;
		return control instanceof HTMLElement ? control : input;
	}

	async function celebrateCorrectInstantSubmission(sourceElement?: HTMLElement) {
		const sourceBounds = sourceElement?.getBoundingClientRect();
		const fallbackBounds = multipleChoiceElement?.getBoundingClientRect();
		const bounds = sourceBounds ?? fallbackBounds;
		const origin = bounds
			? {
					x: (bounds.left + bounds.width / 2) / window.innerWidth,
					y: ((bounds.top + bounds.height / 2) + 25) / window.innerHeight
				}
			: { x: 0.5, y: 0.45 };
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
			origin,
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

	function getOptionState(option: MultipleChoiceOptionData): MultipleChoiceOptionState {
		if (!submitted || !hasAnswerKey) {
			return option.state ?? 'neutral';
		}

		if (option.value === resolvedCorrectValue) {
			return 'correct';
		}

		if (option.value === value) {
			return 'incorrect';
		}

		return 'neutral';
	}

	function submitSelection(sourceElement?: HTMLElement) {
		if (disabled || submitted || value === null) {
			return;
		}

		const isCorrect = resolvedCorrectValue === null ? null : value === resolvedCorrectValue;

		submitted = true;
		onsubmit?.({
			value,
			correct: isCorrect
		});

		if (interactionMode === 'instant-submit' && isCorrect) {
			void celebrateCorrectInstantSubmission(sourceElement);
		}
	}

	function selectOption(option: MultipleChoiceOptionData, event?: Event) {
		if (isLocked || option.disabled) {
			return;
		}

		const sourceElement = getRadioControlElement(event);
		value = option.value;
		onselect?.(option.value, option);

		if (interactionMode === 'instant-submit') {
			submitSelection(sourceElement);
		}
	}
</script>

<div
	bind:this={multipleChoiceElement}
	class={['la-multiple-choice', submitted && 'la-multiple-choice--submitted', className]}
>
	<fieldset class="la-multiple-choice__fieldset" disabled={isLocked}>
		<legend>{legend}</legend>

		<div class="la-multiple-choice__options">
			{#each options as option (option.value)}
				<MultipleChoiceOption
					id={`${name}-${option.value}`}
					{name}
					value={option.value}
					label={option.label}
					description={option.description}
					selected={value === option.value}
					disabled={disabled || option.disabled}
					locked={submitted}
					state={getOptionState(option)}
					onchange={(event) => selectOption(option, event)}
				/>
			{/each}
		</div>
	</fieldset>

	{#if showSubmitButton}
		<div class="la-multiple-choice__footer">
			<Button
				variant="secondary"
				size="sm"
				label={submitLabel}
				disabled={disabled || submitted || value === null}
				onclick={() => submitSelection()}
			/>
		</div>
	{/if}
</div>

<style>
	.la-multiple-choice {
		display: grid;
		gap: var(--space-4);
	}

	.la-multiple-choice__fieldset {
		border: 0;
		margin: 0;
		min-inline-size: 0;
		padding: 0;
	}

	legend {
		block-size: 1px;
		inline-size: 1px;
		clip: rect(0 0 0 0);
		clip-path: inset(50%);
		overflow: hidden;
		position: absolute;
		white-space: nowrap;
	}

	.la-multiple-choice__options {
		display: grid;
		gap: var(--space-3);
	}

	.la-multiple-choice__footer {
		align-items: center;
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		justify-content: end;
	}
</style>
