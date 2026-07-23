---
name: meditate
description: Use when auditing and evolving the brain vault — pruning outdated or low-value notes, discovering cross-cutting principles, and reviewing skills for structural encoding opportunities; triggers include "meditate", "audit the brain".
---

# Meditate

Audit and evolve the brain vault. The quality bar a note must clear to keep its
place: **high-signal** (Claude would reliably get this wrong without it),
**high-frequency** (comes up in most sessions or most tasks of a type), or
**high-impact** (getting it wrong causes real damage or wasted work). Everything
else is noise — a lean, precise brain outperforms a comprehensive but bloated one.

## When to Use

Do not use this skill to capture the current session (use `reflect`) or to mine
old conversations (use `ruminate`).

## Process

1. **Build snapshots.**

   ```bash
   sh "${CLAUDE_PROJECT_DIR}/.claude/skills/meditate/scripts/snapshot.sh" brain/ /tmp/brain-snapshot.md
   sh "${CLAUDE_PROJECT_DIR}/.claude/skills/meditate/scripts/snapshot.sh" "${CLAUDE_PROJECT_DIR}/.claude/skills/" /tmp/skills-snapshot.md
   ```

   Files are delimited with `=== path/to/file.md ===` headers. Also locate the
   auto-memory directory (`~/.claude/projects/<project>/memory/`).
2. **Auditor (blocking).** Spawn a `general-purpose` subagent — full prompt spec
   in `references/agents.md`. It audits brain notes, CLAUDE.md, and auto-memory
   for staleness, redundancy, low-value content, verbosity, and orphans, and
   returns a categorized report. **Early-exit gate:** if it finds fewer than 3
   actionable items, skip step 3 and go to step 4.
3. **Reviewer.** Spawn one `general-purpose` subagent (spec in
   `references/agents.md`) combining: **synthesis** (missing wikilinks, principle
   tensions, clarifications), **distillation** (recurring patterns revealing
   unstated principles — must be independent, evidenced by 2+ notes, and
   actionable), and **skill review** (skills vs. brain principles:
   contradictions, missed structural enforcement, redundant instructions).
4. **Review reports.** Present a consolidated summary (format in
   `references/agents.md`).
5. **Route skill-specific learnings** into the relevant SKILL.md or references/
   (read the skill first to avoid duplication).
6. **Apply changes** directly (the user reviews the diff): update/delete outdated
   notes, merge redundant ones, delete low-value ones, condense verbose ones, add
   `[[wikilinks]]`, reword tensions, add genuinely independent new principles
   (update `brain/principles.md`), fix CLAUDE.md and stale memories.
7. **Housekeep.** Update the relevant index entrypoints for files added or
   removed; `brain/index.md` is rebuilt by the hook.

## Stop and Ask

STOP and ask the user before deleting a note whose value is genuinely ambiguous,
or before adding a new principle that could conflict with an existing one. Pruning
that is clearly low-value or stale can proceed without asking.

## Output

Return a summary in this shape:

```markdown
## Meditate Summary
- Pruned: [N notes deleted, M condensed, K merged]
- Extracted: [N new principles, one line + evidence count each]
- Skill review: [N findings, M applied]
- Housekeep: [state files cleaned]
```

## References

- [references/agents.md](./references/agents.md) — full prompt specs for the
  auditor and reviewer subagents, plus the report template.
- [scripts/snapshot.sh](./scripts/snapshot.sh) — concatenates a directory's
  markdown into one snapshot file.
