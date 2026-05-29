# Shared Question Context

Use this context for every generated or reviewed quiz question, including standalone quizzes and inline lesson interactions.

Supported `question_purpose` values:

- `recognition`: identify, recall, or classify a concept
- `application`: use a concept to solve, explain, order, calculate, or decide

Supported `response_type` values:

- `multiple_choice`
- `multiple_select`
- `numeric`
- `sequencing`
- `short_answer`
- `math`
- `image_choice`

Every question needs `skill_slug`, `question_purpose`, `response_type`, `difficulty`, `prompt`, and `explanation`.

Rendered text fields support Markdown and LaTeX math: `prompt`, multiple-choice `choices`, `sequence_items`, image-choice `label`, and `explanation`. Use `$...$` or `\(...\)` for inline math; use `$$...$$` or `\[...\]` for display math. Raw HTML is not supported.

Do not use Markdown or LaTeX in skill slugs, answer-key fields, accepted answers, image URLs, alt text, or other metadata.

## Response Formats

- `multiple_choice`: include `choices` as an array of strings and `correct_index` as the zero-based index of the correct choice.

```json
{
	"response_type": "multiple_choice",
	"choices": ["Choice A", "Choice B"],
	"correct_index": 0
}
```

- `multiple_select`: include `choices` as an array of strings and `correct_indices` as zero-based indexes of all correct choices.

```json
{
	"response_type": "multiple_select",
	"choices": ["Choice A", "Choice B", "Choice C"],
	"correct_indices": [0, 1]
}
```

- `numeric`: include `correct_numeric_answer` as `{ "value": number, "tolerance": nonnegative_number }`. Tolerance is absolute.

```json
{
	"response_type": "numeric",
	"correct_numeric_answer": { "value": 12, "tolerance": 0 }
}
```

- `sequencing`: include `sequence_items` as an array of strings in the correct order.

```json
{
	"response_type": "sequencing",
	"sequence_items": ["First step", "Second step"]
}
```

- `short_answer`: include `accepted_answers` with at least one exact accepted answer string. Grading normalizes case and repeated whitespace.

```json
{
	"response_type": "short_answer",
	"accepted_answers": ["accepted answer"]
}
```

- `math`: include `accepted_math_answers` with at least one deterministic accepted answer. Use `latex` for free-entry math answers and `prompts` for template placeholders. Optional `math_template` pre-fills a MathLive template; optional `math_match_mode` is `normalized` by default and may be `exact`.

```json
{
	"response_type": "math",
	"math_template": "\\begin{bmatrix}\\placeholder[x]{}\\\\\\placeholder[y]{}\\end{bmatrix}",
	"accepted_math_answers": [{ "prompts": { "x": "3", "y": "-2" } }]
}
```

- `image_choice`: include `choices` as image option objects with `image_src`, `image_alt`, optional Markdown `label`, and `correct_index`. Use existing accessible image URLs or storage paths only; do not invent unavailable images.

```json
{
	"response_type": "image_choice",
	"choices": [
		{ "label": "Triangle", "image_src": "/images/triangle.png", "image_alt": "A triangle" },
		{ "label": "Square", "image_src": "/images/square.png", "image_alt": "A square" }
	],
	"correct_index": 0
}
```

Use only the answer-key fields required by the selected `response_type`. `grading_rubric` is optional reviewer guidance only; deterministic grading fields are still required.

## Question Quality

Each question should test understanding, not just recognition of wording from the lesson.

Prefer questions that ask the learner to:

- distinguish similar concepts
- apply a rule or idea to a concrete case
- identify a misconception
- choose the best explanation
- sequence a process
- interpret a result
- transfer a concept to a slightly new situation

Avoid questions that are answerable only by superficial keyword matching unless the skill is specifically basic recognition. Prompts should be concise, unambiguous, and self-contained.

## Difficulty Guidelines

Use difficulty consistently.

`easy` questions should assess one idea directly, with minimal reading burden and no traps.

`medium` questions should require applying a concept, distinguishing between plausible options, or using two pieces of information together.

`hard` questions should require synthesis, transfer, multi-step reasoning, or careful avoidance of a common misconception.

Do not make a question hard by using obscure wording, excessive reading load, irrelevant detail, or trick phrasing.

## Distractor Design

For multiple choice, multiple select, and image choice questions, incorrect choices should be plausible and educational.

Good distractors usually represent:

- common misconceptions
- nearby but incorrect concepts
- reversed cause and effect
- overgeneralizations
- partially correct answers that miss a condition
- mistakes the learner is likely to make

Avoid obviously wrong distractors, joke answers, duplicate choices, and choices that are correct under a reasonable interpretation.

## Choice Ordering

The app shuffles choice options for multiple-choice, multiple-select, and image-choice questions by default. Omit ordering metadata for ordinary choices.

Use `choice_order_strategy: "fixed"` only when all choices require authored order, such as sequences, earlier/later comparisons, or labels like "the first statement". Use `fixed_choice_indices` for position-dependent choices such as "All of the above", "None of the above", "Both A and B", summaries, or choices that refer to other choices; put them last when possible.

## Explanations

Every explanation should teach, not merely reveal the answer.

A good explanation should:

- state why the correct answer is correct
- address the key misconception or distinction
- be concise
- use terminology from the source material
- avoid introducing unsupported new concepts

For numeric and math questions, include the calculation or reasoning needed to reach the answer. For sequencing questions, explain why the order matters.

## Response Type Selection

Choose the response type that best matches the skill being assessed.

Use `multiple_choice` for concept checks, classification, choosing the best explanation, or identifying one correct option.

Use `multiple_select` only when more than one answer is genuinely correct and the learner should evaluate each option independently.

Use `numeric` for calculations or quantitative interpretation with a clearly defined numeric answer.

Use `math` for algebraic expressions, equations, vectors, formulas, or other answers where learner input should be LaTeX rather than plain numeric text.

Use `sequencing` for ordered processes, workflows, timelines, rankings, or step-by-step reasoning.

Use `short_answer` only when exact-answer grading is reliable. Avoid short-answer questions when many phrasings could be correct unless all major acceptable variants can be listed in `accepted_answers`.

Use `image_choice` only when the visual itself is necessary to assess the skill and each image has meaningful alt text.
