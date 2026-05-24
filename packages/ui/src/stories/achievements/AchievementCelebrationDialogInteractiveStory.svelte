<script lang="ts">
	import { AchievementCelebrationDialog, Button, type AchievementCelebrationItem } from '../../lib';
	import { celebrationAchievements } from './fixtures';

	let open = $state(true);
	let dismissed = $state<AchievementCelebrationItem[]>([]);

	function dismiss(achievements: AchievementCelebrationItem[]) {
		dismissed = achievements;
		open = false;
	}

	function replay() {
		dismissed = [];
		open = true;
	}
</script>

<div class="story-shell">
	<Button type="button" size="sm" variant="secondary" label="Replay dialog" onclick={replay} />
	{#if dismissed.length}
		<p>{dismissed.length} achievement{dismissed.length === 1 ? '' : 's'} dismissed</p>
	{/if}
</div>

<AchievementCelebrationDialog bind:open achievements={celebrationAchievements} onDismiss={dismiss} />

<style>
	.story-shell {
		align-items: center;
		display: flex;
		gap: 12px;
	}

	.story-shell p {
		color: var(--color-text-muted);
		font-size: 0.86rem;
		font-weight: 650;
		margin: 0;
	}
</style>
