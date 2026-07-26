---
name: review
description: Use when asked to review, critique, or assess the quality of code changes, PRs, or plans against the brain's principles, producing verified, numbered findings and a verdict without making changes.
context: fork
---

# Review

Principle-grounded review of a specific change. **Do NOT make changes — the
review is the deliverable.** Two invariants: every finding is *verified against
the real code path* before it is reported, and every reported finding is
numbered, severity-rated, mapped to a principle, and offered with options, so
the user can act on it deliberately.

This skill runs in a forked context (`context: fork`). That is a correctness
property, not a token optimization: a reviewer that watched the code being
written grades its own reasoning. Judging the diff cold is the point.

Two consequences follow. You cannot talk to the user — your findings are a
return value, and the caller presents them and asks for direction. And you start
with none of the implementation conversation, so read what you need from the
diff, the code, and the brain rather than assuming context you were not given.

## When to Use

Use this skill when:

- The user asks to review, critique, or assess code, a PR, or a plan.
- You need a principle-grounded read on quality before accepting work.

Do not use this skill to *apply* fixes — that's `simplify` (cleanup) or
`implement` (changes). Review only diagnoses. Review is also source-aware: it
judges the diff, not the running app. A clean review is not proof the feature
works on a phone. For evidence-based ship/no-ship verification of a running
flow, use `qa` — the two are complements, not substitutes.

**Exception:** a change whose entire diff is `brain/` notes or skill prose needs
no assessment pipeline. Read the diff, check the claims against the code they
describe, and report. Documentation that ships to users — README, PR bodies,
anything a contributor follows as instructions — is not covered by this
exception.

## Process

### Step 1 — Load principles

If the vault has principles, read them fresh: `brain/principles.md`, following
every `[[wikilink]]` to each linked principle file. They govern review
judgments; do not rely on memorized principle content. Also skim
`brain/lessons/` — a lesson is a defect the project already paid for once. A
fresh project may have none; then review against general engineering standards
without inventing project principles.

### Step 2 — Pick the review target

Name the exact diff under review before reading a line of it. Do not "infer
scope from context" and start reading files — an unnamed target is how a review
ends up proving something nobody asked about.

| Situation | Target |
|---|---|
| Uncommitted work in the checkout | `git diff HEAD` plus untracked files |
| Feature branch, committed or pushed | `git diff <base>...HEAD` |
| A landed commit | `git show <ref>` |
| An open PR | its base: `gh pr view --json baseRefName --jq .baseRefName` |

Two failure modes to avoid. Reviewing the working tree after the work was
committed shows an empty diff — a clean tree proves there is no local patch,
nothing more. And reviewing `main` against `origin/main` after a push is also
empty; review the branch before merge, or the commit after.

For a PR target, read the existing feedback first with `pnpm -s pr:comments` —
`gh pr view --comments` silently omits review summaries and line comments. Do
not re-report a finding a human reviewer already raised; note agreement and
move on.

Record the tree you are reviewing: `git rev-parse HEAD`, and a hash of
`git status --porcelain`. A BIG CHANGE review fans out to parallel subagents and
can run for many minutes; if the tree moves underneath it — a `qa` run, a stray
edit, a rebase — every line number in the report describes a file that no longer
exists in that form. Step 8 re-checks both.

State the target and its base in the report. Then size the review:

- **BIG CHANGE** (50+ lines, 3+ files, or new architecture) — all sections.
- **SMALL CHANGE** — the sections that apply; skip the rest silently.

### Step 3 — Gather context

For **SMALL CHANGE**, read files directly in the main context. For **BIG
CHANGE**, delegate exploration to subagents (`subagent_type: Explore`) via the
Task tool to read the code/plan, identify dependencies and downstream effects,
and map types/tests/infrastructure. Parallelize independent areas.

Read the diff *and* what it touches. A finding derived from the diff alone is a
guess: the caller may already guard the case, a converter may already handle the
old shape, a test may already cover it. When a judgment depends on external
behavior — Vue reactivity, Dexie transaction semantics, a shadcn primitive's
contract — read the types or fetch the docs via Context7 rather than reasoning
from memory.

Do not go looking for peer skills to invoke. A cold reviewer that loads a
sibling skill inherits that skill's framing and starts grading the diff against
the goals it was written to pursue — which is the same self-grading the fork
exists to prevent. Review from the diff, the code, the brain, and whatever
domain guidance the caller handed you explicitly.

