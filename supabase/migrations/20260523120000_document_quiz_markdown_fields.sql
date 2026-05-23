comment on column public.quiz_question_versions.prompt is
	'Learner-facing question prompt rendered as Markdown. Supports LaTeX math.';

comment on column public.quiz_question_versions.choices is
	'JSON array of choice objects. Choice labels are rendered as Markdown and support LaTeX math.';

comment on column public.quiz_question_versions.sequence_items is
	'JSON array of sequencing item objects. Item labels are rendered as Markdown and support LaTeX math.';

comment on column public.quiz_question_versions.explanation is
	'Answer explanation rendered as sanitized Markdown after submission. Supports LaTeX math.';
