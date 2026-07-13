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
- [Test factory improvements (archived — implemented)](../_archive/test-factory-improvements.md)

## Source Areas

- `src/__tests__/setup.ts`
- `src/__tests__/helpers/`
- `src/__tests__/factories/`
- `src/__tests__/integration/`
- `src/__tests__/features/` — tests mirror `src/features/*` here (not colocated
  in feature folders); other mirrored subfolders include `components/`,
  `composables/`, `stores/`, `lib/`, and `db/`.
- `src/__tests__/a11y/`, `src/__tests__/visual/`, `src/__tests__/architecture/`
  — separate Vitest projects (`test:a11y`, `test:visual`, `test:arch`).

## Gotchas

- The canonical command is `pnpm test`, not `pnpm test:unit`.
- Reset fake IndexedDB between tests.
- For one-visible-item UI such as carousels and tabs, navigate first and query
  the visible target rather than indexing hidden elements.

## Verification

- Run the smallest affected browser-mode test first.
- Run `pnpm test` before committing broad behavior changes.
