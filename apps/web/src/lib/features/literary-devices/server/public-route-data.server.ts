import { error, type RequestEvent } from '@sveltejs/kit';
import { findPublicTopicDiscoveryBySlug, getPublicLiteraryDevicesDiscovery } from './content.server';

type ParentData = {
	user: unknown;
};

export async function loadPublicLiteraryDevices(
	locals: RequestEvent['locals'],
	parentData: ParentData
) {
	const topic = await getPublicLiteraryDevicesDiscovery(locals.supabase);

	return {
		topic,
		isSignedIn: Boolean(parentData.user)
	};
}

export async function loadPublicTopicBySlug(
	locals: RequestEvent['locals'],
	parentData: ParentData,
	slug: string
) {
	const topic = await findPublicTopicDiscoveryBySlug(locals.supabase, slug);

	if (!topic) {
		error(404, 'Topic not found');
	}

	return {
		topic,
		isSignedIn: Boolean(parentData.user)
	};
}
