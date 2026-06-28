---
type: Reference
title: "Vue PWA Starter Template - Extraction Plan"
description: Migrated reference documentation from the former root documentation tree.
resource: brain/reference/TEMPLATE_PLAN.md
tags: [reference]
timestamp: 2026-06-28T08:10:00Z
---
## Vue PWA Starter Template - Extraction Plan

Extract a reusable PWA template from the workout tracker for building data/tracking apps faster.

## Template Overview

| Layer           | What's Included                                                    |
| --------------- | ------------------------------------------------------------------ |
| **UI**          | All shadcn-vue components + custom NumberField, Layout, PageHeader |
| **Database**    | Dexie setup with `Item` entity, repository pattern, provider       |
| **Feature**     | `items/` module demonstrating bulletproof architecture             |
| **Composables** | PWA utilities + UI helpers (dialog, animation, locale)             |
| **Pages**       | Home, Items, Settings with bottom nav                              |
| **i18n**        | vue-i18n with EN + DE example                                      |
| **Testing**     | Vitest config, factories, helper utils, example tests              |
| **Config**      | Identical ESLint/TS/Tailwind rules, adapted PWA manifest           |
| **AI**          | Generic CLAUDE.md files for continued AI-assisted dev              |

---

## Target Structure

```
vue-pwa-starter/
├── src/
│   ├── components/
│   │   ├── ui/                    # All shadcn-vue (copied as-is)
│   │   ├── Layout.vue
│   │   ├── PageHeader.vue
│   │   ├── PageLayout.vue
│   │   └── ErrorDialog.vue
│   ├── composables/
│   │   ├── usePwaUpdate.ts
│   │   ├── useVersionCheck.ts
│   │   ├── useScreenWakeLock.ts
│   │   ├── useGlobalWakeLock.ts
│   │   ├── useTouchDevice.ts
│   │   ├── useDialogState.ts
│   │   ├── useAnimatedCounter.ts
│   │   ├── useNumberLocale.ts
│   │   └── useEnterAnimation.ts
│   ├── db/
│   │   ├── schema.ts
│   │   ├── interfaces.ts
│   │   ├── implementations/
│   │   │   └── DexieItemRepository.ts
│   │   ├── provider.ts
│   │   ├── converters.ts
│   │   └── index.ts
│   ├── features/
│   │   └── items/
│   │       ├── components/
│   │       │   ├── ItemCard.vue
│   │       │   ├── ItemForm.vue
│   │       │   └── ItemStatusBadge.vue
│   │       ├── composables/
│   │       │   └── useItems.ts
│   │       ├── views/
│   │       │   └── ItemDetailView.vue
│   │       ├── index.ts
│   │       └── CLAUDE.md
│   ├── i18n/
│   │   ├── index.ts
│   │   ├── types.ts
│   │   └── messages/
│   │       ├── en.ts
│   │       └── de.ts
│   ├── stores/
│   │   └── settings.ts
│   ├── types/
│   │   └── item.ts
│   ├── views/
│   │   ├── TheHomeView.vue
│   │   ├── TheItemsView.vue
│   │   └── TheSettingsView.vue
│   ├── router/
│   │   └── index.ts
│   ├── __tests__/
│   │   ├── setup.ts
│   │   ├── factories/
│   │   │   └── itemFactory.ts
│   │   ├── helpers/
│   │   │   └── testUtils.ts
│   │   ├── composables/
│   │   │   └── useItems.spec.ts
│   │   ├── db/
│   │   │   └── itemRepository.spec.ts
│   │   └── CLAUDE.md
│   ├── App.vue
│   ├── main.ts
│   └── style.css
├── CLAUDE.md
├── package.json
├── vite.config.ts
├── tsconfig.json
├── eslint.config.js
└── README.md
```

---

## Example Entity: Item

