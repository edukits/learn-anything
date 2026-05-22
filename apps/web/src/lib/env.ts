import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

export function getSupabasePublicEnv() {
	const url = publicEnv.PUBLIC_SUPABASE_URL;
	const key = publicEnv.PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? publicEnv.PUBLIC_SUPABASE_ANON_KEY;

	if (!url || !key) {
		throw new Error('Missing PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_PUBLISHABLE_KEY/PUBLIC_SUPABASE_ANON_KEY.');
	}

	return { url, key };
}

export function getSupabaseServiceEnv() {
	const { url } = getSupabasePublicEnv();
	const serviceKey = privateEnv.SUPABASE_SERVICE_ROLE_KEY ?? privateEnv.SUPABASE_SECRET_KEY;

	if (!serviceKey) {
		throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SECRET_KEY for server-side writes.');
	}

	return { url, serviceKey };
}
