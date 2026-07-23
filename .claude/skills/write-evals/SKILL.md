---
name: write-evals
description: Use when the user wants to generate behavioral evals, LLM-judge tests, or eval cases for a skill, agent, prompt, or feature, write a failing eval before implementing, or scaffold an eval harness in a repo that has none
---

# Write Evals

An eval is a failing test for one observable behavior: a fixture, a prompt, and
machine-checkable assertions, with an optional LLM judge for behaviors substrings
can't express. The invariant this skill protects: **write the eval red first** —
a case that can't fail proves nothing. If the repo has no harness, scaffold one
before writing cases.

## When to Use

Do not use this skill for ordinary unit/integration tests with no model in the
loop — use the project's normal test tooling. Do not use it to *implement* the
feature; this skill writes the eval and hands off.

## Process

1. **Locate or scaffold the harness.** Search the repo for an existing eval
   runner and spec dir (`*.evals.json`, `evals.json`, a `run-evals` script, a
   `test:evals` package script). If one exists, read a sample case and **mirror
   its schema** — never introduce a second eval format. If none exists, scaffold
   from [run-evals.template.ts](./run-evals.template.ts): copy it to
   `evals/run-evals.ts`, add `"test:evals": "bun evals/run-evals.ts"` to
   `package.json`, and create the specs dir. The harness needs Bun and the
   `claude` CLI; for a non-Claude system-under-test set `EVAL_AGENT_CMD`.
2. **Pin one behavior.** State the target behavior in a single sentence
   (`expected_output`). One observable behavior per case; if you're testing two
   things, write two cases.
3. **Build a minimal fixture.** Seed only the files the behavior needs into
   `fixture.files`. Small and real beats a mirror of the repo.
4. **Write deterministic assertions first.** Use `required_files`,
   `required_file_substrings`, `required/forbidden_substrings`,
   `unchanged_files`. Split a two-part requirement into two assertions so a
   half-answer fails. Add `expectations` (LLM-judged) only for behaviors
   substrings can't capture, e.g. "reads the repo before asking". When the
   *whole* behavior is "which skill/route did it pick", use `kind:"routing"`
   with a `routing` block (`expect`/`forbid`) instead — code-graded, judge-free,
   and scored by strict-majority over trials. See
   [eval-spec.md](./eval-spec.md) for the full schema and a worked example.
5. **Confirm it's red.** Run only the new case (the AFK harness filters via
   `AFK_EVAL_ID=<id>`; the template via `EVAL_ID=<id>`) and verify it fails for
   the right reason — the behavior is absent, not the fixture or assertion
   malformed. **Carve-out:** coverage cases that lock in already-correct
   behavior — negative gate twins, edge-case classes, routing-volume cases —
   may be born green; you can't make passing behavior fail. State this in the
   PR/report and rely on review to catch dead assertions, rather than faking a
   red. Net-new behavior still goes red first.
6. **Go green.** Implement the behavior (or hand to the owning skill/agent), then
   re-run until deterministic assertions pass and the judge clears the threshold.
7. **Read the judge samples.** Open a `judge*.json` artifact for at least one
   judged case and confirm the `<thinking>`-then-JSON output parses and the
   verdicts are sane — a judge that misreads the transcript silently inverts the
   gate. Routing cases need no judge; check their per-trial `route` log instead.
8. **Keep zero-token checks green.** Make sure the spec JSON parses and any
   harness you scaffolded runs (`bun <runner>` with no specs should fail loudly,
   not crash).

## Stop and Ask

STOP and ask the user when:

- The behavior to test, or which output is authoritative, can't be inferred from
  the repo or the request.
- The system-under-test isn't the `claude` CLI and how to invoke it
  (`EVAL_AGENT_CMD`, a binary, an HTTP call) is unknown.

Do not ask about facts discoverable by reading the repo's existing evals.

## Red Flags

| Thought | Reality |
|---------|---------|
| "I'll write the eval after the feature works." | Then it can't go red — you've stamped a regression, not tested. Write it red first. |
| "One required substring is enough." | A two-part requirement needs two assertions, or a half-answer passes. |
| "Judge everything." | Substring/file assertions are deterministic and free to re-run; reserve the LLM judge for what they can't express. A pure route check is a `kind:"routing"` case — no judge at all. |
| "This repo needs its own eval format." | Reuse the existing harness; a second format splits the suite. |
| "The fixture should mirror the real repo." | Minimal fixtures isolate the behavior and run fast. |
| "More cases is always better — add variations." | Add volume that mirrors the real request distribution (gate twins, edge classes, adversarial routes), not broad variation-spam that just re-tests the happy path. |

## Output

Report:

- The spec file path and the new case `id`(s).
- The exact run command (e.g. `AFK_EVAL_ID=<id> bun run test:evals`).
- Whether the case is currently **red** (pre-fix) or **green**, and — if
  scaffolded — the harness files created.

## References

- [run-evals.template.ts](./run-evals.template.ts) — self-contained Bun harness to scaffold when none exists
- [eval-spec.md](./eval-spec.md) — eval case schema and worked red-first example
