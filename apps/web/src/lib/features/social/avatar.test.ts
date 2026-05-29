import { describe, expect, test } from 'vitest';
import {
	buildNotionistsAvatarUrl,
	defaultAvatarOptions,
	normalizeAvatarOptions,
	publicAvatarOptionsSchema
} from './avatar';

describe('avatar helpers', () => {
	test('builds a stable DiceBear Notionists URL', () => {
		const url = new URL(
			buildNotionistsAvatarUrl(
				{
					...defaultAvatarOptions,
					seed: 'Learner 123',
					backgroundColor: 'b6e3f4',
					hair: 'variant07',
					eyes: 'variant05',
					brows: 'variant13',
					lips: 'variant30'
				},
				96
			)
		);

		expect(url.origin + url.pathname).toBe('https://api.dicebear.com/10.x/notionists/svg');
		expect(url.searchParams.get('seed')).toBe('Learner 123');
		expect(url.searchParams.get('size')).toBe('96');
		expect(url.searchParams.get('backgroundType')).toBe('solid');
		expect(url.searchParams.get('backgroundColor')).toBe('b6e3f4');
		expect(url.searchParams.get('hair')).toBe('variant07');
		expect(url.searchParams.get('eyes')).toBe('variant05');
		expect(url.searchParams.get('brows')).toBe('variant13');
		expect(url.searchParams.get('lips')).toBe('variant30');
	});

	test('uses probabilities for optional none values', () => {
		const url = new URL(buildNotionistsAvatarUrl(defaultAvatarOptions));

		expect(url.searchParams.get('beardProbability')).toBe('0');
		expect(url.searchParams.get('glassesProbability')).toBe('0');
		expect(url.searchParams.get('bodyIconProbability')).toBe('0');
		expect(url.searchParams.get('gestureProbability')).toBe('0');
		expect(url.searchParams.has('beard')).toBe(false);
		expect(url.searchParams.has('glasses')).toBe(false);
	});

	test('uses probabilities and option values for enabled optional parts', () => {
		const url = new URL(
			buildNotionistsAvatarUrl({
				...defaultAvatarOptions,
				beard: 'variant04',
				glasses: 'variant11',
				bodyIcon: 'galaxy',
				gesture: 'waveLongArm'
			})
		);

		expect(url.searchParams.get('beard')).toBe('variant04');
		expect(url.searchParams.get('beardProbability')).toBe('100');
		expect(url.searchParams.get('glasses')).toBe('variant11');
		expect(url.searchParams.get('glassesProbability')).toBe('100');
		expect(url.searchParams.get('bodyIcon')).toBe('galaxy');
		expect(url.searchParams.get('bodyIconProbability')).toBe('100');
		expect(url.searchParams.get('gesture')).toBe('waveLongArm');
		expect(url.searchParams.get('gestureProbability')).toBe('100');
	});

	test('normalizes invalid options to a valid fallback', () => {
		const options = normalizeAvatarOptions({ style: 'bottts' }, 'Fallback Learner');

		expect(publicAvatarOptionsSchema.safeParse(options).success).toBe(true);
		expect(options.seed).toBe('Fallback Learner');
		expect(options.style).toBe('notionists');
	});
});
