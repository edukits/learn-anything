import type { TopicDiscoveryMetadata } from '$lib/features/catalog';

export type MetricItem = {
	id: string;
	label: string;
	value: string | number;
};

export type SkillAccuracyItem = {
	skill_id: string;
	skill_label: string;
	attempted: number;
	correct: number;
};

export type Choice = {
	id: string;
	label: string;
};

export type SequenceItem = {
	id: string;
	label: string;
};

export type SkillVersion = {
	skill_id: string;
	version: number;
	name: string;
	summary: string;
};

export type LessonVersion = {
	lesson_id: string;
	version: number;
	title: string;
	summary: string;
	body_markdown: string;
	render_blocks: LessonRenderBlock[];
	skill_ids: string[];
	estimated_minutes: number;
};

export type LessonRenderBlock =
	| {
			type: 'markdown';
			markdown: string;
	  }
	| {
			type: 'interaction';
			slug: string;
			interaction_type: LessonInteractionType;
	  };

export type LessonInteractionType = 'concept_check' | 'scenario_choice' | 'mini_practice';

export type QuizVersion = {
	quiz_id: string;
	version: number;
	title: string;
	description: string;
	question_count: number;
};

export type LearningPathVersion = {
	learning_path_id: string;
	version: number;
	title: string;
	summary: string;
};

export type TopicModuleVersion = {
	topic_module_id: string;
	version: number;
	topic_area_id: string;
	slug: string;
	title: string;
	description: string;
	content_responsibility: string;
	ordering: number;
};

export type LearningPathItem =
	| {
			id: string;
			item_type: 'lesson';
			item_id: string;
			item_version: number;
			module_id: string | null;
			module_version: number | null;
			ordering: number;
			required: boolean;
			title: string;
			summary: string;
			estimated_minutes: number;
	  }
	| {
			id: string;
			item_type: 'quiz';
			item_id: string;
			item_version: number;
			module_id: string | null;
			module_version: number | null;
			ordering: number;
			required: boolean;
			title: string;
			description: string;
			question_count: number;
	  };

export type LearningPathItemState = 'locked' | 'active' | 'available' | 'completed' | 'review';

export type LearningPathItemProgress = LearningPathItem & {
	state: LearningPathItemState;
	latest_score: number | null;
	best_score: number | null;
	total_attempts: number;
};

export type LearningPathModule<TItem = LearningPathItem> = TopicModuleVersion & {
	items: TItem[];
};

export type QuestionPurpose = 'recognition' | 'application';

export type ResponseType =
	| 'multiple_choice'
	| 'multiple_select'
	| 'numeric'
	| 'sequencing'
	| 'short_answer';

export type QuizQuestionVersion = {
	question_id: string;
	version: number;
	skill_id: string;
	skill_label: string;
	question_purpose: QuestionPurpose;
	response_type: ResponseType;
	difficulty: 'easy' | 'medium' | 'hard';
	prompt: string;
	choices: Choice[];
	correct_choice_id: string;
	correct_choice_ids: string[];
	correct_numeric_value: number | null;
	correct_numeric_tolerance: number;
	sequence_items: SequenceItem[];
	accepted_answers: string[];
	explanation: string;
	ordering: number;
};

export type PracticeQuizQuestion = Omit<
	QuizQuestionVersion,
	| 'correct_choice_id'
	| 'correct_choice_ids'
	| 'correct_numeric_value'
	| 'correct_numeric_tolerance'
	| 'accepted_answers'
	| 'explanation'
>;

export type LessonInteraction = {
	slug: string;
	interaction_type: LessonInteractionType;
	title: string;
	questions: QuizQuestionVersion[];
	completed: boolean;
	submissionKey: string;
};

export type ContentRelease = {
	id: string;
	title: string;
	published_at: string;
	scope_id: string;
};

export type TopicContent = {
	release: ContentRelease;
	releaseItems: ReleaseItem[];
	path: LearningPathVersion;
	pathItems: LearningPathItem[];
	modules: TopicModuleVersion[];
	pathModules: LearningPathModule[];
	skills: SkillVersion[];
	topic: TopicDiscoveryMetadata;
};

export type ReleaseItem = {
	content_type: string;
	content_id: string;
	content_version: number;
};

export type ReviewSelectionReason =
	| 'missed_question'
	| 'low_skill_accuracy'
	| 'not_seen_recently'
	| 'due_spaced_repetition';

export type ReviewPracticeQuestion = QuizQuestionVersion & {
	reason_code: ReviewSelectionReason;
	reason_label: string;
};

export type ReviewSummary = {
	available: boolean;
	question_count: number;
	reason_label: string | null;
	reason_labels: string[];
};
