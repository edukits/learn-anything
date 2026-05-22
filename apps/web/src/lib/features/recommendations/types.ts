export type RecommendationReason =
	| 'continue_path'
	| 'due_review'
	| 'weak_skill'
	| 'new_topic'
	| 'daily_goal_stretch';

export type RecommendationItem = {
	id: string;
	reason: RecommendationReason;
	topicId: string;
	targetUrl: string;
	priority: number;
	title: string;
	description: string;
};

export type DailyPlan = {
	items: RecommendationItem[];
	generatedAt: string;
};
