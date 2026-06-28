---
type: Principle
title: Subtract before adding
description: Prefer removing stale paths and duplication before adding new abstractions.
resource: brain/principles/subtract-before-adding.md
tags: [principles, refactoring, simplicity]
timestamp: 2026-06-28T08:05:00Z
---

## Subtract Before Adding

Before creating a new abstraction, check whether the problem is stale code,
duplicated ownership, or a missing route to an existing pattern.

Use this order:

1. Delete unused code or docs.
2. Route to an existing helper or doc.
3. Consolidate duplicate logic.
4. Add a new abstraction only when it removes real complexity.

Related docs:

- [Refactoring patterns](../reference/REFACTORING_PATTERNS.md)
- [Duplication analysis](../reference/tech-debt/duplication-analysis.md)
