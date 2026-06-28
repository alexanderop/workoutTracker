---
type: Principle
title: Respect feature boundaries
description: Keep features isolated and route shared behavior through neutral shared modules.
resource: brain/principles/respect-feature-boundaries.md
tags: [principles, architecture, vue]
timestamp: 2026-06-28T08:05:00Z
---

## Respect Feature Boundaries

Features cannot import other features. Route shared behavior through
`src/composables`, `src/components`, `src/db`, `src/lib`, `src/stores`, or
`src/types`.

Before adding a helper inside a feature, decide whether it is truly feature-owned
or a shared domain concept. Shared code must stay feature-neutral.

Canonical docs:

- [Architecture domain](../domains/architecture.md)
- [Vue style guide](../reference/VUE_STYLE_GUIDE.md)
- [Agent architecture guide](../reference/agent/architecture.md)
