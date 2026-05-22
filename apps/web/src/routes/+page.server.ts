import type { PageServerLoad } from './$types';
import { loadPublicLiteraryDevices } from '$lib/features/literary-devices/server/public-route-data.server';

export const load: PageServerLoad = async ({ locals, parent }) => {
	return loadPublicLiteraryDevices(locals, await parent());
};
