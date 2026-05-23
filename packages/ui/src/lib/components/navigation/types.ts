import type { Component } from 'svelte';

export type NavSubject = {
	id: string;
	slug: string;
	name: string;
	summary: string;
};

export type NavUser = {
	email?: string;
};

export type NavTopic = {
	id: string;
	slug: string;
	name: string;
};

export type LearningNavItem = {
	id: string;
	label: string;
	href: string;
	icon: Component<{ size?: number | string; strokeWidth?: number | string }>;
	isActive: (pathname: string) => boolean;
};
