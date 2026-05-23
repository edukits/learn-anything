import { describe, expect, test } from 'vitest';
import {
	isFocusedQuizPathname,
	isFocusedQuizRouteId,
	resolveFocusedQuizExitHref
} from './focusedQuizRoute';

const origin = 'https://example.test';

describe('focused quiz routes', () => {
	test('matches all focused quiz route ids', () => {
		expect(isFocusedQuizRouteId('/app/topics/[topic]/quiz/[quizId]')).toBe(true);
		expect(isFocusedQuizRouteId('/app/topics/[topic]/quiz/results')).toBe(true);
		expect(isFocusedQuizRouteId('/app/topics/[topic]/review')).toBe(true);
		expect(isFocusedQuizRouteId('/app/topics/[topic]/diagnostic')).toBe(true);
		expect(isFocusedQuizRouteId('/app/topics/[topic]')).toBe(false);
	});

	test('matches focused quiz pathnames with concrete topic slugs', () => {
		expect(isFocusedQuizPathname('/app/topics/linear-equations/quiz/quiz_linear')).toBe(true);
		expect(isFocusedQuizPathname('/app/topics/linear-equations/quiz/results')).toBe(true);
		expect(isFocusedQuizPathname('/app/topics/linear-equations/review')).toBe(true);
		expect(isFocusedQuizPathname('/app/topics/linear-equations/diagnostic')).toBe(true);
		expect(isFocusedQuizPathname('/app/topics/linear-equations')).toBe(false);
	});

	test('prefers the remembered non-focused page over a focused referrer', () => {
		expect(
			resolveFocusedQuizExitHref({
				exitHref: '/app/topics/linear-equations',
				rememberedHref: '/app/daily-plan',
				referrer: `${origin}/app/topics/linear-equations/quiz/quiz_linear`,
				origin
			})
		).toBe('/app/daily-plan');
	});

	test('does not exit quiz results back to a quiz page', () => {
		expect(
			resolveFocusedQuizExitHref({
				exitHref: '/app/topics/linear-equations',
				referrer: `${origin}/app/topics/linear-equations/quiz/quiz_linear`,
				origin
			})
		).toBe('/app/topics/linear-equations');
	});

	test('uses a same-origin non-focused referrer when no remembered page exists', () => {
		expect(
			resolveFocusedQuizExitHref({
				exitHref: '/app/topics/linear-equations',
				referrer: `${origin}/app/progress?range=week`,
				origin
			})
		).toBe('/app/progress?range=week');
	});
});
