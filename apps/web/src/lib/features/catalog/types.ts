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
	covered_skill_labels: string[];
};

export type SubjectSummary = {
	id: string;
	slug: string;
	name: string;
	summary: string;
	topicCount: number;
};

export type TopicEnrollmentStatus = 'active' | 'paused' | 'inactive';

export type TopicEnrollment = {
	user_id: string;
	topic_area_id: string;
	topic_slug: string;
	topic_name: string;
	status: TopicEnrollmentStatus;
	started_at: string;
	updated_at: string;
	topic: TopicDiscoveryMetadata | null;
};
