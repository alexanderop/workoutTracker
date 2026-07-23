---
name: reflect
description: Use when wrapping up a session, after a mistake or correction, or when significant codebase knowledge was gained, to persist learnings into the brain; triggers include "reflect", "remember this".
---

# Reflect

Review the conversation and persist learnings — to `brain/`, to skill files, or
as structural enforcement. This is where most brain content comes from. The
invariant: a learning lands in the destination where it will actually change
future behavior, not just the brain by default.

## When to Use

Do not use this skill for trivia already captured in the brain, or for
plan-specific notes that belong in the plan's docs.

## Process

1. **Read `brain/index.md`** to understand what notes already exist. If `brain/`
   does not exist, run `init-brain` first.
2. **Scan the conversation** for: mistakes and corrections, user preferences and
   workflow patterns, codebase knowledge (architecture, gotchas, patterns),
   tool/library quirks, decisions and their rationale, friction in skill
   execution or delegation, and repeated manual steps that could be automated.
3. **Skip** anything trivial or already captured.
4. **Route each learning** to the right destination (see Routing).
5. **Update the relevant index entrypoint** for any brain files added or removed.
   `brain/index.md` itself is rebuilt by the PostToolUse hook.

### Routing

Not everything belongs in the brain. Route each learning to where it has the
most impact.

- **Structural enforcement check (do this first).** Can this be a lint rule,
  script, metadata flag, or runtime check? If yes, encode it structurally and
  skip the brain note. See `brain/principles/encode-lessons-in-structure.md`.
- **Brain files (`brain/`).** Codebase knowledge, principles, gotchas — anything
  that informs future sessions. The default destination. Use the `brain` skill
  for writing conventions: one topic per file, directories with `[[wikilink]]`
  indexes, no inlined content in index files.
- **Skill improvements (`${CLAUDE_PROJECT_DIR}/.claude/skills/<skill>/`).** If a learning
  is about how a specific skill works — its process, prompts, or edge cases —
  update the skill directly.
- **Backlog items.** Follow-up work that can't be done during reflection — bugs,
  non-trivial rewrites, tooling gaps. File as a todo.

## Stop and Ask

STOP and ask the user when a candidate learning encodes a preference or decision
you are not confident they hold, or when persisting it would contradict an
existing brain note. Otherwise apply and report.

## Output

Return a summary in this shape:

```markdown
## Reflect Summary
- Brain: [files created/updated, one line each]
- Skills: [skill files modified, one line each]
- Structural: [rules/scripts/checks added]
- Todos: [follow-up items filed]
```
