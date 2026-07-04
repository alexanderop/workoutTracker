---
type: Brain Log
title: Brain maintenance log
description: Chronological changes to the workout tracker brain structure.
resource: brain/log.md
tags: [brain, log]
timestamp: 2026-06-28T08:05:00Z
---

## Brain Maintenance Log

## 2026-07-04

- Diagnosed and fixed the two chronically failing Claude CI checks (PR #151;
  fixes merged via PRs #152/#153). Captured the findings as two lessons:
  [claude_args quoting hangs the CLI silently](./lessons/claude-args-quoting-hang.md)
  and [QA agent turn economics](./lessons/qa-agent-turn-economics.md).
- Added a quoting warning to the agent-browser QA tutorial's `--json-schema`
  section so the blog draft doesn't teach the trap.

## 2026-06-28

- Added the initial `brain/` vault after comparing Brainmaxxing with the pasted
  Open Knowledge Format reference.
- Chose normal markdown links plus YAML frontmatter over Obsidian-only wikilinks.
- Migrated useful `.claude/memory` notes into [lessons](./lessons/index.md).
- Added [domains](./domains/index.md) as the routing layer from agent memory to
  the existing repo docs.
