#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { access, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { getImportBlockers, loadAndValidateRun, writeValidationReport } from './content-run.mjs';
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

const run = await loadAndValidateRun(manifestPath, { storageClient: supabase });
let reportPath = await writeValidationReport(run);
let diffReport = null;

if (!run.report.valid) {
	console.error('Refusing to import invalid content. Run content:validate for details.');
	process.exit(1);
}

const importBlockers = getImportBlockers(run);
if (importBlockers.length) {
	console.error(
		'Refusing to import content that validates for review but is not app/database importable yet.'
	);
	for (const blocker of importBlockers) {
		console.error(`- ${blocker}`);
	}
	process.exit(1);
}

const diffReportPath = resolve(dirname(run.manifestPath), 'diff-report.json');
try {
	await access(diffReportPath);
	diffReport = JSON.parse(await readFile(diffReportPath, 'utf8'));
	if (diffReport.candidate_run_id !== run.manifest.run_id || diffReport.valid !== true) {
		throw new Error(`Diff report does not match ${run.manifest.run_id}.`);
	}
	run.report.diff_summary = diffReport.summary;
	run.report.diff_base_run_id = diffReport.base_run_id;
	reportPath = await writeValidationReport(run);
} catch (error) {
	console.error(
		`Refusing to import without a valid diff report at ${diffReportPath}. Run tools/content/diff-run.mjs first.`
	);
	if (error instanceof Error) {
		console.error(error.message);
	}
	process.exit(1);
}

if (target === 'production' && !confirmProduction) {
	console.error('Refusing production import without --confirm-production.');
	process.exit(1);
}

if (target === 'production') {
	for (const release of run.artifacts.releases ?? []) {
		if (release.status !== 'published') {
			continue;
		}

		if (release.manifest?.review_status !== 'approved') {
			console.error(
				`Refusing production import for ${release.id}: release manifest review_status must be approved.`
			);
			process.exit(1);
		}

		const staging = release.manifest?.staging;
		if (!staging?.imported_at || !staging?.smoke_tested_at) {
			console.error(
				`Refusing production import for ${release.id}: staging import and smoke test metadata are required.`
			);
			process.exit(1);
		}

		if (!release.manifest?.rollback?.action) {
			console.error(
				`Refusing production import for ${release.id}: rollback action metadata is required.`
			);
			process.exit(1);
		}
	}
}

async function upsert(table, rows, onConflict) {
	if (!rows.length) {
		return;
	}

	const { error } = await supabase.from(table).upsert(rows, { onConflict });
	if (error) {
		throw new Error(`${table}: ${error.message}`);
	}
}

function reviewStatusForRelease(release) {
	if (release.status === 'retired') {
		return 'rolled_back';
	}
	if (release.status === 'published' && release.manifest?.review_status === 'approved') {
		return target === 'production' ? 'approved' : 'published';
	}
	if (release.manifest?.review_status === 'rejected') {
		return 'rejected';
	}
	return 'pending';
}

function releaseReviewRow(release) {
	const staging = release.manifest?.staging ?? {};
	return {
		release_id: release.id,
		review_status: reviewStatusForRelease(release),
		validation_report: run.report,
		diff_report: diffReport ?? {},
		validation_passed: run.report.valid === true,
		staging_imported_at: staging.imported_at ?? null,
		smoke_tested_at: staging.smoke_tested_at ?? null,
		published_at:
			release.status === 'published' && target !== 'production'
				? (release.published_at ?? new Date().toISOString())
				: null
	};
}

const {
	subject_areas: subjectAreas,
	topic_areas: topicAreas,
	topic_modules: topicModules = [],
	skills,
	lessons,
	quizzes,
	questions,
	quiz_question_links: quizQuestionLinks,
	lesson_interaction_links: lessonInteractionLinks = [],
	learning_paths: learningPaths,
	releases,
	topic_discovery_metadata: topicDiscoveryMetadata = [],
	media_assets: mediaAssets = []
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
	subjectAreas.map(
		({ id, version, name, summary, content_run_id, source_refs, schema_version }) => ({
			subject_area_id: id,
			version,
			name,
			summary,
			content_run_id,
			source_refs,
			schema_version
		})
	),
	'subject_area_id,version'
);

await upsert(
	'topic_areas',
	topicAreas.map(({ id, subject_area_id, slug }) => ({ id, subject_area_id, slug })),
	'id'
);
await upsert(
	'topic_area_versions',
	topicAreas.map(
		({
			id,
			version,
			subject_area_id,
			name,
			summary,
			content_run_id,
			source_refs,
			schema_version
		}) => ({
			topic_area_id: id,
			version,
			subject_area_id,
			name,
			summary,
			content_run_id,
			source_refs,
			schema_version
		})
	),
	'topic_area_id,version'
);

await upsert(
	'topic_modules',
	topicModules.map(({ id, topic_area_id, slug }) => ({ id, topic_area_id, slug })),
	'id'
);
await upsert(
	'topic_module_versions',
	topicModules.map(
		({
			id,
			version,
			topic_area_id,
			title,
			description,
			content_responsibility,
			ordering,
			content_run_id,
			source_refs,
			schema_version
		}) => ({
			topic_module_id: id,
			version,
			topic_area_id,
			title,
			description,
			content_responsibility,
			ordering,
			content_run_id,
			source_refs,
			schema_version
		})
	),
	'topic_module_id,version'
);

