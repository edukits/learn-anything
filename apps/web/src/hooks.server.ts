import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { Handle } from '@sveltejs/kit';
import { getSupabasePublicEnv, getSupabaseServiceEnv } from '$lib/env';

export const handle: Handle = async ({ event, resolve }) => {
	const { url, key } = getSupabasePublicEnv();
	const { serviceKey } = getSupabaseServiceEnv();

	event.locals.supabase = createServerClient(url, key, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookiesToSet) => {
				for (const { name, value, options } of cookiesToSet) {
					event.cookies.set(name, value, { ...options, path: '/' });
				}
			}
		}
	});

	event.locals.supabaseService = createClient(url, serviceKey, {
		auth: {
			persistSession: false,
			autoRefreshToken: false
		}
	});

	event.locals.safeGetSession = async () => {
		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();

		if (error || !user) {
			return { session: null, user: null };
		}

		return { session: null, user };
	};

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};
