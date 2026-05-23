import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { getTargetSupabaseEnv } from './release-env.mjs';

export const defaultArtifactBucket = 'curriculum-artifacts';
export const jsonlContentType = 'application/x-ndjson; charset=utf-8';

export function isStorageArtifactRef(value) {
	return value?.kind === 'supabase_storage' && value.bucket && value.path;
}

export function sha256(buffer) {
	return createHash('sha256').update(buffer).digest('hex');
}

export function createTargetClient(target, options = {}) {
	const env = getTargetSupabaseEnv(target, options);
	return createClient(env.url, env.key, {
		auth: {
			persistSession: false,
			autoRefreshToken: false
		}
	});
}

export function normalizeStoragePrefix(prefix, runId) {
	return (prefix ?? `runs/${runId}`).replace(/^\/+|\/+$/g, '');
}

export function storagePathForArtifact({ artifactRef, prefix }) {
	const fileName = typeof artifactRef === 'string' ? artifactRef : basename(artifactRef.path);
	return `${prefix}/${fileName}`.replaceAll('\\', '/');
}

export function storageArtifactRef({ bucket, path, buffer, contentType = jsonlContentType }) {
	return {
		kind: 'supabase_storage',
		bucket,
		path,
		sha256: sha256(buffer),
		bytes: buffer.byteLength,
		content_type: contentType
	};
}

export async function storageObjectToBuffer(data) {
	if (Buffer.isBuffer(data)) {
		return data;
	}
	if (data instanceof ArrayBuffer) {
		return Buffer.from(data);
	}
	if (typeof data?.arrayBuffer === 'function') {
		return Buffer.from(await data.arrayBuffer());
	}
	if (typeof data?.text === 'function') {
		return Buffer.from(await data.text(), 'utf8');
	}
	throw new Error('Unsupported Supabase Storage response body.');
}

function objectAlreadyExists(error) {
	const statusCode = Number(error?.statusCode ?? error?.status);
	return statusCode === 409 || /already exists|duplicate/i.test(error?.message ?? '');
}

export async function downloadStorageObject(client, ref) {
	const { data, error } = await client.storage.from(ref.bucket).download(ref.path);
	if (error) {
		throw new Error(`${ref.bucket}/${ref.path}: ${error.message}`);
	}

	const buffer = await storageObjectToBuffer(data);
	if (ref.bytes !== undefined && buffer.byteLength !== ref.bytes) {
		throw new Error(
			`${ref.bucket}/${ref.path}: expected ${ref.bytes} bytes, received ${buffer.byteLength}`
		);
	}
	if (ref.sha256 && sha256(buffer) !== ref.sha256) {
		throw new Error(`${ref.bucket}/${ref.path}: sha256 mismatch`);
	}
	return buffer;
}

export async function uploadImmutableObject(client, ref, buffer) {
	const { error } = await client.storage.from(ref.bucket).upload(ref.path, buffer, {
		contentType: ref.content_type ?? jsonlContentType,
		upsert: false
	});

	if (!error) {
		return { uploaded: true, existed: false };
	}

	if (!objectAlreadyExists(error)) {
		throw new Error(`${ref.bucket}/${ref.path}: ${error.message}`);
	}

	const existing = await downloadStorageObject(client, ref);
	const existingHash = sha256(existing);
	if (existingHash !== ref.sha256) {
		throw new Error(
			`${ref.bucket}/${ref.path}: object already exists with different sha256 ${existingHash}`
		);
	}
	return { uploaded: false, existed: true };
}

export async function readLocalArtifact(manifestDir, artifactRef) {
	if (typeof artifactRef !== 'string') {
		throw new Error('Expected a local artifact path.');
	}
	return readFile(resolve(manifestDir, artifactRef));
}

export async function writeJson(path, value) {
	await mkdir(dirname(path), { recursive: true });
	await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}
