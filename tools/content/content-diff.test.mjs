import assert from 'node:assert/strict';
import test from 'node:test';
import { diffArtifact, renderDiffMarkdown } from './content-diff.mjs';

test('diffArtifact identifies lesson interaction links without ids', () => {
	const diff = diffArtifact(
		'lesson_interaction_links',
		[],
		[
			{
				lesson_id: 'lesson_vectors',
				lesson_version: 1,
				interaction_slug: 'match-vector-forms',
				interaction_type: 'concept_check',
				question_id: 'question_vectors_match_01',
				question_version: 1,
				ordering: 1
			}
		]
	);

	assert.deepEqual(diff.added, [
		{
			identity: 'lesson_vectors@1:match-vector-forms:question_vectors_match_01@1',
			version: 1
		}
	]);
	assert.equal(diff.unchanged_count, 0);
});

test('renderDiffMarkdown formats added lesson interaction links', () => {
	const markdown = renderDiffMarkdown({
		base_run_id: null,
		candidate_run_id: 'run_test',
		valid: true,
		summary: {
			lesson_interaction_links: {
				added: 1,
				changed: 0,
				retired: 0,
				replaced: 0,
				unchanged: 0
			}
		},
		artifacts: {
			lesson_interaction_links: {
				added: [
					{
						identity: 'lesson_vectors@1:match-vector-forms:question_vectors_match_01@1',
						version: 1
					}
				],
				changed: [],
				retired: [],
				replaced: [],
				unchanged_count: 0
			}
		}
	});

	assert.match(markdown, /lesson_vectors@1:match-vector-forms:question_vectors_match_01@1/);
});