### Step 4 — Assessment pipeline

Work through the applicable sections, checking each against loaded principles.
This stage produces *candidates*, not findings. Nothing here is reportable until
it survives Step 5.

1. **Scope check** — if reviewing against a plan phase: read the assigned phase,
   run `git diff --stat` and `git log --oneline`, and flag files changed outside
   the phase's stated scope. Check the commit shape too: one commit per
   acceptance criterion, Conventional Commits with a scope. Skip if no plan
   phase applies.
2. **Architecture** — system design, component boundaries, coupling, data flow.
   Project-specific hard rules: features never import from other features;
   shared state uses VueUse `createGlobalState()`, not Pinia; all DB access goes
   through `src/db` repositories; code with a single consumer lives in its
   feature, not in `src/composables/` or `src/components/`.
3. **Data durability** — the local-first analogue of a security review, and
   where this project's irreversible defects live. A Dexie schema change
   requires a converter update for backward compat; a stored shape that changes
   without one silently breaks existing users' data with no server to repair it
   from. Check export/import round-trips and anything that writes or migrates
   IndexedDB. Report a durability finding when the change creates a concrete
   path to data loss or unreadable history — not for speculative hardening.
4. **Code quality** — organization, DRY violations (be aggressive), error
   handling and missing edge cases, over/under-engineering vs. principles,
   technical-debt hotspots. UI state that could form invalid combinations should
   be a discriminated union, not loose booleans.
5. **Tests** — coverage gaps, assertion strength, missing edge cases, untested
   failure paths. New behavior must have new tests asserting outcomes, not
   implementation details. Specs live under `src/__tests__/` mirroring the
   source tree — a spec colocated with source is a finding, because the path
   filters everything else depends on will never match it. If the change came
   from a plan, check its `## Test Scope` actually covers what the change can
   break, not just the file that was edited.
6. **Performance** — this app runs on a phone, mid-workout, offline. Weight
   findings by whether they slow down logging a set: input latency, main-thread
   work, IndexedDB round-trips in a render path, bundle weight on the critical
   route. Server-shaped concerns (N+1 queries against a backend that does not
   exist) are not findings here.
7. **Principle compliance** — for each changed file, check against loaded
   principles (bolted-on vs. redesign, missing verification, added complexity).

### Step 5 — Verify every candidate before reporting it

This step is the difference between a review and a list of guesses. Take each
candidate and try to **refute** it. Default to dropping it: a candidate you
cannot demonstrate is a candidate that does not get reported.

For each candidate, do the work that would prove it wrong:

- Open the real code path end to end — the callee, not just the call site; the
  guard clause above; the converter; the default value in the type.
- Search for an existing test that already covers it. If one exists, the
  candidate is dead.
- For anything depending on library behavior, read the types or the docs. "I
  believe Dexie does X" is not verification.
- For a bug claim, write the concrete failure: exact input or state → wrong
  output, crash, or lost data. A claim with no reproducible path is a smell,
  and a smell is at most a low-severity note.
- Check whether the diff introduced it. If `git blame` shows the line predates
  this change, it is **pre-existing** — label it that way, cite the commit SHA
  and date, and never frame it as something this change's author broke.

Drop candidates that are: unrealistic edge cases, speculative future risk,
"this would be better architected as…" without a concrete defect, broad
rewrites, or fixes that would add more complexity than the problem costs. A
codebase-wide preference is not a finding about this diff.

For a **BIG CHANGE**, or when a blocking finding rests on your own reading of a
subtle path, delegate refutation: give an independent `Explore` subagent the
claim and ask it to prove the claim wrong from the code. Report the finding only
if the refutation fails.

### Step 6 — Classify each surviving finding

Review is a gate on *this* change, not a mandate to rewrite the task.

Keep the changed-file list from Step 2 in front of you. A finding whose cited
path is not on that list was not introduced by this diff, whatever its merits —
it cannot be labeled in-scope and it cannot block. Check the path before
assigning the label, not after; "it's related to the change" is how a review of
one Dexie converter becomes a review of the whole `src/db` layer.

Label every finding:

- **In-scope** — introduced by this diff, inside the same owner boundary, and
  fixable without changing the change's contract.