```typescript
// src/types/item.ts
interface Item {
  id: string
  name: string
  description?: string
  status: 'active' | 'completed' | 'archived'
  createdAt: Date
  updatedAt: Date
}
```

```typescript
// src/db/schema.ts
db.version(1).stores({
  items: 'id, status, createdAt',
})
```

---

## i18n Message Structure

```typescript
{
  common: { save, cancel, delete, edit, loading, error },
  items: { title, empty, create, status },
  settings: { title, language, theme, clearData },
  nav: { home, items, settings }
}
```

---

## Execution Plan

### Phase 1: Create New Repo

- [ ] 1. Create fresh GitHub repo `vue-pwa-starter` with template option enabled
- [ ] 2. Copy base config files (package.json, tsconfig, eslint, vite.config)
- [ ] 3. Update package.json name and PWA manifest placeholders

### Phase 2: Core Infrastructure

- [ ] 4. Copy `src/components/ui/` entirely (shadcn-vue)
- [ ] 5. Copy generic layout components (Layout, PageHeader, PageLayout, ErrorDialog)
- [ ] 6. Copy shared composables (PWA + UI helpers listed above)
- [ ] 7. Set up `src/db/` with schema, interfaces, provider (empty initially)

### Phase 3: Example Feature

- [ ] 8. Create `src/features/items/` folder structure
- [ ] 9. Create Item type in `src/types/item.ts`
- [ ] 10. Create DexieItemRepository implementation
- [ ] 11. Build useItems composable
- [ ] 12. Create ItemCard, ItemForm, ItemStatusBadge components

### Phase 4: Pages & Routing

- [ ] 13. Set up router with RouteNames enum and 3+ routes
- [ ] 14. Create TheHomeView, TheItemsView, TheSettingsView
- [ ] 15. Adapt Layout.vue for 3-tab bottom nav (Home, Items, Settings)

### Phase 5: Supporting Systems

- [ ] 16. Set up i18n with EN + DE messages
- [ ] 17. Copy and adapt test infrastructure (setup.ts, helpers)
- [ ] 18. Create itemFactory for tests
- [ ] 19. Write example tests for Item feature (composable + repository)
- [ ] 20. Adapt CLAUDE.md files for generic template guidance

### Phase 6: Finalize

- [ ] 21. Update README with template usage instructions
- [ ] 22. Clean up any leftover workout tracker references
- [ ] 23. Run full lint/type-check/test cycle
- [ ] 24. Enable GitHub template repository setting

---

## Config Files

### Keep Identical (same rules)

- `eslint.config.js` - Strict rules, boundary enforcement
- `tsconfig.json` - Strict TypeScript settings
- `style.css` + Tailwind v4 via `@tailwindcss/vite`

### Adapt (placeholders)

- `package.json` - Change name to `vue-pwa-starter`
- `vite.config.ts` - PWA manifest placeholders:
  ```typescript
  manifest: {
    name: 'My PWA App',           // TODO: Change
    short_name: 'MyApp',          // TODO: Change
    description: 'Description',   // TODO: Change
    theme_color: '#7c3aed',
  }
  ```
- `index.html` - Generic title/meta

---

## What Gets Removed

### Features (all workout-specific)

- `src/features/workout/`
- `src/features/exercises/`
- `src/features/templates/`
- `src/features/benchmarks/`
- `src/features/timers/`
- `src/features/log-past-workout/`

### Composables (domain-specific)

- useWorkoutCalendar, useWorkoutsList, useRecentWorkouts
- useExerciseSearch, useBenchmarksList
- useWeightDisplay, useTimedBlockExercises

### Components (domain-specific)

- ExercisePicker, ExerciseAvatar, ExerciseFilters
- WorkoutCards, TemplateCards, RecentWorkouts
- All workout/exercise-specific components

### Types (domain-specific)

- workout.ts, exercises.ts, benchmark.ts, blocks.ts

### Data

- popularExercises.ts, seedExercises.ts
