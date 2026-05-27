import { writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { loadAndValidateRun } from './content-run.mjs';

export function stable(value) {
	if (Array.isArray(value)) {
		return value.map(stable);
	}
	if (value && typeof value === 'object') {
		return Object.fromEntries(
			Object.entries(value)
				.filter(([key]) => key !== 'content_run_id')
				.sort(([a], [b]) => a.localeCompare(b))
				.map(([key, nested]) => [key, stable(nested)])
		);
	}
	return value;
}

function fingerprint(value) {
	return JSON.stringify(stable(value));
}

function identityFor(artifactName, record) {
	if (artifactName === 'quiz_question_links') {
		return `${record.quiz_id}@${record.quiz_version}:${record.question_id}@${record.question_version}`;
	}
	if (artifactName === 'lesson_interaction_links') {
		return `${record.lesson_id}@${record.lesson_version}:${record.interaction_slug}:${record.question_id}@${record.question_version}`;
	}
	if (artifactName === 'topic_discovery_metadata') {
		return `${record.topic_area_id}:${record.release_id}`;
	}
	if (artifactName === 'releases') {
		return record.id;
	}
	return record.id;
}

function versionFor(record) {
	return record.version ?? record.question_version ?? 1;
}

function replacementKeyFor(artifactName, record) {
	if (record?.slug) {
		return `slug:${record.slug}`;
	}
	if (artifactName === 'questions' && record?.prompt) {
		return `prompt:${record.prompt}`;
	}
	if (artifactName === 'topic_discovery_metadata' && record?.slug) {
		return `slug:${record.slug}`;
	}
	return null;
}

function latestByIdentity(records, artifactName) {
	const byIdentity = new Map();
	for (const record of records ?? []) {
		const identity = identityFor(artifactName, record);
		const current = byIdentity.get(identity);
		if (!current || versionFor(record) > versionFor(current)) {
			byIdentity.set(identity, record);
		}
	}
	return byIdentity;
}

function formatValue(value) {
	if (value === undefined) return null;
	return value;
}

function fieldDeltas(base, candidate, prefix = '') {
	const baseStable = stable(base);
	const candidateStable = stable(candidate);
	const keys = new Set([...Object.keys(baseStable ?? {}), ...Object.keys(candidateStable ?? {})]);
	const deltas = [];

	for (const key of [...keys].sort()) {
		const path = prefix ? `${prefix}.${key}` : key;
		const before = baseStable?.[key];
		const after = candidateStable?.[key];
		const beforeIsObject = before && typeof before === 'object' && !Array.isArray(before);
		const afterIsObject = after && typeof after === 'object' && !Array.isArray(after);

		if (beforeIsObject && afterIsObject) {
			deltas.push(...fieldDeltas(before, after, path));
			continue;
		}

		if (JSON.stringify(before) !== JSON.stringify(after)) {
			deltas.push({
				path,
				before: formatValue(before),
				after: formatValue(after)
			});
		}
	}

	return deltas;
}

function mapReplacementCandidates(added, retired, artifactName) {
	const retiredByReplacementKey = new Map();
	for (const item of retired) {
		if (!item.record) continue;
		const key = replacementKeyFor(artifactName, item.record);
		if (key) {
			retiredByReplacementKey.set(key, item);
		}
	}

	const replacements = [];
	const replacedAddedIdentities = new Set();
	const replacedRetiredIdentities = new Set();
	for (const item of added) {
		if (!item.record) continue;
		const key = replacementKeyFor(artifactName, item.record);
		const retiredItem = key ? retiredByReplacementKey.get(key) : null;
		if (!retiredItem) continue;

		replacements.push({
			from_identity: retiredItem.identity,
			to_identity: item.identity,
			from_version: retiredItem.version,
			to_version: item.version,
			replacement_key: key,
			deltas: fieldDeltas(retiredItem.record, item.record)
		});
		replacedAddedIdentities.add(item.identity);
		replacedRetiredIdentities.add(retiredItem.identity);
	}

	return {
		replacements,
		added: added.filter((item) => !replacedAddedIdentities.has(item.identity)),
		retired: retired.filter((item) => !replacedRetiredIdentities.has(item.identity))
	};
}

function publicItem(item) {
	const { record: _record, ...rest } = item;
	return rest;
}

export function diffArtifact(artifactName, baseRecords, candidateRecords) {
	const baseByIdentity = latestByIdentity(baseRecords, artifactName);
	const candidateByIdentity = latestByIdentity(candidateRecords, artifactName);
	const added = [];
	const changed = [];
	const retired = [];
	const replaced = [];
	const unchanged = [];

	for (const [identity, candidate] of candidateByIdentity) {
		const base = baseByIdentity.get(identity);
		if (!base) {
			added.push({ identity, version: versionFor(candidate), record: candidate });
			continue;
		}

		const baseVersion = versionFor(base);
		const candidateVersion = versionFor(candidate);
		if (baseVersion !== candidateVersion) {
			replaced.push({
				identity,
				from_version: baseVersion,
				to_version: candidateVersion,
				deltas: fieldDeltas(base, candidate)
			});
			continue;
		}

		if (fingerprint(base) !== fingerprint(candidate)) {
			changed.push({
				identity,
				version: candidateVersion,
				deltas: fieldDeltas(base, candidate)
			});
		} else {
			unchanged.push({ identity, version: candidateVersion });
		}
	}

	for (const [identity, base] of baseByIdentity) {
		if (!candidateByIdentity.has(identity)) {
			retired.push({ identity, version: versionFor(base), record: base });
		}
	}

	const mapped = mapReplacementCandidates(added, retired, artifactName);

	return {
		added: mapped.added.map(publicItem),
		changed,
		retired: mapped.retired.map(publicItem),
		replaced: [...replaced, ...mapped.replacements],
		unchanged_count: unchanged.length
	};
}

export function summarizeDiff(report) {
	return Object.fromEntries(
		Object.entries(report.artifacts).map(([name, diff]) => [
			name,
			{
				added: diff.added.length,
				changed: diff.changed.length,
				retired: diff.retired.length,
				replaced: diff.replaced.length,
				unchanged: diff.unchanged_count
			}
		])
	);
}

export async function buildDiffReport(candidateManifestPath, baseManifestPath, options = {}) {
	const candidate = await loadAndValidateRun(candidateManifestPath, options);
	const base =
		baseManifestPath === 'none' ? null : await loadAndValidateRun(baseManifestPath, options);
	const artifactNames = new Set([
		...Object.keys(base?.artifacts ?? {}),
		...Object.keys(candidate.artifacts)
	]);

	const report = {
		base_run_id: base?.manifest.run_id ?? null,
		candidate_run_id: candidate.manifest.run_id,
		valid: candidate.report.valid && (base?.report.valid ?? true),
		artifacts: Object.fromEntries(
			[...artifactNames]
				.sort()
				.map((name) => [
					name,
					diffArtifact(name, base?.artifacts[name] ?? [], candidate.artifacts[name] ?? [])
				])
		)
	};
	report.summary = summarizeDiff(report);
	return { candidate, base, report };
}

function markdownTable(summary) {
	const rows = [
		'| Artifact | Added | Changed | Retired | Replaced | Unchanged |',
		'| --- | ---: | ---: | ---: | ---: | ---: |'
	];
	for (const [name, counts] of Object.entries(summary)) {
		rows.push(
			`| ${name} | ${counts.added} | ${counts.changed} | ${counts.retired} | ${counts.replaced} | ${counts.unchanged} |`
		);
	}
	return rows.join('\n');
}

function formatDelta(delta) {
	return `- \`${delta.path}\`: \`${JSON.stringify(delta.before)}\` -> \`${JSON.stringify(delta.after)}\``;
}

function formatItemIdentity(item) {
	return item.identity.includes('@') ? item.identity : `${item.identity}@${item.version}`;
}

export function renderDiffMarkdown(report) {
	const lines = [
		`# Content Diff: ${report.candidate_run_id}`,
		'',
		`Base run: ${report.base_run_id ?? 'none'}`,
		`Candidate run: ${report.candidate_run_id}`,
		`Valid: ${report.valid ? 'yes' : 'no'}`,
		'',
		'## Summary',
		'',
		markdownTable(report.summary)
	];

	for (const [artifactName, diff] of Object.entries(report.artifacts)) {
		if (
			!diff.added.length &&
			!diff.changed.length &&
			!diff.retired.length &&
			!diff.replaced.length
		) {
			continue;
		}

		lines.push('', `## ${artifactName}`);

		if (diff.added.length) {
			lines.push(
				'',
				'### Added',
				...diff.added.map((item) => `- ${formatItemIdentity(item)}`)
			);
		}
		if (diff.retired.length) {
			lines.push(
				'',
				'### Retired',
				...diff.retired.map((item) => `- ${formatItemIdentity(item)}`)
			);
		}
		if (diff.replaced.length) {
			lines.push('', '### Replaced');
			for (const item of diff.replaced) {
				const label = item.from_identity
					? `${item.from_identity}@${item.from_version} -> ${item.to_identity}@${item.to_version}`
					: `${item.identity}@${item.from_version} -> @${item.to_version}`;
				lines.push(`- ${label}`);
				for (const delta of item.deltas.slice(0, 8)) {
					lines.push(`  ${formatDelta(delta)}`);
				}
			}
		}
		if (diff.changed.length) {
			lines.push('', '### Changed');
			for (const item of diff.changed) {
				lines.push(`- ${item.identity}@${item.version}`);
				for (const delta of item.deltas.slice(0, 8)) {
					lines.push(`  ${formatDelta(delta)}`);
				}
			}
		}
	}

	return `${lines.join('\n')}\n`;
}

export async function writeDiffReports(report, outputPath) {
	const jsonPath = outputPath;
	const markdownPath = outputPath.replace(/\.json$/i, '.md');
	await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
	await writeFile(markdownPath, renderDiffMarkdown(report));
	return { jsonPath, markdownPath };
}

export function defaultDiffOutputPath(candidateManifestPath) {
	return resolve(dirname(candidateManifestPath), 'diff-report.json');
}