await upsert(
	'skills',
	skills.map(({ id, topic_area_id, slug }) => ({ id, topic_area_id, slug })),
	'id'
);
await upsert(
	'skill_versions',
	skills.map(
		({
			id,
			version,
			topic_area_id,
			name,
			device,
			summary,
			content_run_id,
			source_refs,
			schema_version
		}) => ({
			skill_id: id,
			version,
			topic_area_id,
			name,
			device,
			summary,
			content_run_id,
			source_refs,
			schema_version
		})
	),
	'skill_id,version'
);

await upsert(
	'lessons',
	lessons.map(({ id, topic_area_id, slug }) => ({ id, topic_area_id, slug })),
	'id'
);
await upsert(
	'lesson_versions',
	lessons.map(
		({
			id,
			version,
			topic_area_id,
			title,
			summary,
			body_markdown,
			render_blocks,
			skill_ids,
			estimated_minutes,
			sort_order,
			content_run_id,
			source_refs,
			schema_version
		}) => ({
			lesson_id: id,
			version,
			topic_area_id,
			title,
			summary,
			body_markdown,
			render_blocks,
			skill_ids,
			estimated_minutes,
			sort_order,
			content_run_id,
			source_refs,
			schema_version
		})
	),
	'lesson_id,version'
);

await upsert(
	'quizzes',
	quizzes.map(({ id, topic_area_id, slug }) => ({ id, topic_area_id, slug })),
	'id'
);
await upsert(
	'quiz_versions',
	quizzes.map(
		({
			id,
			version,
			topic_area_id,
			title,
			description,
			kind,
			question_count,
			content_run_id,
			source_refs,
			schema_version
		}) => ({
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
		})
	),
	'quiz_id,version'
);

await upsert(
	'quiz_questions',
	questions.map(({ id, topic_area_id }) => ({ id, topic_area_id })),
	'id'
);
await upsert(
	'quiz_question_versions',
	questions.map(
		({
			id,
			version,
			topic_area_id,
			skill_id,
			device,
			question_purpose,
			response_type,
			difficulty,
			prompt,
			choices,
			correct_choice_id,
			correct_choice_ids,
			correct_numeric_answer,
			sequence_items,
			accepted_answers,
			grading_rubric,
			explanation,
			content_run_id,
			source_refs,
			schema_version
		}) => ({
			question_id: id,
			version,
			topic_area_id,
			skill_id,
			device,
			question_purpose,
			response_type,
			difficulty,
			prompt,
			choices: choices ?? [],
			correct_choice_id: correct_choice_id ?? '__rich_question__',
			correct_choice_ids: correct_choice_ids ?? [],
			correct_numeric_value: correct_numeric_answer?.value ?? null,
			correct_numeric_tolerance: correct_numeric_answer?.tolerance ?? 0,
			sequence_items: sequence_items ?? [],
			accepted_answers: accepted_answers ?? [],
			grading_rubric: grading_rubric ?? null,
			explanation,
			content_run_id,
			source_refs,
			schema_version
		})
	),
	'question_id,version'
);

await upsert(
	'quiz_question_to_quiz',
	quizQuestionLinks,
	'quiz_id,quiz_version,question_id,question_version'
);

await upsert(
	'lesson_interaction_links',
	lessonInteractionLinks,
	'lesson_id,lesson_version,interaction_slug,ordering'
);

await upsert(
	'learning_paths',
	learningPaths.map(({ id, topic_area_id, slug }) => ({ id, topic_area_id, slug })),
	'id'
);
await upsert(
	'learning_path_versions',
	learningPaths.map(
		({
			id,
			version,
			topic_area_id,
			title,
			summary,
			content_run_id,
			source_refs,
			schema_version
		}) => ({
			learning_path_id: id,
			version,
			topic_area_id,
			title,
			summary,
			content_run_id,
			source_refs,
			schema_version
		})
	),
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
			module_id: item.module_id ?? null,
			module_version: item.module_version ?? null,
			ordering: item.ordering,
			required: item.required
		}))
	),
	'learning_path_id,learning_path_version,item_type,item_id,item_version'
);

await upsert(
	'media_assets',
	mediaAssets.map(({ id }) => ({ id })),
	'id'
);
await upsert(
	'media_asset_versions',
	mediaAssets.map(
		({
			id,
			version,
			asset_type,
			storage_bucket,
			storage_path,
			mime_type,
			alt_text,
			content_run_id,
			source_refs,
			schema_version
		}) => ({
			media_asset_id: id,
			version,
			asset_type,
			storage_bucket,
			storage_path,
			mime_type,
			alt_text: alt_text ?? null,
			content_run_id,
			source_refs,
			schema_version
		})
	),
	'media_asset_id,version'
);

await upsert(
	'content_releases',
	releases.map(
		({
			id,
			slug,
			title,
			scope_type,
			scope_id,
			status,
			content_run_id,
			manifest,
			published_at
		}) => ({
			id,
			slug,
			title,
			scope_type,
			scope_id,
			status: status === 'published' ? 'draft' : status,
			content_run_id,
			manifest,
			published_at: status === 'published' ? null : (published_at ?? null)
		})
	),
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

await upsert('content_release_reviews', releases.map(releaseReviewRow), 'release_id');

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
		.filter(
			(release) =>
				target !== 'production' && targetReleaseStatusById.get(release.id) === 'published'
		)
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

console.log(
	`Imported ${run.manifest.run_id} into ${target} (${env.url}). Validation report: ${reportPath}`
);
