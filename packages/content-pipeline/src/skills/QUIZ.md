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
			"question_type": "recognition",
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

Supported `question_type` values:

- `recognition`: multiple choice recognition
- `application`: multiple choice application
- `multiple_select`
- `numeric_answer`
- `sequencing`
- `short_answer`

Rules:

- Match the requested `question_count` when present.
- Every question needs `difficulty`, `prompt`, and `explanation`.
- Multiple-choice questions need `choices` and `correct_choice_id`.
- Multiple-select questions need `choices` and `correct_choice_ids`.
- Numeric questions need `correct_numeric_answer`.
- Sequencing questions need `sequence_items` in correct order.
- Short-answer questions need `accepted_answers` for deterministic grading.
- Do not invent subject ids, topic ids, release ids, or app paths.
