---
type: Domain Map
title: Testing
description: Routing for Vitest browser mode, factories, fake IndexedDB, and UI-flow verification.
resource: brain/domains/testing.md
tags: [testing, vitest, browser-mode]
timestamp: 2026-07-18T12:01:55Z
---

## Testing

Use this map before writing or debugging tests.

## Read First

- [Agent testing guide](../reference/agent/testing.md)
- [Vitest browser mode plan (archived — implemented)](../_archive/vitest-browser-mode-plan.md)
- [Vitest browser troubleshooting](../reference/vitest-browser-troubleshooting.md)
- [npmx testing strategy research](../reference/research/2026-07-18-npmx-testing-strategy.md)
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
- `test/e2e/` — Playwright Test journeys against the built application served
  by Vite preview.

## Gotchas

- The canonical command is `pnpm test`, not `pnpm test:unit`.
- `@vitest/browser-playwright` drives Vitest component/integration tests;
  `@playwright/test` owns the separate E2E suite.
- Reset fake IndexedDB between tests.
- For one-visible-item UI such as carousels and tabs, navigate first and query
  the visible target rather than indexing hidden elements.

## Verification

- Run the smallest affected browser-mode test first.
- Run `pnpm test:e2e` for real-URL journeys, or
  `pnpm test:e2e:prebuilt` when `dist/` is already current.
- Run `pnpm test` before committing broad behavior changes.
