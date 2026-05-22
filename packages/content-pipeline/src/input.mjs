import { access, readdir, readFile } from 'node:fs/promises';
import { basename, join, relative, resolve } from 'node:path';
import { z } from 'zod';
import { readJson, slugify, snakeId, stableHash, toRepoRelativePath } from './utils.mjs';

const sourceMetadataSchema = z.object({
	source_id: z.string().min(1).optional(),
	id: z.string().min(1).optional(),
	path: z.string().min(1).optional(),
	title: z.string().min(1).optional(),
	origin: z.string().min(1).optional(),
	license: z.string().min(1).optional(),
	version: z.union([z.string(), z.number()]).optional(),
	date: z.string().min(1).optional(),
	notes: z.string().min(1).optional(),
	usage: z.string().min(1).optional()
});

const stableIdSchema = z.string().regex(/^[a-z][a-z0-9_]*$/, 'Use lowercase snake_case ids.');

const topicJsonSchema = z
	.object({
		subject: z
			.object({
				id: stableIdSchema,
				slug: z.string().min(1),
				name: z.string().min(1),
				summary: z.string().min(1)
			}),
		topic: z
			.object({
				id: stableIdSchema,
				slug: z.string().min(1),
				name: z.string().min(1),
				summary: z.string().min(1),
				public_summary: z.string().min(1).optional(),
				preview_markdown: z.string().min(1).optional(),
				app_path: z.string().min(1).optional(),
				level_label: z.string().min(1).optional(),
				estimated_minutes: z.number().int().positive().optional()
			}),
		release: z
			.object({
				id: z.string().min(1).optional(),
				slug: z.string().min(1).optional(),
				title: z.string().min(1).optional(),
				status: z.enum(['draft', 'published', 'retired']).optional(),
				published_at: z.string().datetime().nullable().optional(),
				bundle_key: z.string().min(1).optional()
			})
			.optional(),
		learning_path: z
			.object({
				id: z.string().min(1).optional(),
				slug: z.string().min(1).optional(),
				title: z.string().min(1).optional(),
				summary: z.string().min(1).optional()
			})
			.optional()
	})
	.passthrough();

async function exists(path) {
	try {
		await access(path);
		return true;
	} catch {
		return false;
	}
}

async function scanFiles(dir) {
	if (!(await exists(dir))) {
		return [];
	}

	const entries = await readdir(dir, { withFileTypes: true });
	const files = await Promise.all(entries.map(async (entry) => {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) {
			return scanFiles(path);
		}
		if (entry.name === 'sources.json') {
			return [];
		}
		return [path];
	}));
	return files.flat().toSorted();
}

function normalizeTopic(raw, topicDir) {
	const subjectSlug = raw.subject?.slug ?? slugify(basename(resolve(topicDir, '..')));
	const topicSlug = raw.topic?.slug ?? slugify(basename(topicDir));
	const subjectName = raw.subject?.name ?? subjectSlug.replaceAll('-', ' ');
	const topicName = raw.topic?.name ?? topicSlug.replaceAll('-', ' ');

	return {
		raw,
		subject: {
			id: raw.subject?.id ?? `subject_${snakeId(subjectSlug)}`,
			slug: subjectSlug,
			name: subjectName,
			summary: raw.subject?.summary ?? subjectName
		},
		topic: {
			id: raw.topic?.id ?? `topic_${snakeId(topicSlug)}`,
			slug: topicSlug,
			name: topicName,
			summary: raw.topic?.summary ?? topicName,
			public_summary: raw.topic?.public_summary ?? raw.topic?.summary ?? topicName,
			preview_markdown: raw.topic?.preview_markdown ?? raw.topic?.summary ?? topicName,
			app_path: raw.topic?.app_path ?? `/app/topics/${topicSlug}`,
			level_label: raw.topic?.level_label ?? subjectName,
			estimated_minutes: raw.topic?.estimated_minutes
		},
		release: raw.release ?? {},
		learning_path: raw.learning_path ?? {}
	};
}

function normalizeSourcesRegistry(raw) {
	if (Array.isArray(raw)) {
		return raw;
	}
	if (raw && Array.isArray(raw.sources)) {
		return raw.sources;
	}
	throw new Error('sources/sources.json must be an array or an object with a sources array.');
}

function sourceIdForPath(topic, relativePath) {
	return `source_${snakeId(topic.topic.slug)}_${stableHash(relativePath, 8)}`;
}

