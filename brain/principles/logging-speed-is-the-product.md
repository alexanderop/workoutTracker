---
type: Principle
title: Logging speed is the product
description: Optimize every design and implementation decision around faster workout logging.
resource: brain/principles/logging-speed-is-the-product.md
tags: [principles, product, workout]
timestamp: 2026-06-28T08:05:00Z
---

## Logging Speed Is the Product

The app exists to make workout logging fast during an actual gym session. When a
design call is unclear, ask whether it makes logging a set faster or slower.

Prefer:

- Instant local state changes.
- Large touch targets on mobile.
- Fewer modal steps during active workouts.
- Defaults from history, templates, or the current block.

Avoid:

- Flows that require reading instructions mid-workout.
- Network-dependent state.
- Extra confirmation screens unless data loss is likely.

Canonical source: [AGENTS.md](../../AGENTS.md).
