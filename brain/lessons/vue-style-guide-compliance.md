---
type: Lesson
title: Vue style guide compliance
description: Component naming, multi-attribute formatting, and template simplicity are recurring Vue review points.
resource: brain/lessons/vue-style-guide-compliance.md
tags: [lesson, vue, style-guide]
timestamp: 2026-06-28T08:05:00Z
---

## Vue Style Guide Compliance

This lesson was migrated from `.claude/memory`.

Recurring issues from past Vue refactors:

- Tightly coupled child components should be prefixed with their parent or domain
  name so related files group together.
- Elements with multiple attributes should be split across lines.
- Complex template expressions should be extracted into functions or computed
  values.

Canonical routing now lives in [Vue and composables](../domains/vue-and-composables.md).
