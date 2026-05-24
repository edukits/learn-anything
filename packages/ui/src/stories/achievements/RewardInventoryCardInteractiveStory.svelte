<script lang="ts">
	import { RewardInventoryCard, type RewardInventoryCardData } from '../../lib';
	import { titleReward } from './fixtures';

	let reward = $state<RewardInventoryCardData>({ ...titleReward });

	function setEquipped(_reward: RewardInventoryCardData, nextRewardKey: string | null) {
		reward = {
			...reward,
			equipped: Boolean(nextRewardKey)
		};
	}
</script>

<RewardInventoryCard {reward} onEquip={setEquipped} />
