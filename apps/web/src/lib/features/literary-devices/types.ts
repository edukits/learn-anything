export type MetricItem = {
	id: string;
	label: string;
	value: string | number;
};

export type DeviceStatItem = {
	device: string;
	attempted: number;
	correct: number;
};

export type Choice = {
	id: string;
	label: string;
};

export type SkillVersion = {
	skill_id: string;
	version: number;
	name: string;
	device: string;
	summary: string;
};

export type LessonVersion = {
	lesson_id: string;
	version: number;
	title: string;
	summary: string;
	body_markdown: string;
	skill_ids: string[];
	estimated_minutes: number;
};

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

export type LiteraryDevicesPathItem =
	| {
			id: string;
			item_type: 'lesson';
			item_id: string;
			item_version: number;
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
			ordering: number;
			required: boolean;
			title: string;
			description: string;
			question_count: number;
	  };

export type LiteraryDevicesPathItemState = 'locked' | 'active' | 'available' | 'completed' | 'review';

export type LiteraryDevicesPathItemProgress = LiteraryDevicesPathItem & {
	state: LiteraryDevicesPathItemState;
	latest_score: number | null;
	best_score: number | null;
	total_attempts: number;
};

export type QuizQuestionVersion = {
	question_id: string;
	version: number;
	skill_id: string;
	device: string;
	question_type: 'recognition' | 'application';
	difficulty: 'easy' | 'medium' | 'hard';
	prompt: string;
	choices: Choice[];
	correct_choice_id: string;
	explanation: string;
	ordering: number;
};

export type PracticeQuizQuestion = Omit<QuizQuestionVersion, 'correct_choice_id' | 'explanation'>;

export type ContentRelease = {
	id: string;
	title: string;
	published_at: string;
	scope_id: string;
};

export type TopicDiscoveryMetadata = {
	topic_area_id: string;
	release_id: string;
	slug: string;
	name: string;
	public_summary: string;
	preview_markdown: string;
	app_path: string;
	level_label: string;
	estimated_minutes: number;
	lesson_count: number;
	quiz_count: number;
	covered_skill_ids: string[];
	covered_devices: string[];
};

export type EngagementSummary = {
	daily_xp_goal: number;
	xp_today: number;
	xp_total: number;
	current_streak: number;
	longest_streak: number;
	last_activity_date: string | null;
	daily_goal_percent: number;
	daily_goal_remaining: number;
};

export type ReviewSelectionReason = 'missed_question' | 'low_skill_accuracy' | 'not_seen_recently';

export type ReviewPracticeQuestion = PracticeQuizQuestion & {
	reason_code: ReviewSelectionReason;
	reason_label: string;
};

export type ReviewSummary = {
	available: boolean;
	question_count: number;
	reason_label: string | null;
	reason_labels: string[];
};
