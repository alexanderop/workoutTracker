---
name: init-brain
description: Use when setting up a project for AFK for the first time — scaffolds the brain/ vault and authors a tight CLAUDE.md (with an AGENTS.md symlink) that points at the brain; triggers include "init brain", "set up the brain", "create the brain vault", or "generate a CLAUDE.md to onboard the agent to this repo".
---

# Init Brain

One-time AFK setup for a project. Two outputs:

1. An empty `brain/` vault (folder + `index.md`) — scaffolded by an idempotent
   script.
2. A carefully **authored** `CLAUDE.md` (with `AGENTS.md` symlinked to it) that
   onboards any agent to the repo and points at the brain.

Run this once before first use. The vault is also created lazily by
`reflect` and `brain`, but the CLAUDE.md/AGENTS.md authoring only
happens here.

`CLAUDE.md` is the highest-leverage file in the repo — it loads into every
session. Author it deliberately following
[references/claude-md-guide.md](./references/claude-md-guide.md); never
dump-generate it like `/init`.

## When to Use

Use this skill when:

- A project has no `brain/` vault yet and the user wants to set it up up front.
- The user wants a good `CLAUDE.md`/`AGENTS.md` for the repo, or to "onboard the
  agent" to the codebase.

The brain scaffold is idempotent, so it is safe to re-run to add the
CLAUDE.md/AGENTS.md to a project that already has a vault.

## Process

1. Run the scaffold script — it is idempotent and never overwrites existing
   content:

   ```bash
   bash "${CLAUDE_PROJECT_DIR}/.claude/skills/init-brain/scripts/init-brain.sh"
   ```

   It creates the vault structure only if missing — see
   [scripts/init-brain.sh](./scripts/init-brain.sh) for the exact set of files.
   The one part the next step acts on: when the project already has a doc site
   (VitePress, VuePress, Docusaurus, Astro Starlight, Nextra, MkDocs, Sphinx),
   the script seeds a `brain/sources/<name>.md` stub per detected site so the
   brain *points at* those docs rather than absorbing them — nothing in the repo
   moves.

2. **Refine the seeded source stubs.** If the script printed a "Detected doc
   sites" report, open each detected docs root (its landing page / sidebar
   config), and in that site's `brain/sources/<name>.md` replace the
   `Scope: _TODO …_` line with a real one-line scope of what those docs cover
   (e.g. "Public SDK API reference and guides", "Deployment runbooks"). Keep the
   "authoritative — don't duplicate into the brain" line. Skip any stub whose
   docs you can't read; leave its TODO for next time.

3. **Author or repair CLAUDE.md.** Read
   [references/claude-md-guide.md](./references/claude-md-guide.md) first, then:
   - **If `CLAUDE.md` is missing:** research the repo before writing — the stack
     and package manager, the directory map, and the real build/test/run
     commands (read `package.json`/manifests, the README, the project layout;
     use the `Explore` agent for large repos). Then author a tight CLAUDE.md
     following the guide (WHAT/WHY/HOW, progressive disclosure, under ~300 lines,
     no code-style rules). Include the `## Memory — brain/` pointer block from
     the guide so the agent reads the vault.
   - **If `CLAUDE.md` already exists:** do **not** overwrite it. Only ensure a
     `## Memory — brain/` pointer is present, adding it if missing. Suggest
     larger trims only if the user asks to tighten it.

4. **Link AGENTS.md to CLAUDE.md** so every harness reads one file:

   ```bash
   bash "${CLAUDE_PROJECT_DIR}/.claude/skills/init-brain/scripts/link-agents.sh"
   ```

   It is idempotent and refuses to clobber a real `AGENTS.md`. If it exits with
   "AGENTS.md already exists as a regular file", stop and ask the user how to
   reconcile the two files — do not delete their content.

5. Report what changed (see Output). The PostToolUse hook keeps `brain/index.md`
   in sync — including the `## Sources` section — as files are added or removed
   from then on.

## Stop and Ask

STOP and ask the user when:

- The project root is ambiguous (e.g. a monorepo where the vault and CLAUDE.md
  could belong to more than one package).
- `link-agents.sh` reports a real `AGENTS.md` file already exists — reconcile its
  content with the user before touching it.

Do not ask about facts discoverable by reading the repo (stack, layout,
commands) — research them and write the CLAUDE.md.

## Output

Report, one line each:

- The `brain/` vault root and the paths created (or "already present").
- Any doc sites detected and registered under `brain/sources/`, plus which still
  need a Scope line.
- Whether `CLAUDE.md` was authored, augmented with a brain pointer, or left
  as-is, and that `AGENTS.md` is symlinked to it.

## References

- [scripts/init-brain.sh](./scripts/init-brain.sh) — the idempotent brain
  scaffold; run it, don't reimplement it.
- [scripts/link-agents.sh](./scripts/link-agents.sh) — guarded `AGENTS.md` →
  `CLAUDE.md` symlink; run it, don't reimplement it.
- [references/claude-md-guide.md](./references/claude-md-guide.md) — how to
  author the CLAUDE.md (read before writing) and the brain-pointer block.
