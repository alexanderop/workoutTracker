---
type: Domain Map
title: Testing
description: Routing for Vitest browser mode, factories, fake IndexedDB, and UI-flow verification.
resource: brain/domains/testing.md
tags: [testing, vitest, browser-mode]
timestamp: 2026-06-28T08:05:00Z
---

## Testing

Use this map before writing or debugging tests.

## Read First

- [Agent testing guide](../reference/agent/testing.md)
- [Vitest browser mode plan](../reference/vitest-browser-mode-plan.md)
- [Vitest browser troubleshooting](../reference/vitest-browser-troubleshooting.md)
- [Test factory improvements](../reference/test-factory-improvements.md)

## Source Areas

- `src/__tests__/setup.ts`
- `src/__tests__/helpers/`
- `src/__tests__/factories/`
- `src/__tests__/integration/`
- Feature-local `__tests__/` folders.

## Gotchas

- The canonical command is `pnpm test`, not `pnpm test:unit`.
- Reset fake IndexedDB between tests.
- For one-visible-item UI such as carousels and tabs, navigate first and query
  the visible target rather than indexing hidden elements.

## Verification

- Run the smallest affected browser-mode test first.
- Run `pnpm test` before committing broad behavior changes.
