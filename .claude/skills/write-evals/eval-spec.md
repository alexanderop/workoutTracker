# Eval case schema

An eval is a failing test for one observable behavior. A spec file is JSON named
`<suite>.evals.json` (the AFK plugin stores them as `specs/<suite>/evals.json` —
match whatever an existing harness already uses):

```json
{
  "suite": "grill",
  "evals": [ { "...one case..." } ]
}
```

Each case:

| Field | Required | Purpose |
|-------|----------|---------|
| `id` | yes | stable, kebab-case; used to filter a single run |
| `prompt` | yes | what the user/system-under-test is asked to do |
| `expected_output` | no | one-sentence human summary of the target behavior |
| `kind` | no | `"judged"` (default) or `"routing"` — see below |
| `max_budget_usd` | no | per-run budget override for an expensive case |
| `fixture.files` | no | `{ "path": "contents" }` written into a fresh temp git repo before the run |
| `expectations` | no | natural-language behaviors graded by an LLM judge (use only for what substrings can't capture); judged cases only |
| `routing` | no | code-graded route check, required for `kind:"routing"` (below) |
| `assertions` | no | deterministic, zero-judge checks (below) |

> The AFK integration lint requires `expected_output` on every case. `kind:"routing"`
> cases must omit `expectations` and carry a `routing` block; judged cases keep
> `expectations` and must not carry `routing`.

`assertions` keys:

- `required_substrings` / `forbidden_substrings` — case-insensitive checks on the
  agent's response text.
- `required_files` — paths that must exist in the project after the run.
- `required_file_substrings` — `{ "path": ["str", ...] }` content checks on
  produced files.
- `unchanged_files` — fixture files that must be byte-identical afterward.

## Case kinds

`kind` defaults to `"judged"` — today's behavior: `assertions` plus optional
LLM-judged `expectations`. Set `kind:"routing"` when the *whole* behavior under
test is "which skill/route did it pick", which a code-graded substring check
grades faithfully and cheaply.

### Routing case (`kind:"routing"`)

```json
{
  "id": "help-after-plan",
  "prompt": "...",
  "expected_output": "Recommends implement when a plan exists and there's no diff.",
  "kind": "routing",
  "fixture": { "files": {} },
  "routing": {
    "expect": ["implement"],
    "forbid": ["run qa now"],
    "overblock_guard": false
  }
}
```

- A **trial is correct** iff every `expect` substring is present (case-insensitive,
  over the agent's prose + final result) **and** no `forbid` substring is present.
- A **routing case passes** iff a strict majority of trials are correct (≥2/3 at the
  default `AFK_EVAL_TRIALS=3`). Per-case agreement is reported `N/trials`; a case with
  mixed trials (some correct, some not) is flagged **flaky** in the summary.
- `overblock_guard: true` marks a "should-proceed" gate twin: failing such a case is
  tallied as an **over-block** (the suite blocked something safe). Default `false`.
- Routing cases are code-graded — they carry no `expectations` and incur no judge cost.
  The summary prints routing accuracy, the over-block count, and flaky cases.

### Judge output shape (judged cases)

The judge is instructed to first reason inside a single `<thinking>…</thinking>`
block, then output STRICT JSON only after the closing tag:
`{"results":[{"reason":"...","met":true}]}`, one entry per expectation in order.
The harness discards the `<thinking>` block and reads `met` **by key**, so field
order and the reasoning prose don't affect grading.

## Design rules

- **One behavior per case.** If you're testing two things, write two cases.
- **Split a two-part requirement into two assertions** so a half-answer fails.
  Example below requires both the repo origin *and* the local path.
- **Prefer deterministic assertions; reserve the judge** for behaviors substrings
  can't express ("reads the repo before asking"). Assertions are free to re-run
  and don't flake.
- **Keep fixtures minimal** — only the files the behavior needs.

## Worked example (red-first)

This case fails against a grill skill that doesn't record cloned reference repos,
and passes once it does. It encodes the two-part requirement as two file
substrings — origin and path:

```json
{
  "id": "grill-plan-records-reference-repo",
  "prompt": "Earlier we cloned https://github.com/acme/awesome-streamer into reference/awesome-streamer to copy its SSE pattern. Finish by writing brain/plans/streaming.md for a /chat SSE endpoint that follows that repo.",
  "fixture": {
    "files": {
      "reference/awesome-streamer/README.md": "Source: https://github.com/acme/awesome-streamer\n"
    }
  },
  "expectations": [
    "Records in the plan that a reference repo was cloned to copy a pattern",
    "Points implementation at the real cloned source rather than memory"
  ],
  "assertions": {
    "required_files": ["brain/plans/streaming.md"],
    "required_file_substrings": {
      "brain/plans/streaming.md": ["reference/awesome-streamer", "github.com/acme/awesome-streamer"]
    }
  }
}
```
