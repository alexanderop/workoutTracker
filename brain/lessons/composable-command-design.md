---
type: Lesson
title: Composable command design
description: Thin orchestration commands are better than duplicating command bodies.
resource: brain/lessons/composable-command-design.md
tags: [lesson, agents, commands]
timestamp: 2026-06-28T08:05:00Z
---

## Composable Command Design

This lesson was migrated from `.claude/memory`.

Slash commands or skills should compose existing workflows when possible. A
command that delegates to `/push` and `/pr` is easier to maintain than one that
duplicates both implementations.

Apply the same rule to repo docs: route through indexes and domain maps instead
of copying the same instructions into every file.
