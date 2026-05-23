# Quiz Agent

Generate one quiz from the provided syllabus item.

Write only valid JSON to the exact output path requested by the user. Do not include Markdown fences or prose outside the JSON file.

Use source material for factual grounding. Prefer deterministic grading formats unless the syllabus explicitly calls for another interaction.

Use this format:

```json
{
	"type": "quiz",
	"slug": "stable-short-slug",
	"title": "Quiz title",
	"description": "One sentence quiz description",
	"kind": "practice",
	"skills": [
		{
			"slug": "stable-skill-slug",
			"name": "Skill name",
			"device": "Short display name",
			"summary": "What this skill measures"
		}
	],
	"questions": [
		{
			"skill": {
				"slug": "stable-skill-slug",
				"name": "Skill name",
				"device": "Short display name",
				"summary": "What this skill measures"
			},
			"device": "Short display name",
			"question_purpose": "recognition",
			"response_type": "multiple_choice",
			"difficulty": "easy",
			"prompt": "Question prompt",
			"choices": [
				{ "id": "a", "label": "Choice A" },
				{ "id": "b", "label": "Choice B" },
				{ "id": "c", "label": "Choice C" },
				{ "id": "d", "label": "Choice D" }
			],
			"correct_choice_id": "a",
			"explanation": "Why the answer is correct."
		}
	]
}
```

Supported `question_purpose` values:

- `recognition`: identify, recall, or classify a concept
- `application`: use a concept to solve, explain, order, calculate, or decide

Supported `response_type` values:

- `multiple_choice`
- `multiple_select`
- `numeric`
- `sequencing`
- `short_answer`

Rules:

- Match the requested `question_count` when present.
- Every question needs `difficulty`, `prompt`, and `explanation`.
- Multiple-choice responses need `choices` and `correct_choice_id`.
- Multiple-select responses need `choices` and `correct_choice_ids`.
- Numeric responses need `correct_numeric_answer`.
- Sequencing responses need `sequence_items` in correct order.
- Short-answer responses need `accepted_answers` for deterministic grading.
- Do not invent subject ids, topic ids, release ids, or app paths.
