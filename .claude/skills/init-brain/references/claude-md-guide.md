# Authoring CLAUDE.md (and AGENTS.md)

`CLAUDE.md` is the one file injected into **every** session. `AGENTS.md` is its
open-source equivalent for other harnesses (Codex, Cursor, Zed, …); AFK keeps
them in sync with a symlink, so you author one file. It is the highest-leverage
file in the repo: a bad line here corrupts every plan, review, and diff that
follows. Author it deliberately — never dump-generate it like `/init`.

## What it is for

Onboard the agent to a codebase it knows nothing about at session start. Cover:

- **WHAT** — the stack, the project map (apps, packages, what each is for).
  Critical in monorepos: say where things live so the agent knows where to look.
- **WHY** — the purpose of the project and of its major parts.
- **HOW** — how to do real work here: the build/test/typecheck/run commands, how
  the agent verifies its own changes.

## Rules (in priority order)

1. **Less is more.** Frontier models reliably follow ~150–200 instructions, and
   the Claude Code system prompt already spends ~50. Every line you add competes
   with all the others — past the budget the model degrades on *all* of them, not
   just the new ones. Include only what is universally applicable to work here.
2. **Keep it short and universal.** Aim under 300 lines; shorter is better. If a
   rule only matters for one kind of task (a specific schema, one subsystem),
   it does not belong in CLAUDE.md.
3. **Progressive disclosure.** Don't inline everything. Put task-specific detail
   in self-describing files (e.g. `docs/testing.md`, `docs/architecture.md`) and
   list them in CLAUDE.md with a one-line description each, telling the agent to
   read the relevant one before working. AFK skills already do this.
4. **Pointers over copies.** Reference `file:line` instead of pasting code or
   commands that will rot. No code snippets that duplicate the source of truth.
5. **Claude is not a linter.** Do not put code-style rules in CLAUDE.md — that is
   slow, expensive, and burns the instruction budget. Use a formatter/linter,
   and a Stop hook if you want enforcement. The model is an in-context learner:
   a few searches teach it your conventions better than a style list.
6. **Author, don't auto-generate.** Research the repo, then write each line on
   purpose. Avoid `/init`-style brain-dumps.

## Shape to aim for

A tight CLAUDE.md usually has:

```markdown
# <project name>

One or two sentences: what this project is and why it exists (WHY + WHAT).

## Stack
The languages, runtimes, frameworks, and the package manager (e.g. bun, not npm).

## Map
- `dir/` — what lives here and what it is for
- ...just enough to navigate; deepen with pointers, not prose

## Commands
- Test: `...`     (the every-change check)
- Build / typecheck / run: `...`
- ...only the commands the agent actually needs to verify its work

## Memory — brain/   <- the AFK brain pointer; see below
...

## Detailed docs (read when relevant)
- `docs/<topic>.md` — one line on what it covers
```

This repo's own `CLAUDE.md` is a good model: Stack / Map / Commands / Rules,
each line earning its place.

## The brain pointer (required)

Always include a short section so any harness — even one not running AFK's
SessionStart hook — knows the persistent memory exists and reads it first.
Add (or, in an existing CLAUDE.md, append) this block, adjusting only the lines
that actually exist in the vault:

```markdown
## Memory — brain/

This project keeps persistent memory in a `brain/` Obsidian vault. Read it
before non-trivial work.

- `brain/index.md` — entry point; links to everything below
- `brain/principles.md` — engineering/design principles to follow
- `brain/context.md` — domain glossary
- `brain/decisions/` — architecture decision records (ADRs)
- `brain/plans/` — feature plans

Skip `brain/sources/` line above if the vault has no sources.
```

## When CLAUDE.md already exists

Do **not** overwrite it. It is likely hand-tuned. Instead:

- Ensure a `## Memory — brain/` pointer is present; add it if missing.
- Only if asked to "tighten"/"improve" it: suggest trims toward these rules
  (cut style rules, move task-specific detail to `docs/` pointers, shorten
  toward <300 lines) — and confirm with the user before large edits.
