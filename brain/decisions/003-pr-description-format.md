# PR description format

Every PR body follows one fixed, QA-oriented contract so a browser QA pass can
run straight from the description without reading the diff. This is a durable
convention, not a per-PR style choice — fill every section, omit no header.

The authoritative shape lives in
[`.claude/skills/pr/references/template.md`](../../.claude/skills/pr/references/template.md)
and is produced by the `pr` skill. Required sections, in order:

1. **Summary** — 2-4 bullets on what changed (behavior, not implementation).
2. **User Impact** — who is affected and what changes for them.
3. **Acceptance Criteria** — 3-5 checkbox bullets, each a concrete user-facing
   outcome ("User can ..."). Specific enough to verify from the body alone.
4. **QA Scope** — narrow and time-boxed (changed flow + one adjacent
   regression, 5-8 min).
5. **Risk Areas** — 2-4 likely breakage zones.
6. **Manual Test Scenarios** — numbered Given / When / Then with exact UI
   labels and expected results; executable without the diff.
7. **CI Checks** — `pnpm type-check`, `pnpm lint`, `pnpm test`.

Title is Conventional Commits with scope: `feat(workout): add rest timer`.

Ban vague phrasing ("works correctly", "verify changes"). Prefer exact flows,
labels, values, and validation messages. When local/DB state matters, state it
as a scenario prerequisite.
