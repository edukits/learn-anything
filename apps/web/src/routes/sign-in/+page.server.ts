import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { noindexSeo } from '$lib/seo';

export const load: PageServerLoad = async ({ locals, url }) => {
	const { user } = await locals.safeGetSession();

	if (user) {
		throw redirect(303, '/app');
	}

	return {
		seo: noindexSeo('Sign in', url)
	};
};

export const actions: Actions = {
	default: async ({ request, locals, url }) => {
		const formData = await request.formData();
		const email = String(formData.get('email') ?? '')
			.trim()
			.toLowerCase();

		if (!email || !email.includes('@')) {
			return fail(400, { email, error: 'Enter a valid email address.' });
		}

		const { error } = await locals.supabase.auth.signInWithOtp({
			email,
			options: {
				emailRedirectTo: `${url.origin}/auth/callback`
			}
		});

		if (error) {
			return fail(400, { email, error: error.message });
		}

		return { email, sent: true };
	}
};
