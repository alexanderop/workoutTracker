---
name: map-codebase
description: Use when you want a durable, reusable map of how an existing part of the codebase works as-is — "map the codebase", "document how auth is wired today", "survey this module", "how is X wired in this repo" — persisted to brain/codebase/ for future sessions. Produces neutral reference, never a plan; not for planning or stress-testing intent (grill/plan), judging quality or finding bugs (review/simplify), or external prior art (research).
context: fork
---

# Map Codebase

Turn a read of an existing area into a durable, prescription-free map at
`brain/codebase/<area>.md`, pinned to the commit it was read at. The product is
the map — observed structure future sessions start grounded in, not a plan.

The invariant this skill protects: **document what IS, not what SHOULD BE.** A
map records where code lives, how it flows, and the gotchas it carries — it
recommends nothing. That neutrality is the whole point: an opinionated map
serves one task and rots; a descriptive one is reusable by every future task,
which is why grill, the implement orchestrator, and qa can all read it as ground.

## When to Use

Use this skill when:

- grill or implement keep re-discovering the same area, and you want that
  grounding persisted once instead of re-derived every run.
- A complex subsystem is worth onboarding into the brain so future sessions
  start grounded.

Do not use this skill for:

- Planning a change or stress-testing intent — that's `grill` / `plan`. This
  skill decides nothing and prescribes nothing.
- Judging quality, finding bugs, or proposing cleanups — that's `review` /
  `simplify`.
- External prior art or library landscape — that's `research` (it writes
  `brain/sources/`; this skill is internal-only, `brain/codebase/`).
- A one-file question you can answer by reading the file once. A map is for an
  area worth persisting, not a lookup.

## Process

1. **Ground in the brain first.** Read `brain/index.md`, then `brain/codebase.md`
   and any existing `brain/codebase/<area>.md` for your target. If a current map
   already covers this area, extend or correct it in place — never write a second
   note for the same area.
2. **Scope to one area.** Map a single subsystem per note (auth, billing, the
   job queue), not the whole repo. If asked to "map everything", split it into
   areas and map them as separate linked notes — see Stop and Ask.
3. **Dispatch bounded read-only scouts in parallel** (the same pattern `grill`
   uses), each carrying the documentarian constraint verbatim — "report only
   what the code IS; no recommendations, refactors, or root-cause; list what you
   cannot determine as an open question":
   - Locator: where the area lives — entrypoints, files, directories, ownership.
   - Analyzer: how it works — data and control flow, lifecycle, contracts as
     they are.
   - Pattern scout: concrete existing examples of the area's conventions, with
     `path:line` references.
4. **Synthesize and verify yourself.** Read the load-bearing files the scouts
   cite before any claim enters the map — a scout report is a lead, not a fact.
5. **Capture the pin.** Run `git rev-parse --short HEAD` and
   `git branch --show-current`, and note which paths the map covers. If
   `git status` shows those paths are dirty, the pin will misrepresent what you
   read — see Stop and Ask.
6. **Write the map** to `brain/codebase/<area>.md` following the `brain` skill's
   rules (one topic per file, summary line first, under ~50 lines), and add a
   wikilink to it in `brain/codebase.md` if absent. Defer the write conventions
   to `brain`. Do not edit `brain/index.md` — the PostToolUse hook maintains it.

## Stop and Ask

STOP and ask the user when:

- The area to map is unspecified or is "the whole repo" — ask which subsystem or
  boundary to map first, so the note stays scoped and scannable.
- The covered paths have uncommitted changes that would make the commit pin lie
  about what you read — ask whether to commit or stash first, or to proceed and
  record the tree as dirty in the pin.

Do not ask about anything discoverable by reading the repo or the vault.

## Red Flags

| Thought | Reality |
|---------|---------|
| "This code is messy — I'll note it should be refactored." | Document what IS. Recommendations belong to `review`/`simplify`/`plan`; an opinionated map biases the next task and rots. No exceptions. |
| "I'll skip the commit pin." | Without it a reader cannot tell whether the map is stale. Capture the sha and covered paths; flag a dirty tree. |

## Output

Write `brain/codebase/<area>.md` in this shape — the summary line stays on line 2
(the index hook extracts it as the note's description), and the pin is the last
line so it is never mistaken for the summary:

```markdown
# <Area>

<One-line as-is summary: what this area is and does — a relevance hint a future session can scan.>

## Map
- <where things live: entrypoints, files, directories, ownership> (`path:line`)

## How it works
- <observed data and control flow, lifecycle, contracts as they ARE>

## Patterns in use
- <concrete existing examples to mimic> (`path:line`)

## Gotchas observed
- <factual landmine — no fix proposed>

---
_Mapped at `<sha>` on `<branch>`, <date> · covers `<path globs>`._
```

Then tell the user the map path (`brain/codebase/<area>.md`), the commit it is
pinned to, and that grill and the implement orchestrator will read it as
observed ground on the next run.

## References

- `brain` — owns the `brain/codebase/` write conventions; defer the actual write
  and entrypoint update to it.
- `grill`, `implement-orchestrator` — consume a codebase map as observed ground
  before forming questions and contracts.
- `reflect` — opportunistically maintains `brain/codebase/` notes between
  deliberate mapping passes; this skill is the deliberate producer.
- `research` — the external counterpart (`brain/sources/`); this skill is the
  internal one (`brain/codebase/`).
