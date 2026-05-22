#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { getTargetSupabaseEnv, loadReleaseEnvironment, parseReleaseArgs } from './release-env.mjs';

let target;
try {
	({ target } = parseReleaseArgs(['manifest.json', ...process.argv.slice(2)]));
} catch (error) {
	console.error(error instanceof Error ? error.message : String(error));
	console.error('Usage: node tools/content/verify-anon-boundary.mjs --target <local|staging|production>');
	process.exit(1);
}

loadReleaseEnvironment(target);

let env;
try {
	env = getTargetSupabaseEnv(target, { anon: true });
} catch (error) {
	console.error(error instanceof Error ? error.message : String(error));
	process.exit(1);
}

const supabase = createClient(env.url, env.key, {
	auth: {
		persistSession: false,
		autoRefreshToken: false
	}
});

async function readCount(table, select = '*') {
	const { data, error } = await supabase.from(table).select(select).limit(1);
	if (error) {
		throw new Error(`${table}: ${error.message}`);
	}
	return data?.length ?? 0;
}

const publicCount = await readCount('topic_discovery_metadata', 'topic_area_id,public_summary,preview_markdown');
if (publicCount < 1) {
	throw new Error('Expected anon to read public topic discovery metadata.');
}

const protectedTables = [
	['lesson_versions', 'lesson_id,body_markdown'],
	['quiz_question_versions', 'question_id,correct_choice_id,explanation'],
	['quiz_attempts', 'id,score'],
	['xp_events', 'id,points'],
	['content_release_items', 'release_id,content_type,content_id']
];

for (const [table, select] of protectedTables) {
	const count = await readCount(table, select);
	if (count > 0) {
		throw new Error(`Anon can read protected table ${table}.`);
	}
}

console.log('Anon boundary verified: public discovery is readable and protected practice data is hidden.');
