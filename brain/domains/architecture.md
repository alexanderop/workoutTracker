---
type: Domain Map
title: Architecture
description: Routing for feature boundaries, shared modules, and repo structure decisions.
resource: brain/domains/architecture.md
tags: [architecture, vue, feature-boundaries]
timestamp: 2026-06-28T08:05:00Z
---

## Architecture

Use this map for changes that move code, introduce shared helpers, or touch
feature boundaries.

## Read First

- [AGENTS.md](../../AGENTS.md)
- [Vue style guide](../reference/VUE_STYLE_GUIDE.md)
- [Agent architecture guide](../reference/agent/architecture.md)
- [Refactoring patterns](../reference/REFACTORING_PATTERNS.md)

## Source Areas

- `src/features/` for feature-owned code.
- `src/composables/`, `src/lib/`, `src/components/`, `src/stores/`, `src/types/`
  for feature-neutral shared code.
- `src/db/` for persistence boundaries.

## Gotchas

- `README.md` still mentions Pinia in places, but current repo instructions say
  stores use VueUse `createGlobalState()`.
- Cross-feature imports are architectural bugs. Move shared concepts downward
  into neutral modules.

## Verification

- Run `pnpm type-check` after structural changes.
- Run `pnpm test:arch` when imports or boundaries change.
