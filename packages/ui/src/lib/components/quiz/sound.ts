import { tiks } from '@rexa-developer/tiks';
import type { QuizQuestionResult } from './types';

const FIRST_QUESTION_SOUND_DELAY_MS = 80;

let quizSoundsInitialized = false;

export function initQuizSounds() {
	if (typeof window === 'undefined' || quizSoundsInitialized) {
		return;
	}

	tiks.init();
	quizSoundsInitialized = true;
}

export function createQuestionResultSoundPlayer() {
	let questionResultSoundPlayed = false;

	return (result: QuizQuestionResult) => {
		const playSound =
			result.correct === true
				? () => tiks.success()
				: result.correct === false
					? () => tiks.error()
					: null;

		if (!playSound || typeof window === 'undefined') {
			return;
		}

		initQuizSounds();

		if (!questionResultSoundPlayed) {
			questionResultSoundPlayed = true;
			window.setTimeout(playSound, FIRST_QUESTION_SOUND_DELAY_MS);
			return;
		}

		playSound();
	};
}
