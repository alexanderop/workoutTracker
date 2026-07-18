---
type: Domain Map
title: UI and theming
description: Routing for shadcn-vue, reka-ui, Tailwind v4 tokens, and mobile-first UI changes.
resource: brain/domains/ui-and-theming.md
tags: [ui, shadcn-vue, tailwind, theming]
timestamp: 2026-06-28T08:05:00Z
---

## UI and Theming

Use this map for styling, shadcn-vue primitives, Tailwind tokens, theme changes,
and mobile workout flows.

## Read First

- [shadcn-vue theming](../reference/shadcn-vue-theming.md)
- [UI consistency audit](../reference/UI_CONSISTENCY_AUDIT.md)
- [Vue style guide](../reference/VUE_STYLE_GUIDE.md)
- [Logging speed is the product](../principles/logging-speed-is-the-product.md)

## Source Areas

- `src/style.css`
- `src/components/ui/`
- `src/components/exercise-icons/`
- `src/features/*/components/`
- `src/views/`
- `components.json`

## Gotchas

- shadcn-vue uses `reka-ui`, not `radix-vue`.
- Tailwind v4 tokens live in CSS, not `tailwind.config.js`.
- Add semantic colors in light vars, dark vars, and `@theme inline`.
- Avoid editing generated `src/components/ui/*` primitives directly unless the
  primitive itself is the bug.
- Exercise icon artwork and `manifest.ts` are authored source. Do not edit
  `src/components/exercise-icons/generated/*`; run
  `pnpm generate:exercise-icons` after changing the manifest.

## Verification

- Run `pnpm type-check` for component API changes.
- Use browser verification for layout, touch-target, or interaction changes.
