# brain/plans/<slug>.research.md Format

The research doc is grill's durable record of what the scouts found: the
codebase and external sources **as they exist today**, captured once so every
later phase reads it instead of re-discovering. It is the companion to the plan
(`brain/plans/<slug>.md`) — the plan is prescriptive ("what we will build"), the
research is descriptive ("what is there"). Keep the two strictly separate.

## The one rule that matters

**Describe what IS, not what SHOULD BE.** No recommendations, no proposed
changes, no critique, no root-cause theories, no "we could refactor this." Those
belong in the plan. If a finding tempts you to prescribe, restate it as an
observation and a citation. A reader should be able to trust this file as ground
truth regardless of which plan it spawned.

## Structure

```md
---
slug: <plan-slug>
git_commit: <short sha at time of research>
branch: <branch>
date: <ISO date>
---

# Research: <Topic>

**Research value: <high | moderate | low>** — <one line: which plan decisions
these findings ground, or that external signal was thin>

## Summary

2–4 paragraphs synthesizing what was found — the architecture, data flow, and
relationships that matter for this work. Synthesize; do not compress every
detail.

## Findings

Organize by concept, not by file. Each section explains how something works,
with citations woven in. Use tables for comparisons, mermaid for data flow,
code blocks for key signatures.

### 1. <Concept / component>

Prose explanation of what it is and how it works, citing locations inline as
ranges — e.g. (`src/checkout.ts:40-78`). Concept first, citation second.

**Testing patterns**: where and how this is currently tested (unit/integration/
e2e), mocks, fixtures. If untested, say so — that is a finding.

### 2. <Concept / component>
...

## External sources

Library / API / SDK facts that the plan depends on, each doc-verified (not from
memory) with the source URL, the version it was checked against, and its
deprecation status (the deprecation/sunset check is a prerequisite before any
external API enters a plan contract).
- <fact> — <source URL>, version <x.y>, deprecated: <no | YYYY-MM, migration URL>

## Code references

Comprehensive, grouped list a developer can navigate the whole area from. Note
when a group is exhaustive vs. covers key files only.
- `path/to/file.ts:28-36` — what's there
- `path/to/dir/` — directory contents (key files listed, others exist)

## Coverage ledger

The fixed surface taxonomy (see grill's RESEARCH-GATE.md), each row carrying its
status so grill's interview and coverage gate can walk it. Descriptive: it
records what is known vs. still open, not what to do. Status is one of
`resolved-by-evidence` (cite the finding — produces no question),
`open-needs-user` (becomes a question carrying a default), or `n/a-derived`
(a one-line reason it does not apply).

| Surface | Status | Note / grounding / default |
|---------|--------|----------------------------|
| Contracts (interface / data / API) | resolved-by-evidence | <finding heading> |
| Lifecycle & state transitions | open-needs-user | default: <…> |
| Failure modes & error/retry | <status> | <…> |
| Permission & ownership boundaries | <status> | <…> |
| Source-of-truth / conflict resolution | <status> | <…> |
| Experience quality bar | n/a-derived | CLI tool, no UI |
| External / version facts & deprecation | resolved-by-evidence | <source>, deprecated: no |

## Open questions

Genuine investigative gaps — "how does X reach Y?", not "should we refactor Z?".
If none, say "None."
```

## Rules

- **Descriptive only** — see the one rule above. Prescription lives in the plan.
- **Research non-normatively; scouts must not be told what is being built.**
  Brief every scout on how the system works *today*, never on the intended
  change: "how does rest-timer state persist across reload" — never "how would we
  add X". A scout that knows the desired answer finds evidence for it, and the
  bias lands in this file as fact. The grill lead reads the ticket (it seeds
  *what* to research); the scouts do not. This is what makes the file's claim
  true — a reader can trust it as ground truth regardless of which plan spawned
  it, and it stays usable for the next three tasks.
- **Concept-first citations.** Say what something does, then cite where it lives.
  BAD: "`app.ts:57` creates WorkosService / `app.ts:58` creates S3Service."
  GOOD: "Services are module-level singletons created at startup in
  `app.ts:57-80`: WorkosService, S3Service, JiraService."
- **Cite ranges, not lines.** Adjacent facts from one file use `file.ts:45-67`.
- **Pin the commit.** The frontmatter `git_commit` lets a later phase tell
  whether the code moved past what was researched (same convention as
  `brain/codebase/` maps).
- **Verify external facts.** Every library/API claim cites a fetched source URL
  and version — never training data.
- **Self-contained.** A later phase should understand the area from this file
  alone; citations support the narrative, they don't replace it.
- **Give findings stable headings.** The plan links decisions back to findings
  (`[[<slug>.research#<finding>]]`), so each finding section needs a clear,
  durable heading to anchor to. Name findings for the concept, not "Finding 1".
- **Write whenever research ran.** Create the doc whenever any scout ran or any
  external fact was fetched — the trigger is positive, not a judgment call. Skip
  only when neither happened (a genuinely trivial plan).
- **Recommendations feed the plan, not this doc.** Anything a scout or
  `research` proposes becomes a plan decision or a ledger default; the
  research doc stays strictly descriptive.
- **Drop non-load-bearing findings.** Every finding must surface in a plan
  decision, contract, acceptance criterion, or risk. If it shaped nothing, it
  was not load-bearing — cut it rather than padding an appendix.
- **Keep it fresh within the session.** When the interview surfaces a new
  what-is fact, append it as a finding before the plan cites it.
