---
name: simplify
description: Use when implement has landed, when the user asks to simplify or clean up changed code, or when they ask to deduplicate, DRY, or review quality without hunting for bugs
context: fork
---

# Simplify

Improve changed code quality by finding and fixing reuse, simplification,
efficiency, and altitude issues. This is not a correctness review: do not hunt
for bugs or broaden the scope beyond the reviewed changes.

Core principle: review the target diff from four independent cleanup angles,
deduplicate the findings, then apply only fixes that preserve intended behavior.

## When to Use

Use this after `implement` lands or when the user asks for changed code to
be simplified, cleaned up, deduplicated, or made DRY.

If the user passes a PR number, branch name, or file path, use that argument as
the review target. Otherwise, review the current changed-code diff.

## Process

1. Gather the review scope.

   Run `git diff @{upstream}...HEAD` to get the unified diff under review. If
   there is no upstream, use `git diff main...HEAD` or `git diff HEAD~1`.

   If there are uncommitted changes, or the range diff is empty, also run
   `git diff HEAD` and include working-tree changes in scope. This review often
   runs before the commit.

   If the user supplied a PR number, branch name, or file path, review that
   target instead.

2. Launch four independent review agents in parallel.

   Use the Task tool in a single message so all four run concurrently. Pass
   each agent the diff and exactly one cleanup angle, with its definition:

   - Reuse: Flag new code that re-implements something the codebase already
     has. Grep shared or utility modules and files adjacent to the change, then
     name the existing helper to call instead.

   - Simplification: Flag unnecessary complexity added by the diff: redundant or
     derivable state, copy-paste with slight variation, deep nesting, or dead
     code left behind. Name the simpler form that does the same job.

   - Efficiency: Flag wasted work added by the diff: redundant computation,
     repeated I/O, independent operations run sequentially, or blocking work
     added to startup or hot paths. Also flag long-lived objects built from
     closures or captured environments because they keep the enclosing scope
     alive for the object's lifetime; prefer a class or struct that copies only
     the fields it needs. Name the cheaper alternative.

   - Altitude: Check that each change is implemented at the right depth, not as
     a fragile bandaid. Special cases layered on shared infrastructure indicate
     the fix may not be deep enough; prefer generalizing the underlying
     mechanism over adding special cases.

   Require each agent to return findings with `file`, `line`, a one-line
   `summary`, and the concrete cost: what is duplicated, wasted, or harder to
   maintain.

3. Aggregate and apply the fixes.

   Wait for all four agents to complete. Deduplicate findings that point at the
   same line or mechanism. Do not re-review the diff yourself; the agents
   already did the review. Fix each remaining valid finding directly.

   Skip findings whose fix would change intended behavior, require changes well
   outside the reviewed diff, or appear to be false positives. Note each skip
   instead of arguing with it.

## Stop and Ask

STOP and ask when the intended behavior is ambiguous and the cleanup would pick
between product outcomes.

STOP and ask when the only plausible fix requires changing files or systems far
outside the reviewed diff.

Do not ask before skipping a finding that is clearly a false positive or clearly
outside this skill's quality-only scope; note the skip in the output.

## Red Flags

| Thought | Reality |
|---------|---------|
| "This looks buggy." | Correctness review is out of scope. Only fix it if the cleanup is behavior-preserving. |
| "The helper could be generalized later." | If the diff duplicated an existing helper now, use the existing helper now. |
| "The special case is small." | Small special cases on shared infrastructure may be altitude issues. Check whether the mechanism should be generalized. |
| "One agent found it, so apply it." | Deduplicate and judge findings before editing. Skip behavior changes, broad rewrites, and false positives. |

## Output

Finish with a brief summary in this shape:

```markdown
Changed:
- [reuse/simplification/efficiency/altitude] What was fixed.

Skipped:
- Finding skipped and why.

Verification:
- Scoped commands run (the plan's `## Test Scope`, or the specs covering the
  files you touched), or "Not run" with the reason. Not the full tier — CI runs
  that on the PR.
```

If the code was already clean, say that no cleanup changes were needed and
include any verification run.
