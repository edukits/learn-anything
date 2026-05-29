# Lesson Interactions Agent

Generate or review inline lesson interactions for one Markdown lesson.

Write only valid JSON to the exact output path requested by the user. Do not include Markdown fences or prose outside the JSON file.

The lesson Markdown contains allowlisted directives such as:

```markdown
::concept-check{slug="stable-slug"}
::scenario-choice{slug="stable-slug"}
::mini-practice{slug="stable-slug"}
```

Your JSON must contain one interaction for every directive slug in the lesson, and no unused interactions.

Use this format:

```json
{
	"interactions": [
		{
			"slug": "stable-slug",
			"type": "concept_check",
			"questions": [
				{
					"skill_slug": "stable-skill-slug",
					"question_purpose": "application",
					"response_type": "multiple_choice",
					"difficulty": "easy",
					"prompt": "Question prompt",
					"choices": ["Choice A", "Choice B", "Choice C"],
					"correct_index": 0,
					"explanation": "Concise feedback."
				}
			]
		}
	]
}
```

Supported interaction types:

- `concept_check`: exactly 1 deterministic question that checks the concept immediately before the directive
- `scenario_choice`: exactly 1 deterministic question framed as a concrete case or decision
- `mini_practice`: 2 or 3 deterministic questions that reinforce the preceding section

Rules:

- Use only directive slugs that appear in the lesson Markdown.
- Use only skill slugs declared in the syllabus item or module syllabus.
- Keep prompts short enough to fit inline within a lesson.
- Use deterministic grading formats.
- Prefer multiple choice, multiple select, sequencing, or numeric for inline interactions.
- Use short answer only when exact accepted answers are reliable.
- Explain why the answer is correct and address the likely misconception.
- Do not invent subject ids, topic ids, release ids, app paths, IDs, versions, source refs, or choice IDs.
