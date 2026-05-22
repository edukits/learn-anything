import { describe, expect, test } from 'vitest';
import { publicProfileInputSchema } from './profiles.server';

describe('publicProfileInputSchema', () => {
	test('uses neutral display names and permits safe public profile fields', () => {
		const parsed = publicProfileInputSchema.parse({
			display_name: 'Learner',
			avatar_url: 'https://example.com/avatar.png',
			equipped_title_reward_key: 'title_consistent_learner',
			bio: 'Practicing daily',
			leaderboard_opt_in: true
		});

		expect(parsed).toEqual({
			display_name: 'Learner',
			avatar_url: 'https://example.com/avatar.png',
			equipped_title_reward_key: 'title_consistent_learner',
			bio: 'Practicing daily',
			leaderboard_opt_in: true
		});
	});

	test('rejects non-http avatar URLs before they can be rendered publicly', () => {
		const parsed = publicProfileInputSchema.safeParse({
			display_name: 'Learner',
			avatar_url: 'javascript:alert(1)',
			equipped_title_reward_key: '',
			bio: '',
			leaderboard_opt_in: true
		});

		expect(parsed.success).toBe(false);
	});
});
