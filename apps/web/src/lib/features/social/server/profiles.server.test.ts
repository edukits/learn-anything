import { describe, expect, test } from 'vitest';
import { createDefaultAvatarOptions, defaultAvatarOptions } from '../avatar';
import { publicProfileInputSchema } from './profiles.server';

describe('publicProfileInputSchema', () => {
	test('uses neutral display names and permits curated public profile fields', () => {
		const parsed = publicProfileInputSchema.parse({
			display_name: 'Learner',
			avatar_options: {
				...defaultAvatarOptions,
				seed: 'Learner 1234',
				backgroundColor: 'b6e3f4',
				hair: 'variant04',
				glasses: 'variant07'
			},
			equipped_title_reward_key: 'title_consistent_learner',
			bio: 'Practicing daily',
			leaderboard_opt_in: true
		});

		expect(parsed).toEqual({
			display_name: 'Learner',
			avatar_options: {
				...defaultAvatarOptions,
				seed: 'Learner 1234',
				backgroundColor: 'b6e3f4',
				hair: 'variant04',
				glasses: 'variant07'
			},
			equipped_title_reward_key: 'title_consistent_learner',
			bio: 'Practicing daily',
			leaderboard_opt_in: true
		});
	});

	test('rejects arbitrary avatar URLs before they can be rendered publicly', () => {
		const parsed = publicProfileInputSchema.safeParse({
			display_name: 'Learner',
			avatar_url: 'javascript:alert(1)',
			equipped_title_reward_key: '',
			bio: '',
			leaderboard_opt_in: true
		});

		expect(parsed.success).toBe(false);
	});

	test('rejects avatar options outside the curated set', () => {
		const parsed = publicProfileInputSchema.safeParse({
			display_name: 'Learner',
			avatar_options: {
				...defaultAvatarOptions,
				hair: 'variant99'
			},
			equipped_title_reward_key: '',
			bio: '',
			leaderboard_opt_in: true
		});

		expect(parsed.success).toBe(false);
	});

	test('creates deterministic default avatar options for a profile', () => {
		const options = createDefaultAvatarOptions('12345678-1234-1234-1234-123456789abc', 'Ada');

		expect(options).toEqual(createDefaultAvatarOptions('12345678-1234-1234-1234-123456789abc', 'Ada'));
		expect(options.style).toBe('notionists');
		expect(options.version).toBe(1);
		expect(options.seed).toBe('Ada 12345678');
	});
});
