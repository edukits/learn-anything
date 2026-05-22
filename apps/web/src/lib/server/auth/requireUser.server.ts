import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

export async function requireUser(locals: RequestEvent['locals'], redirectTo = '/sign-in') {
	const { user } = await locals.safeGetSession();

	if (!user) {
		redirect(303, redirectTo);
	}

	return user;
}
