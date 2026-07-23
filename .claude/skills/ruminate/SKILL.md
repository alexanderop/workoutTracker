---
name: ruminate
description: Use when mining past Claude Code conversations for patterns, corrections, and knowledge that reflect missed and that were never written into the brain; triggers include "ruminate", "mine my history".
---

# Ruminate

Mine conversation history for brain-worthy knowledge that was never captured.
Complements `reflect` (current session) and `meditate` (vault audit) by looking
at the full archive of past conversations. The invariant: surface only
high-signal, recurring patterns — discard one-off incidents aggressively.

## When to Use

Use this skill when:

- You want to bootstrap or enrich the brain from existing conversation history.
- Corrections, preferences, or gotchas keep recurring but were never written down.
- The user says "ruminate" or "mine my history".

Do not use this skill for the current session's learnings — use `reflect`. Do
not use it to audit existing brain content — use `meditate`.

## Process

1. **Read the brain.** Build a snapshot:
   `sh "${CLAUDE_PROJECT_DIR}/.claude/skills/meditate/scripts/snapshot.sh" brain/ /tmp/brain-snapshot-ruminate.md`.
   Pass the snapshot path to each analysis agent so the orchestrator's context
   stays clean.
2. **Locate conversations** in `~/.claude/projects/-<cwd-with-dashes-replacing-slashes>/`.
3. **Extract** them into readable batches:

   ```bash
   python3 "${CLAUDE_PROJECT_DIR}/.claude/skills/ruminate/scripts/extract-conversations.py" "$CONV_DIR" "$OUT_DIR" --batches N
   ```

   Choose N: ~1 batch per 20 conversations, min 2, max 10.
4. **Spawn an analysis team** — N read-only subagents in parallel (one per
   batch, `subagent_type: general-purpose`). Give each agent: its batch
   manifest path, its output path (`$OUT_DIR/findings_N.md`), and the list of
   topics **already in the brain** (from step 1) so it skips known knowledge.
   Each agent extracts: user corrections, recurring preferences, technical
   learnings, workflow patterns, frustrations, and skills the user wished for.
5. **Synthesize.** Read all findings, cross-reference with the brain, dedupe
   across batches, then filter by **frequency** (recurring, not one-off),
   **factual accuracy** (anything now wrong in the brain is always worth fixing),
   and **impact**. Discard aggressively. Done means every mined finding is
   resolved: either promoted to a proposed brain/skill update, or dismissed with
   a one-line reason — none left in limbo.
6. **Present and apply.** Show findings in a table (finding, frequency/evidence,
   proposed action). A one-off is a dismissed-with-reason row; a pattern is a
   promoted row — so the table is the resolved set from step 5, no unresolved
   findings. Route skill-specific learnings into the relevant SKILL.md (read it
   first). Apply only approved changes, following brain writing conventions;
   update the relevant index entrypoint. Quote the user's words when a finding
   stems from a correction.
7. **Clean up.** `rm -rf "$OUT_DIR"` and shut down idle agents.

## Stop and Ask

STOP and present to the user before writing — ruminate proposes, the user
decides what is worth adding. Always ask which findings to apply rather than
writing speculative notes directly.

## Output

A table of findings with evidence and proposed actions, then the set of approved
brain/skill changes applied (files listed one line each). The temporary
extraction directory is removed.

## References

- [scripts/extract-conversations.py](./scripts/extract-conversations.py) —
  parses JSONL conversations into batched text.
- `${CLAUDE_PROJECT_DIR}/.claude/skills/meditate/scripts/snapshot.sh` — builds the brain
  snapshot passed to agents.
