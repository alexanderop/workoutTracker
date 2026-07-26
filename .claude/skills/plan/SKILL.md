---
name: plan
description: Use when breaking a medium-to-large task into phased, principle-grounded plans written to brain/plans/ — new features, multi-file refactors, or architectural changes, not small fixes; triggers include "plan this", "break this down".
---

# Plan

Produce implementation plans grounded in the brain's principles and write them to
`brain/plans/`. **Do NOT implement anything — the plan is the deliverable.**

## When to Use

For interview-style stress-testing of a vague idea before a plan exists, use
`grill`; `plan` assumes intent is already clear enough to decompose.

## Process

### Step 0 — Triage complexity

If the task is trivially small (1–2 files, obvious approach), tell the user it
doesn't need a plan and suggest implementing directly. Otherwise proceed.

### Step 1 — Load principles

If the vault has principles, read them fresh: `brain/principles.md`, following
every `[[wikilink]]` to each linked principle file. They govern all plan
decisions — refer back to them throughout, and do not rely on memorized
principle content. A fresh project may have none; then proceed without inventing
principles.

### Step 2 — Define scope and constraints

Resolve ambiguity before exploring the codebase: what is in vs. out of scope,
what constraints apply (dependencies, platform, patterns to preserve), and what
"done" looks like. Ask with concrete options, one decision at a time. If the
request is already clear, confirm boundaries briefly and move on.

### Step 3 — Explore context with subagents

**Always** delegate large-scale exploration to subagents (`subagent_type:
Explore`) via the Task tool — never explore in the main context. Spawn agents to
read affected code, identify patterns/conventions/dependencies, map relevant
architecture, and find tests, types, and infrastructure. Run multiple in parallel
for independent areas.

### Step 4 — Gather domain skills

Check installed skills (`.claude/skills/`, and any project skill directory) for
ones matching the plan's domain. **Invoke matched skills** and incorporate their
guidance. If a relevant skill isn't installed and a skill-search tool is
available, search, install project-locally, and note what was installed; delete
one-off skills after the plan is written.

### Step 5 — Write the plan

Write plan files manually under `brain/plans/`:

1. Create `brain/plans/NN-slug-name/overview.md` (or a single file for simple plans).
2. Create phase files as needed.
3. Update `brain/plans/index.md` with a link to the new plan.

**Phase sizing:** 1 function/type + tests per phase, or 1 bug fix — not "one
file". Max 2–3 files touched per phase. Prefer 8–10 small phases over 3–4 large
ones. Split a phase that lists >5 test cases or >3 functions.

For 3+ phases use a directory:

```
brain/plans/42-mvp/
├── overview.md
├── phase-1-scaffold.md
├── phase-2-layout.md
└── testing.md
```

**Overview file** must include: Context (problem and why), Scope (in/out),
Constraints, Applicable skills (by name), Phases (ordered links like
`[[plans/42-mvp/phase-1-scaffold]]`), Test Scope (see Step 6), and Verification
(project-level commands).

**Phase files** must include: a back-link (`Back to [[plans/42-mvp/overview]]`),
Goal, Changes (files affected, high level), Data structures (name key
types/schemas — one-line sketch, not full definitions), and Verification (the
Automated/Manual checkbox lists, see Step 6).

**Keep plans high-level** — describe *what* and *why*, not *how* at the code
level. A phase reads like a brief to a senior engineer. Order phases per the
sequencing principle: shared types/infrastructure first, features after; each
phase independently shippable.

**Skill changes:** if a phase creates or updates a skill, the phase must instruct
the implementer to use a skill-authoring skill (e.g. `skill-creator`) during it.

**Redesign check:** for changes to existing code, apply
redesign-from-first-principles — "if we built this from scratch with this
requirement, what would we build?" Don't bolt on; redesign holistically.

**Alternatives check:** for architectural decisions, sketch 2–3 approaches in the
overview's Constraints section, state which was chosen and why.

### Step 6 — Verification strategy

