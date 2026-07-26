---
name: batch
description: Use when a plan or spec splits into many independently-mergeable units — a codebase-wide migration, rename, or repeated pattern change — and the user wants them implemented in parallel as separate PRs rather than one sequential pass. The fan-out alternative to implement.
---

# Batch

Batch is the parallel, PR-per-unit way to implement a plan. Where `implement`
drives one working tree through sequential TDD slices, Batch decomposes the work
into many **independent** units and farms each out to its own worker in
its own git worktree. Each worker implements, simplifies, tests, and opens a PR
on its own branch.

Core principle: only fan out units that are genuinely independent — each one
mergeable on its own with no shared contract still being designed. If the units
collide on a shared abstraction, this is the wrong skill; use `implement`'s
freeze-then-fan-out recipe instead.

## When to Use

Use this skill when:

- A `brain/plans/<slug>.md` plan from `grill`, or a clear spec, breaks into
  5–30 units that can each land as a standalone PR.
- The work is a codebase-wide migration, rename, dependency bump, lint-rule
  rollout, or the same pattern change applied across many files or packages.
- The user asks to "batch", "fan this out", "parallelize this across the repo",
  or wants many small PRs instead of one large change.

Do not use this skill for:

- Work that needs a shared interface, type, or component designed first and then
  applied at call sites — that shared contract makes the units dependent. Use
  `implement` (it owns the freeze-then-fan-out recipe).
- A single feature, bug fix, or change that lives in one or two coupled files.
  Use `implement`.
- Producing one reviewed working-tree diff with no PRs. Use `implement` or
  `ship`.

## Process

### 1. Ground and scope

Read the plan or spec. Dispatch read-only scouts (or read directly) to map every
affected file, call site, and pattern. You must know the full blast radius before
decomposing — a missed call site becomes a unit nobody owns.

### 2. Decompose into independent units

Split the work into 5–30 units. Each unit must be:

- **Independently mergeable** — its PR can land alone, in any order, without
  waiting on another unit.
- **Non-overlapping** — no two units edit the same file. Overlap is the signal
  the work is dependent; merge those units into one or stop and re-scope.
- **Self-verifiable** — has a concrete check (unit tests, a build, a curl, a
  browser step) proving it works in isolation.
- **A complete vertical slice** — one end-to-end behavior with its test and
  implementation together. Never make a unit a test-only or implementation-only
  PR; "independently mergeable" does not make a horizontal slice acceptable.

If a clean independent split is not possible, STOP — see Stop and Ask.

### 3. Write the plan and get approval

Write a numbered unit list: for each unit, its files, the exact change, its
**scoped** test command (the specs covering that unit's files — see Test Scope
in `CLAUDE.md`), and its verification recipe. State the shared verification
every worker runs — the fast gate, plus each unit's own scoped command, never
the full tier: N workers each running the ~5-minute browser suite is N × 5
minutes to re-prove code they did not touch, and CI runs the full tier on every
resulting PR. Present this plan to the user and **wait for approval before
spawning any worker.**

### 4. Spawn one worker per unit, in parallel

After approval, launch one worker per unit with `isolation: "worktree"` (its own
git worktree) by sending all the `Agent` calls in a single message — the harness
runs them concurrently. Do **not** run the workers in background mode: a
background subagent auto-denies any tool call that would otherwise prompt, so a
worker's `Bash` verification (the test command, the e2e recipe, `gh pr create`)
fails silently and the worker reports a green PR it never proved. Synchronous
concurrent workers keep those prompts answerable — that review-each-result model
is the safety mechanism (see `docs/skills-and-agents-reference.md`).

Every worker brief is fully self-contained (subagents start with zero context).
Each must include:

- The unit's exact files, the change to make, and files to read first.
- Code conventions to follow, with a concrete file to mimic.
- The local loop to run, in order: implement the smallest correct change, then
  run the unit's scoped test command — written out in full, not "the project
  test command" — and fix failures, then the unit's e2e recipe. CI runs the full
  suite on the unit's PR.
- Hard boundaries: edit only this unit's files, no neighboring refactors, no new
  dependencies, no renames outside the brief.
- The finish, in order: if the unit's diff is substantial — multi-line logic,
  a new file, an extraction, or a non-trivial rewrite — run `simplify` on it
  and re-run the scoped test command so the PR carries cleaned-up, still-passing
  code;
  skip simplify when the change is a trivial one-liner (a version bump, a string
  or constant edit, a rename) where there is nothing to clean up. Then commit,
  push the branch, open a PR with `gh pr create`, and report back the single line
  `PR: <url>` (or `BLOCKED: <reason>`).

### 5. Track progress to a status table

Maintain a status table of every unit: number, summary, state (PR open / failed
/ blocked), and PR link. Fill it in as each worker returns its result. Do not
invent a PR link or a pass a worker did not report.

### 6. Report and triage

When all workers settle, give the final tally (e.g. "22/24 units landed as PRs")
and list every failed or blocked unit with its reason. For a small number of
failures, re-dispatch once with the specific correction; if a unit fails twice,
finish it in the lead and say so.

## Stop and Ask

STOP and ask the user when:

- The units are not actually independent — they share an interface, type, or file
  still being designed. Recommend `implement` and its freeze-then-fan-out
  recipe instead of forcing a parallel split.
- Two units would need to edit the same file. That is a dependency, not a
  parallelism opportunity.
- The change is a migration, security-sensitive, or destructive, and the safe
  per-unit boundary is unclear.
- PR creation, branch naming, or the target remote depends on a convention the
  repo does not state.

Decompose and decide boundaries yourself from the plan and repo; ask only for the
missing decision or for approval before the spawn in step 3.

## Red Flags

| Thought | Reality |
|---------|---------|
| "I'll fan these out even though they touch the same file." | Same-file edits are dependent. Merge into one unit or route to `implement`. |
| "There's a shared component to build first, but workers can figure it out." | Then you've delegated architecture across N parallel agents. Freeze the contract in the lead first — that's `implement`, not batch. |
| "I'll spawn the workers now and confirm the plan after." | Spawning is expensive and creates branches/PRs. Get plan approval in step 3 before any worker starts. |
| "A worker said it opened a PR, so it's done." | Record only the `PR:` line it actually reported. Don't invent links or assume green CI. |
| "Each worker can skip tests and e2e to go faster." | The per-unit loop — test, e2e, then simplify on substantial diffs — is what makes each PR mergeable on its own. Tests and e2e are never optional; simplify is skipped only for trivial one-line edits. |
| "30 units is fine, I'll just make 60." | Past ~30 units the tracking and review cost outweighs the parallelism. Re-group into coarser units. |

## Output

Keep a status table, filled in as workers return:

```markdown
| # | Unit | State | PR |
|---|------|-------|-----|
| 1 | Migrate <file> to <pattern> | PR open | <url> |
| 2 | … | blocked | — |
```

Finish with this shape:

```markdown
Batch: <n landed>/<total> units as PRs
Plan: brain/plans/<slug>.md or "spec, reason"
PRs: <list of urls>
Failed/blocked: <unit # + reason, or "none">
Next: <re-dispatch, finish-in-lead, or review-and-merge>
```

If units turned out to be dependent, stop before spawning and hand off to
`implement` with the reason.

## References

- `implement` — the sequential, single-working-tree alternative; owns the
  freeze-then-fan-out recipe when a shared contract must be built first.
- `simplify` — the cleanup pass each worker runs on its own diff when the
  unit's change is substantial (skipped for trivial one-liners).
- `grill` — produces the `brain/plans/<slug>.md` that batch decomposes.
