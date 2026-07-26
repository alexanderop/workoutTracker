---
name: ship-it
description: Use when verified work needs to leave the machine — push the feature branch and open the pull request. Triggers include "ship it", "push this", "open a PR", "raise the PR", or the end of an implement/simplify/review/qa run that is green and still local.
---

# Ship It

Take verified local work to a pull request. This is the terminal step of the
AFK flow: `grill` -> `implement` -> `simplify` -> `review` -> `qa` -> **ship-it**.

Core principle: the branch already holds one commit per acceptance criterion.
This skill does not create work, squash it, or reinterpret it — it runs the
feature's own tests (the checks `pre-commit` was too fast to run, scoped to what
changed), pushes, and writes the PR. The full suite is CI's job: the whole
browser tier is ~5 minutes on one machine and CI shards it four ways on the PR,
so running it here delays the push to re-prove code nobody touched.

## When to Use

Use this skill when:

- `implement` finished, the ACs are committed, and the branch is still local.
- The user says ship it, push it, open a PR, or asks why the work is not up yet.
- A `ship` run reached a `SHIP` or `SHIP WITH CAVEATS` verdict.

Do not use this skill for:

- Work that is not committed yet. Commits are `implement`'s job, one per AC.
  If the tree is dirty, route back to `implement` rather than sweeping the
  remainder into one catch-all commit here.
- A `DO NOT SHIP` verdict, or unresolved high-severity `review` findings.
- Merging, releasing, or deploying. This skill stops at an open PR.

## Process

### 1. Check the preconditions

```bash
git branch --show-current
git status --short
git log --oneline main..HEAD
```

- **Not on `main`.** If the work is sitting on `main`, stop — creating the
  branch retroactively is `implement`'s step 0, and doing it here hides the
  fact that the flow was skipped.
- **Clean tree.** Uncommitted changes mean an AC is unfinished. Report what is
  outstanding instead of committing it blind.
- **At least one commit ahead of `main`.** Nothing to ship otherwise.

### 2. Run the scoped gate

`pre-commit` deliberately runs only the fast tier. Run what it skipped **for
this feature**, before the push rather than after CI rejects it:

```bash
pnpm lint:check
# then every command in the plan's `## Test Scope`, verbatim — e.g.
pnpm exec vitest run --project=default src/__tests__/features/<feature>
pnpm exec vitest run --project=unit src/__tests__/unit/<area>
```

Run **every** command the scope records, not just the first and not just the
`default` one — a scope spanning two projects is two runs, and dropping the
`unit` line silently ships that half unverified. Copy each command as written;
the recorded entries are already complete, so re-prefixing a path yields
`src/__tests__/src/__tests__/…` and matches nothing.

No plan, or no `## Test Scope` in it? Derive the scope from
`git diff --name-only main...HEAD` — the changed features' specs plus the specs
of anything that imports what you changed — and say in the PR body which scope
you ran.

**Do not run `pnpm test` here.** The full browser tier is ~5 minutes locally,
and CI runs it on the PR sharded four ways, alongside the a11y, visual, e2e,
coverage, and Lighthouse tiers (`.github/workflows/ci.yml`). A local full run
buys a slower copy of a signal the PR gets anyway. The same goes for
`pnpm test:e2e`: CI's `test-e2e` job covers it, so run it locally only when the
change touches routing or the service worker *and* you have a specific reason to
believe CI would tell you too late.

Report the actual output, and name the scope you ran.

If a scoped spec fails, check whether it fails in isolation before treating it
as a blocker — this suite has known load-sensitive specs and which one fails
varies per run. A spec that passes alone and has no reference to the changed
code is suite health, not this work; say so explicitly rather than burying it.

### 3. Rebase on main

```bash
git fetch origin
git rebase origin/main
```

Re-run the fast gate (`pnpm -s type-check && pnpm -s test:unit`) if the rebase
moved anything. Stop and ask on conflicts you cannot resolve mechanically.

### 4. Push

```bash
git push -u origin HEAD
```

Never force-push a branch that already has review comments on it without
saying so first.

### 5. Open the PR