The overview **must** carry a `## Test Scope` section: the scoped commands that
cover this plan, with the reach of each. Every phase runs those, never the bare
full tier — the whole browser tier is ~5 minutes locally, and CI shards it four
ways and runs a11y, visual, e2e, and coverage alongside it on the PR. Scope by
what the change can break, not by the files it edits; a cross-cutting change may
honestly need the whole tier, and if so, say so and say why. Filters match
**test** paths under `src/__tests__/`, not source paths — a filter on
`src/features/x` matches nothing and exits 1.

Split runnable commands from prose. Only the **Commands** bullets are *entries* —
what phases execute and turn into checkboxes. A note living among them becomes
an unrunnable verification box.

```markdown
## Test Scope

**Commands** — the entries every phase runs.

- `pnpm exec vitest run --project=default src/__tests__/features/<feature>` — [what this covers]
- `pnpm exec vitest run --project=unit src/__tests__/unit/<area>` — [what this covers]

**Notes** — context only; never executed, never a checkbox.

- Widen to: [specs outside the feature this change can break] (or "nothing else")
- Full tier locally: not run — CI runs it on the PR.
```

Every phase **must** have a verification section, written as a literal checkbox
list with the exact command inline — not prose. The checkbox is not cosmetic: it
is the **resume token**. A fresh session reads the plan, finds the first
unchecked box, and continues from there; prose verification cannot be resumed
from.

```markdown
#### Automated Verification:
- [ ] Type checking passes: `pnpm type-check`
- [ ] Lint passes: `pnpm lint`
- [ ] Unit tier passes: `pnpm test:unit`
- [ ] [Test Scope Commands entry 1, copied verbatim]
- [ ] [Test Scope Commands entry 2 — one box per entry, all of them]
- [ ] Full suite: CI on the PR — not run locally

#### Manual Verification:  [emit this subsection only when the phase needs one]
- [ ] [specific, actionable step]
```

- **Automated** — type checking, linting, and the tests written for this phase.
  Emit **one box per `## Test Scope` Commands entry — every entry, in every
  phase**, copying each command verbatim with its own `--project` and path. Do
  not filter the list down to the entries you judge this phase to affect: that
  judgment is exactly what goes wrong silently, and the whole point of a scoped
  command is that running it costs seconds. The scope is already the small list;
  sub-selecting from it buys nothing and can drop the one command that would
  have caught the regression. Never wrap a recorded path in another prefix — the
  entries are complete commands, so prefixing one yields
  `src/__tests__/src/__tests__/…` and matches nothing. A scope spanning the
  `unit` and `default` projects gives every phase two boxes. A bare `pnpm test`
  box does not belong in a phase; point it at a `## Test Scope` entry instead.
- **Manual** — what to exercise by hand, edge cases, and (for UI) visual
  verification via screenshot.

Not every phase requires manual validation. When none is needed, omit the whole
subsection, heading included — don't leave an empty placeholder box. Resume
starts at the first unchecked box, so a box nobody intends to tick strands the
plan short of done and invites invented steps to clear it. When a phase does
need manual proof, the bar stands: per prove-it-works, "it compiles" is not
verification. Every box must be something that **proves** the change works.

### Step 7 — Update plans index

Update `brain/plans/index.md` with a wikilink to the new plan's overview. Do NOT
edit `brain/index.md` — the auto-index hook maintains it.

### Step 8 — Present to user

Summarize the plan: phases, scope boundaries, applicable skills, verification
approach. Ask the user to review the files in `brain/plans/`.

## Stop and Ask

STOP and ask the user when scope, constraints, or the definition of "done" are
ambiguous (Step 2), and when an architectural decision has multiple viable
approaches with real trade-offs. After presenting the plan (Step 8), **stop** —
do not begin implementation. The user decides when and how to execute.

## Output

Plan files under `brain/plans/` (`NN-slug/overview.md` + phase files, or a single
`NN-plan-name.md`), plus an updated `brain/plans/index.md`. Hand off to
`implement` (or the user) for execution.
