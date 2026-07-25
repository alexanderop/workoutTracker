---
name: ship-it
description: Use when verified work needs to leave the machine — push the feature branch and open the pull request. Triggers include "ship it", "push this", "open a PR", "raise the PR", or the end of an implement/simplify/review/qa run that is green and still local.
---

# Ship It

Take verified local work to a pull request. This is the terminal step of the
AFK flow: `grill` -> `implement` -> `simplify` -> `review` -> `qa` -> **ship-it**.

Core principle: the branch already holds one commit per acceptance criterion.
This skill does not create work, squash it, or reinterpret it — it runs the
checks `pre-commit` was too fast to run, pushes, and writes the PR.

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

### 2. Run the full gate

`pre-commit` deliberately runs only the fast tier. Run what it skipped, before
the push rather than after CI rejects it:

```bash
pnpm lint:check
pnpm test
```

Add `pnpm test:e2e` when the change touches routing, the service worker, or a
full user flow. Report the actual output.

If a browser or integration spec fails, check whether it fails in isolation
before treating it as a blocker — this suite has known load-sensitive specs and
which one fails varies per run. A spec that passes alone and has no reference to
the changed code is suite health, not this work; say so explicitly rather than
burying it.

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

<commands run and their results, including anything deliberately skipped>

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

Tell the user the PR is open and that `pnpm -s pr:comments` is how to read
review feedback once it lands — `gh pr view --comments` silently omits review
summaries and line comments.

## Stop and Ask

STOP and ask when:

- The current branch is `main`, or the tree is dirty.
- The full gate fails in a way that is plausibly caused by this change.
- The rebase conflicts non-mechanically.
- A `review` verdict of **Revise** or a `qa` verdict of **DO NOT SHIP** is
  outstanding.
- Pushing would force-overwrite a branch that already has review comments.

## Red Flags

| Thought | Reality |
|---------|---------|
| "The tree is dirty, I'll just commit the rest as `chore: wip`." | An uncommitted remainder means an AC is unfinished. Route back to `implement`. |
| "`pre-commit` passed on every commit, so the branch is green." | `pre-commit` runs the unit tier only. The browser, integration, and e2e tiers have not run yet. |
| "A test failed, so I'll rerun until it passes." | Check isolation first, then say which it was: a real failure, or a known load-sensitive spec. Never silently retry to green. |
| "I'll link the plan so reviewers have context." | `brain/plans/` is gitignored. Inline the decisions instead. |
| "I'll squash the AC commits into one clean commit." | The per-AC commits are the reviewable unit and the bisect unit. Keep them. |

## Output

```markdown
Branch: <name> (<n> commits ahead of main)
Gate: <commands and results>
PR: <url>
Caveat: <one sentence, only if needed>
```
