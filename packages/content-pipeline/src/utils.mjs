import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';

export const artifactFiles = {
	subject_areas: 'subject-areas.jsonl',
	topic_areas: 'topic-areas.jsonl',
	topic_modules: 'topic-modules.jsonl',
	skills: 'skills.jsonl',
	lessons: 'lessons.jsonl',
	quizzes: 'quizzes.jsonl',
	questions: 'questions.jsonl',
	quiz_question_links: 'quiz-question-links.jsonl',
	learning_paths: 'learning-paths.jsonl',
	releases: 'releases.jsonl',
	topic_discovery_metadata: 'topic-discovery-metadata.jsonl',
	media_assets: 'media-assets.jsonl'
};

export function slugify(value) {
	return String(value)
		.trim()
		.toLowerCase()
		.replace(/['"]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

export function snakeId(value) {
	return slugify(value).replaceAll('-', '_');
}

export function stableHash(value, length = 10) {
	return createHash('sha256').update(value).digest('hex').slice(0, length);
}

export function compactObject(value) {
	return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));
}

export class JsonReadError extends Error {
	constructor(path, message, kind, options) {
		super(`${path}: ${message}`, options);
		this.name = 'JsonReadError';
		this.path = path;
		this.kind = kind;
	}
}

export async function readJson(path) {
	let content;
	try {
		content = await readFile(path, 'utf8');
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		throw new JsonReadError(path, message, 'read', { cause: error });
	}
	try {
		return JSON.parse(content);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		throw new JsonReadError(path, message, 'parse', { cause: error });
	}
}

export async function writeJson(path, value) {
	await mkdir(dirname(path), { recursive: true });
	await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

export async function writeJsonl(path, rows) {
	await mkdir(dirname(path), { recursive: true });
	await writeFile(path, `${rows.map((row) => JSON.stringify(row)).join('\n')}\n`);
}

export function toRepoRelativePath(path, repoRoot = process.cwd()) {
	return relative(repoRoot, resolve(path)).replaceAll('\\', '/');
}
