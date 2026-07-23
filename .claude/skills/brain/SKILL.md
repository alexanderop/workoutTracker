---
name: brain
description: Use when a task needs to read or write the persistent brain/ vault — adding a principle, codebase gotcha, or note, or grounding work in existing memory; triggers include "add to brain", "remember this in the brain", or any direct brain/ edit.
---

# Brain

Persistent memory across sessions, kept as an Obsidian vault at `brain/`. The
brain is the foundation of the whole flow — every skill and session reads it, so
low-quality or speculative content degrades everything downstream.

The invariant this skill protects: every brain file is reachable from
`brain/index.md`, holds one topic, and earns its place (see Durability test).

## When to Use

Do not use this skill for:

- Plan-specific notes (update the plan's docs instead).
- Skill process fixes (edit the skill file directly).
- Things a lint rule, script, or metadata flag could enforce structurally.

## Process

1. **Read first.** Read `brain/index.md`, then the relevant entrypoint for your
   topic (`brain/principles.md` for principle updates). For directories without
   a dedicated index yet, scan nearby files and prefer editing an existing note.
2. **Apply the durability test** before writing — see below.
3. **Write** one topic per file, following Structure and Writing Style below.
4. **Update entrypoints.** Edit the relevant index entrypoint (e.g.
   `brain/principles.md`). `brain/index.md` is rebuilt automatically by the
   PostToolUse hook — do not hand-edit it.
5. **Maintain.** Delete outdated or subsumed notes; merge overlapping notes
   before adding new ones.

### Durability test

Ask: "Would I include this in a prompt for a *different* task?"

- **Yes** → write to `brain/`. It's durable knowledge.
- **No, it's plan-specific** → update the plan's docs instead.
- **No, it's a skill issue** → update the skill file directly.
- **No, it needs follow-up work** → file a todo.

### Structure

```
brain/
├── index.md              <- root entry point, links to everything (auto-built)
├── principles.md         <- index for principles/
├── principles/           <- engineering and design principles
├── codebase/             <- project-specific knowledge and gotchas
├── sources.md            <- index for sources/ (only if doc sites exist)
├── sources/              <- pointers to external authoritative docs; never copies
└── plans/                <- feature plans
```

- `sources/` notes point at existing doc sites (VitePress, Docusaurus, …) and
  are authoritative — read them in place, do not duplicate their content into
  the brain. `init-brain` seeds them; keep them as thin pointers.

- One topic per file. `brain/codebase/deploy-gotchas.md`, not a mega-file.
- File names: lowercase, hyphenated. `worktree-gotchas.md`.
- A new top-level category gets an index-style entrypoint (links only, no
  inlined content).

### Wikilinks

Format: `[[section/file-name]]`. Resolution order: same directory, then relative
path, then vault root. Heading anchors (`[[file#heading]]`) are stripped.

### Writing style

- Open with `# Title`, then a one-line summary sentence, then bullets. The
  summary line becomes this note's description in `brain/index.md` (the
  PostToolUse hook extracts it), so write it as a relevance hint a future
  session can scan — what the note is about, not "Notes on X".
- Bullets over prose after the summary. No other preamble.
- Plain markdown. No Obsidian frontmatter.
- Keep notes under ~50 lines. Split if longer.

## Stop and Ask

STOP and ask the user when:

- A note would record a contested decision or preference you are not sure the
  user actually holds.
- Writing would delete or substantially rewrite an existing note whose intent is
  unclear.

Do not ask about facts discoverable by reading the vault or the repo.

## Output

A created or updated brain file (or a deletion/merge), plus any touched index
entrypoint. Report which files changed, one line each, and the vault path.
