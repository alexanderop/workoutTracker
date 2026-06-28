---
type: Brain Index
title: Workout Tracker Brain
description: Entry point for durable agent memory in the workout tracker repo.
resource: brain/index.md
tags: [brain, agents, workout-tracker]
timestamp: 2026-06-28T08:05:00Z
---

## Workout Tracker Brain

This directory is the first stop for agent memory. It uses the Brainmaxxing
idea of a small markdown vault, upgraded with Open Knowledge Format-style
frontmatter so files are easy to search, index, and move between tools.

## Read Order

1. [Format](./format.md) - how to add and update brain notes.
2. [Principles](./principles.md) - durable engineering judgment for this repo.
3. [Domains](./domains/index.md) - maps from task area to canonical brain references.
4. [Lessons](./lessons/index.md) - specific gotchas learned from past work.
5. [Sources](./sources/brainmaxxing-and-okf.md) - why this brain is shaped this way.
6. [Reference](./reference/index.md) - long-form knowledge migrated from the old docs tree.
7. [Plans](./plans/index.md) - active or historical multi-step work plans.

## Current Shape

- One concept per file.
- Index files route; they do not duplicate the whole subtree.
- Use normal markdown links, not tool-specific links.
- Prefer short notes with links to authoritative source files.
- Update [log](./log.md) when a brain structure change matters.

## What Belongs Here

Put knowledge here when it helps the next agent decide faster:

- Project-specific conventions that are not obvious from code.
- Gotchas that caused failures or repeated rework.
- Maps that tell agents which existing docs to read for a task.
- Principles that change how work should be designed or verified.

Do not use this as a dumping ground for every meeting note or stale plan. If a
note stops changing agent behavior, delete it or archive it under
`brain/reference/` only when the long-form content still has value.