- **Follow-up** — real, but an adjacent bug class, a sibling surface, or
  pre-existing cleanup. Report it, never block on it.
- **Escalate** — real, and fixing it requires a new contract: a schema or
  storage shape, a public API, a different owner boundary, or a design decision
  outside the original request. Say so explicitly and stop there. Do not spec
  the redesign.

Only **in-scope** findings can be high severity. If the honest read is "this PR
should have been a different PR", that is one escalate finding, not fifteen
in-scope ones.

### Step 7 — Write the findings

Report blocking findings first and in full. **NUMBER** each. For every one:
describe it concretely with file/line references; assign **severity**; state the
concrete failure it causes; present 2–3 options **lettered** A/B/C (including
"do nothing" where reasonable) with effort, risk, blast radius, and maintenance
burden; and give a recommended option mapped to a principle, recommended first.
Label options with issue NUMBER + option LETTER so the caller can put them to
the user verbatim. Do not ask the question yourself — you are forked and cannot
hear the answer.

Medium and low findings get one numbered line each: what, where, why it is not
blocking. No lettered options — options are for decisions the user has to make
now.

Severity guide — **high**: incorrect behavior, data loss or unreadable stored
history, missing tests for new behavior, scope violation on core files,
architecture-changing principle violation. **medium**: worth fixing, not
blocking alone (multiple may block). **low**: style/docs/minor — note, don't
block.

There is no quota. If nothing survived Step 5, say so plainly and stop — a
review that reports no blocking findings is a complete review, not a lazy one.
Padding the list with medium findings to look thorough spends the user's
attention on noise and devalues the findings that matter.

### Step 8 — Verdict

Re-check the tree first. Re-run `git rev-parse HEAD` and re-hash
`git status --porcelain`, and compare both against what Step 2 recorded. If
either moved, the findings describe a tree that no longer exists: say so, name
what changed, and re-verify every cited line before issuing a verdict. A stale
`Accept` is worse than no review, because it is indistinguishable from a real one.

- **Accept** — all checks pass, scope clean, tests present and passing.
- **Accept with notes** — low-severity issues only; list for optional follow-up.
- **Revise** — high-severity issues found; give specific actionable feedback with
  exact file, line context, and principle violated.

## Stop and Ask

You are forked, so you cannot stop and ask. When scope is genuinely uninferable
(nothing in the message, diff, or referenced plan to go on), return that as the
finding — say what you could not determine and what input would settle it — and
let the caller ask. Do not assume priorities on timeline or scale.

## Output

The review target and base, then findings grouped by severity, then one overall
verdict. This text is the return value the caller receives, not a message to a
human: no preamble, no "let me know if you'd like me to" closing. The caller
presents it and asks.

```markdown
Target: <mode> — <ref>...<ref> (N files, M non-test lines)

## Blocking (high)
1. <finding> — `src/path.ts:42` — <concrete failure> — [in-scope]
   A. ... B. ... C. ...
   Recommended: 1B — <principle>

## Notes (medium / low)
2. <finding> — `src/path.ts:88` — <why not blocking> — [follow-up]

## Verdict: Accept | Accept with notes | Revise
```

## Red Flags

| Thought | Reality |
|---------|---------|
| "The fix is one line — I'll just apply it." | Review diagnoses; it never edits. Write it up as a numbered finding and let the user decide. |
| "I'll ask the user which option they prefer." | You are forked. Return the lettered options; the caller asks. |
| "The implementer said this was intentional, so it is fine." | You did not see that conversation and should not reconstruct it. Judge the diff on its own terms — that is why this review runs cold. |
| "This looks wrong from the diff." | The diff is not the code path. Open the callee, the guard, the converter, and the tests before it becomes a finding. |
| "I found nothing, so I'll dig until I have something." | No blocking findings is a real result. Report it and stop. |
| "Each section should have a few issues." | There is no quota. Sections are a search strategy, not a template to fill. |
| "The whole area needs restructuring." | That is one escalate finding, not a review of this change. Say it once and stop. |
| "This existing bug is nearby, so it blocks the PR." | `git blame` it. Pre-existing defects are follow-ups with provenance, not blockers on this author. |
| "A clean review means it's ready to ship." | Review is source-aware. Whether it works on a phone is `qa`'s call. |