async function loadSourceRefs(topicDir, topic, repoRoot) {
	const sourcesDir = resolve(topicDir, 'sources');
	const sourcesJsonPath = resolve(sourcesDir, 'sources.json');
	const scannedFiles = await scanFiles(sourcesDir);
	const hasSourcesJson = await exists(sourcesJsonPath);
	const byRelativePath = new Map();
	const sourceRefs = [];
	const sourceFiles = [];

	if (hasSourcesJson) {
		const registry = normalizeSourcesRegistry(await readJson(sourcesJsonPath));
		for (const entry of registry) {
			const parsed = sourceMetadataSchema.parse(entry);
			const sourcePath = parsed.path ? resolve(sourcesDir, parsed.path) : undefined;
			const relativePath = sourcePath ? toRepoRelativePath(sourcePath, repoRoot) : undefined;
			const source_id =
				parsed.source_id ?? parsed.id ?? sourceIdForPath(topic, parsed.path ?? parsed.title ?? 'source');
			const ref = {
				source_id,
				path: relativePath,
				metadata_path: toRepoRelativePath(sourcesJsonPath, repoRoot)
			};
			sourceRefs.push(ref);
			if (sourcePath) {
				byRelativePath.set(relative(sourcesDir, sourcePath).replaceAll('\\', '/'), ref);
			}
		}
	}

	for (const file of scannedFiles) {
		const relativeToSources = relative(sourcesDir, file).replaceAll('\\', '/');
		const path = toRepoRelativePath(file, repoRoot);
		const existingRef = byRelativePath.get(relativeToSources);
		const ref =
			existingRef ??
			{
				source_id: sourceIdForPath(topic, relativeToSources),
				path,
				metadata_path: hasSourcesJson ? toRepoRelativePath(sourcesJsonPath, repoRoot) : undefined
			};
		if (!existingRef) {
			sourceRefs.push(ref);
		}
		sourceFiles.push({ path: file, relativePath: relativeToSources, source_ref: ref });
	}

	return { sourceRefs, sourceFiles, sourcesDir, sourcesJsonPath };
}

async function loadLegacy(topicDir, repoRoot) {
	const metadataPath = resolve(topicDir, 'metadata.json');
	const sourcePath = resolve(topicDir, 'source.md');
	if (!(await exists(metadataPath)) && !(await exists(sourcePath))) {
		return null;
	}

	const metadata = (await exists(metadataPath)) ? await readJson(metadataPath) : {};
	const subjectSlug = slugify(metadata.subject ?? basename(resolve(topicDir, '..')));
	const topicSlug = slugify(metadata.topic ?? basename(topicDir));
	const topic = normalizeTopic(
		{
			subject: {
				slug: subjectSlug,
				name: metadata.subject ?? subjectSlug,
				summary: metadata.subject ?? subjectSlug
			},
			topic: {
				slug: topicSlug,
				name: metadata.title ?? metadata.topic ?? topicSlug,
				summary: metadata.notes ?? metadata.title ?? metadata.topic ?? topicSlug
			}
		},
		topicDir
	);
	const sourceRefs = [
		{
			source_id: metadata.source_id ?? sourceIdForPath(topic, 'source.md'),
			path: (await exists(sourcePath)) ? toRepoRelativePath(sourcePath, repoRoot) : undefined,
			metadata_path: (await exists(metadataPath)) ? toRepoRelativePath(metadataPath, repoRoot) : undefined
		}
	];
	const readme = (await exists(sourcePath)) ? await readFile(sourcePath, 'utf8') : metadata.notes ?? '';

	return {
		topicDir,
		topic,
		readme,
		readmePath: sourcePath,
		sourceRefs,
		sourceFiles: (await exists(sourcePath))
			? [{ path: sourcePath, relativePath: 'source.md', source_ref: sourceRefs[0] }]
			: [],
		legacy: true,
		warnings: [
			'Legacy metadata.json/source.md input detected. Add topic.json and README.md before relying on this topic for stable generated runs.'
		]
	};
}

export async function loadTopicInput(topicDirInput, options = {}) {
	const repoRoot = resolve(options.repoRoot ?? process.cwd());
	const topicDir = resolve(topicDirInput);
	const topicJsonPath = resolve(topicDir, 'topic.json');
	const readmePath = resolve(topicDir, 'README.md');

	if (!(await exists(topicJsonPath))) {
		const legacy = await loadLegacy(topicDir, repoRoot);
		if (legacy) {
			return legacy;
		}
		throw new Error(
			`${topicJsonPath} is required. Create topic.json for persistent subject/topic identity.`
		);
	}
	if (!(await exists(readmePath))) {
		throw new Error(`${readmePath} is required. README.md should contain the generation brief.`);
	}

	const rawTopic = topicJsonSchema.parse(await readJson(topicJsonPath));
	const topic = normalizeTopic(rawTopic, topicDir);
	const { sourceRefs, sourceFiles } = await loadSourceRefs(topicDir, topic, repoRoot);
	const readme = await readFile(readmePath, 'utf8');

	return {
		topicDir,
		topic,
		readme,
		readmePath,
		sourceRefs,
		sourceFiles,
		legacy: false,
		warnings: []
	};
}