Title follows Conventional Commits with a scope, matching the branch's dominant
change type: `feat(habits): inject repositories through a typed context`.

Body:

```markdown
## What

<one paragraph: the behavior change, not the file list>

## Why

<the problem this solves; the decision if the work settled one>

## Acceptance criteria

- [x] <AC 1> — <commit sha>
- [x] <AC 2> — <commit sha>

## Verification

<the scoped commands run and their results, naming the scope; note that the
full suite runs in CI on this PR>

## Notes

<caveats, follow-ups, known-flaky specs hit, or "none">
```

Working plans live in `brain/plans/` and are **gitignored** — never link a plan
path in the PR body, because no reviewer can open it. Inline the decisions that
matter instead.

```bash
gh pr create --title "<title>" --body-file <(...)
```

Return the PR URL.

### 6. Hand off

Tell the user the PR is open, that CI is now running the full suite against it,
and that `pnpm -s pr:comments` is how to read review feedback once it lands —
`gh pr view --comments` silently omits review summaries and line comments.

CI is the full-suite gate, so **the push is not the end of the gate** — the run
is complete when CI has reported, not when the PR exists. Moving the suite to CI
moved the finish line with it; ending here would mean the tiers nobody ran
locally were never checked at all.

Wait for the verdict by whichever mechanism the environment supports:

```bash
gh pr checks <pr> --watch    # blocks until every check settles
```

Where `gh` is unavailable (it is absent in the Claude Code web sandbox, among
others), subscribe to the PR's activity (`subscribe_pr_activity`) and act on the
events as they wake the session, or poll the checks through the GitHub API. The
mechanism is negotiable; finishing without a verdict is not.

Then report the outcome explicitly — "Required CI green" or the named failing
job. A red tier that only CI runs is this work's problem until proven otherwise:
reproduce it locally with the narrowest command that covers it, fix it, and push
again. Do not close out the run with "CI will tell us", and do not report the
PR as shipped while checks are still in flight — say they are running and that
you are waiting.

## Stop and Ask

STOP and ask when:

- The current branch is `main`, or the tree is dirty.
- The scoped gate fails in a way that is plausibly caused by this change.
- The change is cross-cutting and you cannot bound a scope for it — say so
  rather than silently pushing on a gate that proved nothing.
- The rebase conflicts non-mechanically.
- A `review` verdict of **Revise** or a `qa` verdict of **DO NOT SHIP** is
  outstanding.
- Pushing would force-overwrite a branch that already has review comments.

## Red Flags

| Thought | Reality |
|---------|---------|
| "The tree is dirty, I'll just commit the rest as `chore: wip`." | An uncommitted remainder means an AC is unfinished. Route back to `implement`. |
| "`pre-commit` passed on every commit, so the branch is green." | `pre-commit` runs the unit tier only. The feature's browser specs have not run yet — run the plan's `## Test Scope` before pushing. |
| "I'll run `pnpm test` to be safe before pushing." | Five minutes to re-prove code you did not touch, then CI runs it again sharded four ways. Run the scope; let CI run the tier. |
| "CI runs everything, so I can skip the local gate entirely." | The scope is the fast signal on the code you actually changed. Skipping it spends a full CI cycle to learn what 30 seconds would have told you. |
| "Pushed, CI will tell us if it's broken." | You own the PR to green. Watch the checks, reproduce a red tier locally with the narrowest command that covers it, and push the fix. |
| "A test failed, so I'll rerun until it passes." | Check isolation first, then say which it was: a real failure, or a known load-sensitive spec. Never silently retry to green. |
| "I'll link the plan so reviewers have context." | `brain/plans/` is gitignored. Inline the decisions instead. |
| "I'll squash the AC commits into one clean commit." | The per-AC commits are the reviewable unit and the bisect unit. Keep them. |

## Output

```markdown
Branch: <name> (<n> commits ahead of main)
Gate: <every scoped command run, and its result>
Scope: <what the scope covered, and where it came from — plan `## Test Scope` or derived from the diff>
CI: <green | the failing job | still running, waiting on it>
PR: <url>
Caveat: <one sentence, only if needed>
```
