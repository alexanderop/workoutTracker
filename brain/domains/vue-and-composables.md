---
type: Domain Map
title: Vue and composables
description: Routing for Vue state, composables, stores, and component logic.
resource: brain/domains/vue-and-composables.md
tags: [vue, composables, state]
timestamp: 2026-06-28T08:05:00Z
---

## Vue and Composables

Use this map for state, composables, reusable logic, and component patterns.

## Read First

- [Vue style guide](../reference/VUE_STYLE_GUIDE.md)
- [Agent composables guide](../reference/agent/composables.md)
- [State machine pattern](../reference/state-machine-pattern.md)
- [VueUse opportunities](../reference/VUEUSE_OPPORTUNITIES.md)

## Source Areas

- `src/composables/`
- `src/features/*/composables/`
- `src/stores/`
- `src/features/*/state/`
- `src/components/`

## Gotchas

- Use VueUse `createGlobalState()` for stores.
- Use `defineModel()` for two-way binding in Vue components.
- Prefer discriminated unions over multiple boolean flags for exclusive UI state.
- Check VueUse before writing manual event listener or timer utilities.

## Verification

- Run `pnpm type-check`.
- Add composable tests when extracting behavior from components.
