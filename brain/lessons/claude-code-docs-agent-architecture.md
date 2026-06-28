---
type: Lesson
title: Claude Code docs agent architecture
description: Documentation maps help agents navigate docs without crawling everything.
resource: brain/lessons/claude-code-docs-agent-architecture.md
tags: [lesson, agents, documentation]
timestamp: 2026-06-28T08:05:00Z
---

## Claude Code Docs Agent Architecture

This lesson was migrated from `.claude/memory`.

Claude Code documentation uses a central map pattern: one file indexes pages and
headings so agents can navigate by intent instead of crawling every document.

That pattern is the reason this repo brain has [domain maps](../domains/index.md)
instead of one massive all-purpose memory file.
