---
name: review
description: Use when asked to review, critique, or assess the quality of code changes, PRs, or plans against the brain's principles, producing numbered findings and a verdict without making changes.
context: fork
---

# Review

Principle-grounded review of every changed file in a PR, plan, or set of code
changes. **Do NOT make changes — the review is the deliverable.** The invariant:
every finding is numbered, severity-rated, mapped to a principle, and offered with
options, so the user can act on it deliberately.

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
`implement` (changes). Review only diagnoses. For evidence-based ship/no-ship
verification of a running flow, use `qa`.

## Process

### Step 1 — Load principles

If the vault has principles, read them fresh: `brain/principles.md`, following
every `[[wikilink]]` to each linked principle file. They govern review
judgments; do not rely on memorized principle content. A fresh project may have
none; then review against general engineering standards without inventing
project principles.

### Step 2 — Determine scope

Infer what to review from context (the user's message, recent diffs, referenced
plans/PRs). Auto-detect mode from change size:

- **BIG CHANGE** (50+ lines, 3+ files, or new architecture) — all sections, at
  most 4 top issues per section.
- **SMALL CHANGE** — one issue per section.

### Step 3 — Gather context

For **SMALL CHANGE**, read files directly in the main context. For **BIG
CHANGE**, delegate exploration to subagents (`subagent_type: Explore`) via the
Task tool to read the code/plan, identify dependencies and downstream effects,
and map types/tests/infrastructure. Parallelize independent areas.

### Step 4 — Gather domain skills

Check installed skills (`.claude/skills/`, and any project skill directory) for
ones matching the review's domain and **invoke matched skills** to inform the
review. If a skill-search tool is available, search for relevant uninstalled
skills.

### Step 5 — Assessment pipeline

Work through all sections in order; check each against loaded principles.

1. **Scope check** — if reviewing against a plan phase: read the assigned phase,
   run `git diff --stat` and `git log --oneline`, and flag files changed outside
   the phase's stated scope. Skip if no plan phase applies.
2. **Architecture** — system design, component boundaries, coupling, data flow,
   security architecture (auth, data access, API boundaries).
3. **Code quality** — organization, DRY violations (be aggressive), error
   handling and missing edge cases, over/under-engineering vs. principles,
   technical-debt hotspots.
4. **Tests** — coverage gaps, assertion strength, missing edge cases, untested
   failure paths. New behavior must have new tests asserting outcomes, not
   implementation details.
5. **Performance** — N+1 queries, memory concerns, caching opportunities, slow or
   high-complexity paths.
6. **Principle compliance** — for each changed file, check against loaded
   principles (bolted-on vs. redesign, missing verification, added complexity).

### Step 6 — Issue format

**NUMBER** each issue. For every issue: describe it concretely with file/line
references; assign **severity** (high / medium / low); present 2–3 options
**lettered** A/B/C (including "do nothing" where reasonable) with effort, risk,
blast radius, and maintenance burden; and give a recommended option mapped to a
principle, recommended first. Label options with issue NUMBER + option LETTER so
the caller can put them to the user verbatim. Do not ask the question yourself —
you are forked and cannot hear the answer.

Severity guide — **high**: incorrect behavior, missing tests for new behavior,
scope violation on core files, architecture-changing principle violation.
**medium**: worth fixing, not blocking alone (multiple may block). **low**:
style/docs/minor — note, don't block.

### Step 7 — Verdict

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

Numbered findings grouped by section, then one overall verdict. This text is the
return value the caller receives, not a message to a human: no preamble, no
"let me know if you'd like me to" closing. The caller presents it and asks.

## Red Flags

- "The fix is one line — I'll just apply it." Review diagnoses; it never edits.
  Write it up as a numbered finding and let the user decide.
- "I'll ask the user which option they prefer." You are forked. Return the
  lettered options; the caller asks.
- "The implementer said this was intentional, so it is fine." You did not see
  that conversation and should not reconstruct it. Judge the diff on its own
  terms — that is why this review runs cold.
