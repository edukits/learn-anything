#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { loadAndValidateRun, writeValidationReport } from './content-run.mjs';
import { getTargetSupabaseEnv, loadReleaseEnvironment, parseReleaseArgs } from './release-env.mjs';

let manifestPath;
let target;
let confirmProduction;

try {
	({ manifestPath, target, confirmProduction } = parseReleaseArgs(process.argv.slice(2), {
		allowConfirmProduction: true
	}));
} catch (error) {
	console.error(error instanceof Error ? error.message : String(error));
	console.error(
		'Usage: node tools/content/import-run.mjs <manifest.json> --target <local|staging|production> [--confirm-production]'
	);
	process.exit(1);
}

loadReleaseEnvironment(target);

const run = await loadAndValidateRun(manifestPath);
const reportPath = await writeValidationReport(run);

if (!run.report.valid) {
	console.error('Refusing to import invalid content. Run content:validate for details.');
	process.exit(1);
}

if (target === 'production' && !confirmProduction) {
	console.error('Refusing production import without --confirm-production.');
	process.exit(1);
}

let env;
try {
	env = getTargetSupabaseEnv(target);
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

async function upsert(table, rows, onConflict) {
	if (!rows.length) {
		return;
	}

	const { error } = await supabase.from(table).upsert(rows, { onConflict });
	if (error) {
		throw new Error(`${table}: ${error.message}`);
	}
}

const {
	subject_areas: subjectAreas,
	topic_areas: topicAreas,
	skills,
	lessons,
	quizzes,
	questions,
	quiz_question_links: quizQuestionLinks,
	learning_paths: learningPaths,
	releases,
	topic_discovery_metadata: topicDiscoveryMetadata = []
} = run.artifacts;

const targetReleaseStatusById = new Map(releases.map((release) => [release.id, release.status]));

await upsert(
	'content_runs',
	[
		{
			id: run.manifest.run_id,
			title: run.manifest.title,
			subject_area_id: run.manifest.subject_area_id,
			topic_area_id: run.manifest.topic_area_id,
			authoring_mode: run.manifest.authoring_mode,
			source_refs: run.manifest.source_refs,
			manifest: run.manifest,
			schema_version: run.manifest.schema_version
		}
	],
	'id'
);

await upsert(
	'subject_areas',
	subjectAreas.map(({ id, slug }) => ({ id, slug })),
	'id'
);
await upsert(
	'subject_area_versions',
	subjectAreas.map(({ id, version, name, summary, content_run_id, source_refs, schema_version }) => ({
		subject_area_id: id,
		version,
		name,
		summary,
		content_run_id,
		source_refs,
		schema_version
	})),
	'subject_area_id,version'
);

await upsert(
	'topic_areas',
	topicAreas.map(({ id, subject_area_id, slug }) => ({ id, subject_area_id, slug })),
	'id'
);
await upsert(
	'topic_area_versions',
	topicAreas.map(({ id, version, subject_area_id, name, summary, content_run_id, source_refs, schema_version }) => ({
		topic_area_id: id,
		version,
		subject_area_id,
		name,
		summary,
		content_run_id,
		source_refs,
		schema_version
	})),
	'topic_area_id,version'
);

await upsert(
	'skills',
	skills.map(({ id, topic_area_id, slug }) => ({ id, topic_area_id, slug })),
	'id'
);
await upsert(
	'skill_versions',
	skills.map(({ id, version, topic_area_id, name, device, summary, content_run_id, source_refs, schema_version }) => ({
		skill_id: id,
		version,
		topic_area_id,
		name,
		device,
		summary,
		content_run_id,
		source_refs,
		schema_version
	})),
	'skill_id,version'
);

await upsert(
	'lessons',
	lessons.map(({ id, topic_area_id, slug }) => ({ id, topic_area_id, slug })),
	'id'
);
await upsert(
	'lesson_versions',
	lessons.map(({ id, version, topic_area_id, title, summary, body_markdown, skill_ids, estimated_minutes, sort_order, content_run_id, source_refs, schema_version }) => ({
		lesson_id: id,
		version,
		topic_area_id,
		title,
		summary,
		body_markdown,
		skill_ids,
		estimated_minutes,
		sort_order,
		content_run_id,
		source_refs,
		schema_version
	})),
	'lesson_id,version'
);

await upsert(
	'quizzes',
	quizzes.map(({ id, topic_area_id, slug }) => ({ id, topic_area_id, slug })),
	'id'
);
await upsert(
	'quiz_versions',
	quizzes.map(({ id, version, topic_area_id, title, description, kind, question_count, content_run_id, source_refs, schema_version }) => ({
		quiz_id: id,
		version,
		topic_area_id,
		title,
		description,
		kind,
		question_count,
		content_run_id,
		source_refs,
		schema_version
	})),
	'quiz_id,version'
);

await upsert(
	'quiz_questions',
	questions.map(({ id, topic_area_id }) => ({ id, topic_area_id })),
	'id'
);
await upsert(
	'quiz_question_versions',
	questions.map(({ id, version, topic_area_id, skill_id, device, question_type, difficulty, prompt, choices, correct_choice_id, explanation, content_run_id, source_refs, schema_version }) => ({
		question_id: id,
		version,
		topic_area_id,
		skill_id,
		device,
		question_type,
		difficulty,
		prompt,
		choices,
		correct_choice_id,
		explanation,
		content_run_id,
		source_refs,
		schema_version
	})),
	'question_id,version'
);

await upsert('quiz_question_to_quiz', quizQuestionLinks, 'quiz_id,quiz_version,question_id,question_version');

await upsert(
	'learning_paths',
	learningPaths.map(({ id, topic_area_id, slug }) => ({ id, topic_area_id, slug })),
	'id'
);
await upsert(
	'learning_path_versions',
	learningPaths.map(({ id, version, topic_area_id, title, summary, content_run_id, source_refs, schema_version }) => ({
		learning_path_id: id,
		version,
		topic_area_id,
		title,
		summary,
		content_run_id,
		source_refs,
		schema_version
	})),
	'learning_path_id,version'
);
await upsert(
	'learning_path_items',
	learningPaths.flatMap((path) =>
		path.items.map((item) => ({
			learning_path_id: path.id,
			learning_path_version: path.version,
			item_type: item.item_type,
			item_id: item.item_id,
			item_version: item.item_version,
			ordering: item.ordering,
			required: item.required
		}))
	),
	'learning_path_id,learning_path_version,item_type,item_id,item_version'
);

await upsert(
	'content_releases',
	releases.map(({ id, slug, title, scope_type, scope_id, status, content_run_id, manifest, published_at }) => ({
		id,
		slug,
		title,
		scope_type,
		scope_id,
		status: status === 'published' ? 'draft' : status,
		content_run_id,
		manifest,
		published_at: status === 'published' ? null : (published_at ?? null)
	})),
	'id'
);
await upsert(
	'content_release_bundles',
	releases.map(({ id, scope_type, scope_id, bundle_key }) => ({
		release_id: id,
		scope_type,
		scope_id,
		bundle_key
	})),
	'release_id,bundle_key'
);
await upsert(
	'content_release_items',
	releases.flatMap((release) =>
		release.items.map((item) => ({
			release_id: release.id,
			content_type: item.content_type,
			content_id: item.content_id,
			content_version: item.content_version
		}))
	),
	'release_id,content_type,content_id,content_version'
);

await upsert(
	'topic_discovery_metadata',
	topicDiscoveryMetadata.map(
		({
			topic_area_id,
			release_id,
			slug,
			name,
			public_summary,
			preview_markdown,
			app_path,
			level_label,
			estimated_minutes,
			lesson_count,
			quiz_count,
			covered_skill_ids,
			covered_devices
		}) => ({
			topic_area_id,
			release_id,
			slug,
			name,
			public_summary,
			preview_markdown,
			app_path,
			level_label,
			estimated_minutes,
			lesson_count,
			quiz_count,
			covered_skill_ids,
			covered_devices
		})
	),
	'release_id'
);

await upsert(
	'content_releases',
	releases
		.filter((release) => targetReleaseStatusById.get(release.id) === 'published')
		.map(({ id, slug, title, scope_type, scope_id, content_run_id, manifest, published_at }) => ({
			id,
			slug,
			title,
			scope_type,
			scope_id,
			status: 'published',
			content_run_id,
			manifest,
			published_at: published_at ?? new Date().toISOString()
		})),
	'id'
);

console.log(`Imported ${run.manifest.run_id} into ${target} (${env.url}). Validation report: ${reportPath}`);
