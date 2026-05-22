import { existsSync, readFileSync } from 'node:fs';

export const allowedTargets = new Set(['local', 'staging', 'production']);

export function loadEnvFile(path, { override = false } = {}) {
	if (!existsSync(path)) {
		return;
	}

	for (const line of readFileSync(path, 'utf8').split('\n')) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) {
			continue;
		}
		const separatorIndex = trimmed.indexOf('=');
		if (separatorIndex === -1) {
			continue;
		}
		const key = trimmed.slice(0, separatorIndex);
		const value = trimmed.slice(separatorIndex + 1).replace(/^"|"$/g, '');
		if (override || process.env[key] === undefined) {
			process.env[key] = value;
		}
	}
}

export function parseReleaseArgs(args, { allowConfirmProduction = false } = {}) {
	let manifestPath = null;
	let target = null;
	let confirmProduction = false;

	for (let index = 0; index < args.length; index += 1) {
		const arg = args[index];

		if (arg === '--target') {
			target = args[index + 1] ?? null;
			index += 1;
			continue;
		}

		if (arg === '--confirm-production' && allowConfirmProduction) {
			confirmProduction = true;
			continue;
		}

		if (arg.startsWith('--')) {
			throw new Error(`Unknown option ${arg}`);
		}

		if (manifestPath) {
			throw new Error(`Unexpected extra positional argument ${arg}`);
		}

		manifestPath = arg;
	}

	if (!manifestPath) {
		throw new Error('Missing manifest path.');
	}

	if (!target || !allowedTargets.has(target)) {
		throw new Error('Missing or invalid --target. Expected local, staging, or production.');
	}

	return { manifestPath, target, confirmProduction };
}

export function loadReleaseEnvironment(target) {
	loadEnvFile('.env.local');
	loadEnvFile('.env');
	loadEnvFile(`.env.${target}`, { override: true });
}

export function getTargetSupabaseEnv(target, { anon = false } = {}) {
	const targetPrefix = target.toUpperCase();
	const url =
		process.env[`${targetPrefix}_SUPABASE_URL`] ??
		process.env[`${targetPrefix}_PUBLIC_SUPABASE_URL`] ??
		(target === 'local' ? (process.env.SUPABASE_URL ?? process.env.PUBLIC_SUPABASE_URL) : undefined);
	const key = anon
		? (process.env[`${targetPrefix}_SUPABASE_ANON_KEY`] ??
			process.env[`${targetPrefix}_PUBLIC_SUPABASE_ANON_KEY`] ??
			process.env[`${targetPrefix}_SUPABASE_PUBLISHABLE_KEY`] ??
			process.env[`${targetPrefix}_PUBLIC_SUPABASE_PUBLISHABLE_KEY`] ??
			(target === 'local'
				? (process.env.SUPABASE_ANON_KEY ??
					process.env.PUBLIC_SUPABASE_ANON_KEY ??
					process.env.SUPABASE_PUBLISHABLE_KEY ??
					process.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY)
				: undefined))
		: (process.env[`${targetPrefix}_SUPABASE_SERVICE_ROLE_KEY`] ??
			process.env[`${targetPrefix}_SUPABASE_SECRET_KEY`] ??
			(target === 'local'
				? (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY)
				: undefined));

	if (!url || !key) {
		throw new Error(
			`Missing ${targetPrefix}_SUPABASE_URL and ${anon ? 'anon/publishable key' : 'service-role key'} for ${target}.`
		);
	}

	return { url, key };
}
