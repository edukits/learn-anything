<script lang="ts">
	import MultipleChoice from '../../lib/components/quiz/MultipleChoice.svelte';
	import MultipleSelect from '../../lib/components/quiz/MultipleSelect.svelte';
	import type { MultipleChoiceOptionData } from '../../lib/components/quiz/types';
	import type {
		MultipleChoiceQuestionResponse,
		MultipleSelectQuestionResponse,
		QuestionResponse
	} from './questionResponse';

	type QuestionResponseStoryProps = {
		response: QuestionResponse;
		name: string;
		legend: string;
		disabled?: boolean;
		submitted?: boolean;
		showSubmitButton?: boolean;
		submitLabel?: string;
	};

	let {
		response,
		name,
		legend,
		disabled = false,
		submitted = $bindable(false),
		showSubmitButton = false,
		submitLabel = 'Submit answer'
	}: QuestionResponseStoryProps = $props();

	function getOptionDisplayData(optionData: MultipleChoiceOptionData[]) {
		return optionData.map((option) => ({
			value: option.value,
			label: option.label,
			description: option.description,
			disabled: option.disabled
		}));
	}

	function getMultipleChoiceCorrectValue(choiceResponse: MultipleChoiceQuestionResponse) {
		return (
			choiceResponse.correctValue ??
			choiceResponse.options.find((option) => option.state === 'correct')?.value ??
			null
		);
	}

	function getMultipleSelectCorrectValues(selectResponse: MultipleSelectQuestionResponse) {
		if (selectResponse.correctValues !== undefined) {
			return selectResponse.correctValues;
		}

		const values = selectResponse.options
			.filter((option) => option.state === 'correct')
			.map((option) => option.value);

		return values.length > 0 ? values : null;
	}

	let multipleChoiceCorrectValue = $derived(
		response.type === 'multiple-select' ? null : getMultipleChoiceCorrectValue(response)
	);
	let multipleChoiceOptions = $derived(
		response.type === 'multiple-select'
			? []
			: multipleChoiceCorrectValue === null
				? response.options
				: getOptionDisplayData(response.options)
	);
	let multipleSelectCorrectValues = $derived(
		response.type === 'multiple-select' ? getMultipleSelectCorrectValues(response) : null
	);
	let multipleSelectOptions = $derived(
		response.type === 'multiple-select'
			? multipleSelectCorrectValues === null
				? response.options
				: getOptionDisplayData(response.options)
			: []
	);
</script>

{#if response.type === 'multiple-select'}
	<MultipleSelect
		value={response.value ?? []}
		bind:submitted
		options={multipleSelectOptions}
		{name}
		{disabled}
		correctValues={multipleSelectCorrectValues}
		{showSubmitButton}
		{submitLabel}
		{legend}
	/>
{:else}
	<MultipleChoice
		value={response.value ?? null}
		bind:submitted
		options={multipleChoiceOptions}
		{name}
		{disabled}
		interactionMode={response.interactionMode ?? 'submit'}
		correctValue={multipleChoiceCorrectValue}
		{showSubmitButton}
		{submitLabel}
		{legend}
	/>
{/if}
