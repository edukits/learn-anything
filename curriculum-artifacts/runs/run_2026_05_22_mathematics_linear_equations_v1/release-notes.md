# Mathematics Linear Equations v1

## Review Workflow

- Source: `content-sources/mathematics/linear-equations/source.md`
- Metadata: `content-sources/mathematics/linear-equations/metadata.json`
- Validation: `node tools/content/validate-run.mjs curriculum-artifacts/runs/run_2026_05_22_mathematics_linear_equations_v1/manifest.json --base none`
- Diff: `node tools/content/diff-run.mjs curriculum-artifacts/runs/run_2026_05_22_mathematics_linear_equations_v1/manifest.json --base none`

## Reviewer Checklist

- Lessons teach balanced equation moves, inverse operations, and simplification before solving.
- Questions have one unambiguous answer and explanations show the solving move.
- Public discovery copy matches the release contents.

## Rollback Procedure

This is the first release for `topic_linear_equations`. To roll it back, mark `release_mathematics_linear_equations_v1` as `retired` in `content_releases`. Because no earlier Linear Equations release exists, public discovery should then no longer show the topic.
