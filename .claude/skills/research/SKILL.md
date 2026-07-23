---
name: research
description: Use when planning or grilling needs external grounding the codebase and brain can't provide — prior art, competitor or library patterns, cross-domain analogies, or current market/version facts; triggers include "research this", "what's the prior art", "how do others solve this", "scan the landscape", "external best practice". Not for exact API-signature lookups (that's documentation-lookup/Context7).
context: fork
---

# Research

Turn an open-ended question into a structured external-grounding digest, then
persist only what's durable. The product is the digest plus any new
`brain/sources/` pointers — not a pile of raw search results.

The invariant this skill protects: **read the brain before searching the web,
and write only thin pointers back.** Never duplicate external doc content into
the brain; a source note points at the doc, it does not copy it.

## When to Use

Do not use this skill for:

- Exact API signatures or version-specific reference for a named library —
  that's `documentation-lookup` / a Context7-style docs MCP. Route there instead
  of running a landscape sweep.
- Anything answerable from `brain/` or the repo — read those first.

## Process

1. **Ground in the brain.** Read `brain/index.md`, then `brain/sources.md` and
   the relevant `brain/sources/` notes if present. A topic already pinned as
   authoritative is read in place, not re-researched from scratch — scope web
   work to the genuine gaps the pinned source leaves.
2. **Check tools.** Confirm a web-search capability and a web-fetch capability
   are both reachable (any shape — built-in, MCP, CLI; one tool covering both
   counts). If either is missing, report that web research is unavailable and
   stop.
3. **Scope.** Run broad searches across different angles of the topic to learn
   the vocabulary and the major players. Do not extract claims yet — orient
   only.
4. **Narrow and extract.** Issue sharper queries naming a specific technique,
   vendor, paper, or constraint; fetch the highest-value sources and capture
   concrete claims (numbers, names, mechanics). See
   [digest-format.md](./digest-format.md) for how to weigh sources.
5. **Gap-fill, then stop early.** One follow-up pass for any single-sourced
   load-bearing claim or uncovered dimension. Stop when searches start repeating
   sources — a short honest digest beats a padded one. The stop test lives in
   [digest-format.md](./digest-format.md).
6. **Offer to persist.** For sources worth keeping durably, propose a thin
   `brain/sources/<topic>.md` pointer (URL + one-line description) and hand the
   write to the `brain` skill's rules. Ask before writing.

## Stop and Ask

STOP and ask the user when:

- The question is too vague to scope — no domain, workload, or use case. Ask one
  or two narrowing questions before searching, the way `grill` does.
- A source would be persisted to `brain/` but its authority is contested, or
  persisting would overwrite an existing note whose intent is unclear.

Do not ask about facts discoverable by reading `brain/` or the repo.

## Red Flags

| Thought | Reality |
|---------|---------|
| "I'll paste the docs into the brain so it's all in one place" | Breaks the sources invariant. Pin a pointer; read the doc in place. |
| "More searches means a better answer" | Padding wastes the caller's context. Stop when sources repeat. |
| "The snippet says it, good enough" | Fetch and confirm load-bearing claims; snippets misquote and go stale. |
| "The brain has nothing useful, skip it" | Read it first anyway — a pinned source may already answer the question and save the whole sweep. |

## Output

Return the digest shape defined in [digest-format.md](./digest-format.md): a
one-line **Research value: high / moderate / low** assessment, then only the
non-empty sections (Prior Art, Adjacent Solutions, Market and Competitor
Signals, Cross-Domain Analogies, Sources). Keep it a compact synthesis within
the token budget there — never raw page dumps.

Then, separately, list any proposed `brain/sources/` pointers (path + URL +
one-line description) and ask before writing them.

## References

- [digest-format.md](./digest-format.md) — source-weighing heuristics, the exact
  digest sections, the stop test, the token budget, and untrusted-input
  handling.
- `brain` — owns the rules for writing `brain/sources/` pointers; defer the
  actual write to it.
- `grill`, `plan` — the planning skills that consume this digest for external
  grounding.
- `documentation-lookup` — the right tool for exact, current API reference of a
  named library; this skill defers to it.
