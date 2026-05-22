import type { PageServerLoad } from './$types';
import { listSubjects } from '$lib/features/catalog/server/index.server';

export const load: PageServerLoad = async ({ locals }) => {
	return {
		subjects: await listSubjects(locals.supabase)
	};
};
