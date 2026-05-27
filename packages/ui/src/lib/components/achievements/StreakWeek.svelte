<script lang="ts">
	import { Check } from '@lucide/svelte';
	import type { StreakWeekDay } from './types';

	const DAY_FORMATTER = new Intl.DateTimeFormat('en-US', {
		timeZone: 'UTC',
		weekday: 'short'
	});
	const ARIA_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
		timeZone: 'UTC',
		weekday: 'long',
		month: 'long',
		day: 'numeric'
	});
	const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;

	let {
		currentStreak,
		currentDate = toLocalDateValue(new Date()),
		ariaLabel,
		class: className = ''
	}: {
		currentStreak: number;
		currentDate?: string;
		ariaLabel?: string;
		class?: string;
	} = $props();

	let normalizedStreak = $derived(Math.max(0, Math.floor(Number(currentStreak) || 0)));
	let weekDays = $derived.by(() => buildStreakWeek(normalizedStreak, currentDate));
	let rootLabel = $derived(
		ariaLabel ??
			`${normalizedStreak} ${normalizedStreak === 1 ? 'day' : 'days'} streak, showing one week of progress`
	);

	function toLocalDateValue(date: Date) {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');

		return `${year}-${month}-${day}`;
	}

	function parseDateValue(value: string) {
		const match = ISO_DATE_PATTERN.exec(value);

		if (match) {
			return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
		}

		const parsedDate = new Date(value);

		if (Number.isNaN(parsedDate.getTime())) {
			return parseDateValue(toLocalDateValue(new Date()));
		}

		return new Date(
			Date.UTC(parsedDate.getUTCFullYear(), parsedDate.getUTCMonth(), parsedDate.getUTCDate())
		);
	}

	function addDays(date: Date, days: number) {
		return new Date(date.getTime() + days * 86_400_000);
	}

	function toDateKey(date: Date) {
		return date.toISOString().slice(0, 10);
	}

	function buildStreakWeek(streak: number, dateValue: string): StreakWeekDay[] {
		const anchorDate = parseDateValue(dateValue);
		const anchorKey = toDateKey(anchorDate);
		const firstDayOffset = streak >= 7 ? -6 : streak > 0 ? -(streak - 1) : 0;
		const completedDays = Math.min(streak, 7);

		return Array.from({ length: 7 }, (_, index) => {
			const date = addDays(anchorDate, firstDayOffset + index);
			const dateKey = toDateKey(date);
			const completed = streak > 0 && index < completedDays;

			return {
				date: dateKey,
				label: DAY_FORMATTER.format(date).slice(0, 2),
				ariaLabel: `${ARIA_DATE_FORMATTER.format(date)}: ${completed ? 'completed' : 'not completed'}`,
				completed,
				current: dateKey === anchorKey
			};
		});
	}
</script>

<div class={['streak-week', className]} role="group" aria-label={rootLabel}>
	{#each weekDays as day (day.date)}
		<div class="day" aria-label={day.ariaLabel}>
			<span class={['day-label', day.current && 'current']}>{day.label}</span>
			<span class={['day-marker', day.completed && 'completed']} aria-hidden="true">
				{#if day.completed}
					<Check size={18} strokeWidth={3} />
				{/if}
			</span>
		</div>
	{/each}
</div>

<style>
	.streak-week {
		display: grid;
		gap: 10px;
		grid-template-columns: repeat(7, minmax(28px, 1fr));
		inline-size: min(100%, 340px);
	}

	.day {
		align-items: center;
		display: grid;
		gap: 8px;
		justify-items: center;
		min-inline-size: 0;
	}

	.day-label {
		color: hsl(0 0% 66%);
		font-size: 0.86rem;
		font-weight: 780;
		line-height: 1;
	}

	.day-label.current {
		color: hsl(var(--color-star-h) var(--color-star-s) calc(var(--color-star-l) - 10%));
	}

	.day-marker {
		align-items: center;
		background: hsl(0 0% 88%);
		border-radius: 50%;
		color: #fff;
		display: grid;
		block-size: 32px;
		inline-size: 32px;
		justify-items: center;
	}

	.day-marker.completed {
		background: linear-gradient(
			to bottom,
			hsl(var(--color-star-h) var(--color-star-s) calc(var(--color-star-l) + 5%)),
			hsl(var(--color-star-h) var(--color-star-s) calc(var(--color-star-l) - 2%))
		);
		box-shadow:
			inset 0 1px 2px hsl(0 0% 100% / 0.35),
			0 1px 4px hsl(var(--color-star-h) var(--color-star-s) var(--color-star-l) / 0.25);
	}

	@media (max-width: 380px) {
		.streak-week {
			gap: 7px;
			padding-inline: 12px;
		}

		.day-marker {
			block-size: 30px;
			inline-size: 30px;
		}
	}
</style>
