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

### How it was isolated (reusable technique)

- **Pre-init hang signature**: in a healthy run the `{"type": "system",
  "subtype": "init"}` message appears seconds after `SDK options`. If it never
  appears, the CLI died/blocked during startup — the problem is invocation
  (args, auth, settings), not the prompt or the app under test.
- **Minimal smoke step as control**: the workflow's trivial smoke prompt
  (`--allowedTools "Write" --max-turns 3`, no schema, no system prompt) passed
  in the same job, on the same runner, same OAuth token, same Claude version.
  Diffing the two invocations' flags narrowed the culprit to
  `--json-schema` / `--append-system-prompt`.
- **Version regression ruled out via npm registry**: the action (pinned
  v1.0.93) installs a pinned Claude Code 2.1.101 (published 2026-04-10), not
  "latest" — so identical versions on the passing and failing dates. Check
  `registry.npmjs.org/@anthropic-ai/claude-code` `time` map before blaming a
  release.
- **The schema's single quote was introduced 2026-04-11** (commit `0bbee6c2`);
  the April 13 debugging spree (smoke test, tailer, `--debug`, retry step) was
  chasing exactly this hang without finding the quoting cause.

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
   The 401 is per-workflow-file: a PR that only touches
   `claude-qa-browser.yml` still gets a working `claude-pr-review.yml` run.
6. Prompt files (`.claude/prompts/*.md`) and schemas are read by workflow
   steps from the PR-branch checkout, so they do NOT need to match main —
   only the workflow yml itself does. (The action separately restores
   `.claude/` settings from origin/main at runtime for untrusted heads.)

### Related

- PR review workflow: `--max-turns 10` was too few once PRs grew and CLAUDE.md
  pushed agents to read brain docs first; the action fails the job when max
  turns is reached. Now 50, with a 20-minute job timeout.
- [QA agent turn economics](./qa-agent-turn-economics.md) — the follow-up
  failure mode once the hang was fixed.
- Fixed in PRs #152 and #153 (2026-07-04).
