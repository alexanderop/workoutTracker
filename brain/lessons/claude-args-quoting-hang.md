---
type: Lesson
title: claude_args quoting hangs the CLI silently
description: Quotes inside interpolated claude_args content hang claude-code-action at startup with zero output.
resource: brain/lessons/claude-args-quoting-hang.md
tags: [lesson, ci, github-actions, claude-code-action, qa]
timestamp: 2026-07-04T13:30:00Z
---

## claude_args Quoting Hangs the CLI Silently

Diagnosed 2026-07-04 (PR #151); the hang had existed since ~2026-04-11 but was
masked because the QA workflow's compatibility guard skipped the Claude step
(`QA_SKIPPED` counts as success) on every branch whose workflow file differed
from main.

### Symptom

`anthropics/claude-code-action` prints its `SDK options: {...}` JSON and then
produces **no output at all** — no `system/init` message — until the step
timeout. A trivial smoke prompt in the same job works fine.

### Root cause

`claude_args` is tokenized shell-words style. Any quote character inside
interpolated content breaks tokenization, and the malformed arg list leaves
the CLI blocked (waiting on stdin) before initialization:

- `--append-system-prompt "${{ steps.x.outputs.file_content }}"` — a markdown
  file with double quotes/backticks terminates the argument early.
- `--json-schema '<schema>'` — a single quote *inside* the schema closes the
  arg; escaping as `\'` does NOT survive claude_args parsing (that's POSIX
  shell semantics, not this parser's).

### Rules

1. Never interpolate file contents into `claude_args`. Put long instructions
   in the file-based `prompt` input (no shell parsing) instead of
   `--append-system-prompt`.
2. Keep `--json-schema` content free of single quotes; the QA workflow now
   fails fast if `.github/schemas/qa-report-schema.json` contains one.
3. When a Claude CI step "does nothing for N minutes", suspect arg parsing
   first — check whether the `system/init` message ever appeared in the log.
4. Don't trust green "Claude QA (Browser)" checks on branches that modify the
   workflow file: the guard skips the Claude step entirely (`QA_SKIPPED`).
5. Changes to ANY claude-code-action workflow only take effect after they land
   on main: the app token exchange 401s with "Workflow validation failed"
   unless the workflow file is byte-identical to the default branch. Ship CI
   fixes as their own PR to main, then merge main into feature branches.

### Related

- PR review workflow: `--max-turns 10` was too few once PRs grew and CLAUDE.md
  pushed agents to read brain docs first; the action fails the job when max
  turns is reached. Now 50.
