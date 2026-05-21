<script lang="ts">
	import MultipleChoice from '../../lib/components/quiz/MultipleChoice.svelte';
	import MultipleSelect from '../../lib/components/quiz/MultipleSelect.svelte';
	import MathAnswer from '../../lib/components/quiz/MathAnswer.svelte';
	import NumericAnswer from '../../lib/components/quiz/NumericAnswer.svelte';
	import SequencingAnswer from '../../lib/components/quiz/SequencingAnswer.svelte';
	import ShortAnswer from '../../lib/components/quiz/ShortAnswer.svelte';
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
		response.type === 'multiple-select' ||
			response.type === 'math' ||
			response.type === 'numeric' ||
			response.type === 'sequencing' ||
			response.type === 'short-answer'
			? null
			: getMultipleChoiceCorrectValue(response)
	);
	let multipleChoiceOptions = $derived(
		response.type === 'multiple-select' ||
			response.type === 'math' ||
			response.type === 'numeric' ||
			response.type === 'sequencing' ||
			response.type === 'short-answer'
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

{#if response.type === 'numeric'}
	<NumericAnswer
		value={response.value ?? ''}
		unit={response.unit}
		bind:submitted
		{name}
		label={legend}
		placeholder={response.placeholder}
		{disabled}
		unitConfig={response.unitConfig}
		acceptedValues={response.acceptedValues ?? null}
		grader={response.grader}
		{showSubmitButton}
		{submitLabel}
		celebrations={response.celebrations ?? true}
	/>
{:else if response.type === 'math'}
	<MathAnswer
		value={response.value ?? ''}
		bind:submitted
		{name}
		label={legend}
		placeholder={response.placeholder}
		mathPlaceholder={response.mathPlaceholder}
		{disabled}
		template={response.template}
		acceptedValues={response.acceptedValues ?? null}
		matchMode={response.matchMode ?? 'normalized'}
		grader={response.grader}
		{showSubmitButton}
		{submitLabel}
		celebrations={response.celebrations ?? true}
	/>
{:else if response.type === 'short-answer'}
	<ShortAnswer
		value={response.value ?? ''}
		bind:submitted
		{name}
		label={legend}
		placeholder={response.placeholder}
		{disabled}
		acceptedAnswers={response.acceptedAnswers ?? null}
		matchMode={response.matchMode ?? 'normalized'}
		normalizer={response.normalizer}
		grader={response.grader}
		{showSubmitButton}
		{submitLabel}
		celebrations={response.celebrations ?? true}
	/>
{:else if response.type === 'sequencing'}
	<SequencingAnswer
		value={response.value ?? response.items.map((item) => item.value)}
		bind:submitted
		items={response.items}
		{name}
		{disabled}
		correctOrder={response.correctOrder ?? null}
		{showSubmitButton}
		{submitLabel}
		celebrations={response.celebrations ?? true}
		{legend}
	/>
{:else if response.type === 'multiple-select'}
	<MultipleSelect
		value={response.value ?? []}
		bind:submitted
		options={multipleSelectOptions}
		{name}
		{disabled}
		correctValues={multipleSelectCorrectValues}
		{showSubmitButton}
		{submitLabel}
		celebrations={response.celebrations ?? true}
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
		celebrations={response.celebrations ?? true}
		{legend}
	/>
{/if}
