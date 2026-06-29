---
type: Reference
title: "Bulletproof Architecture Refactor"
description: Migrated reference documentation from the former root documentation tree.
resource: brain/reference/plans/2025-12-05-bulletproof-architecture-design.md
tags: [reference, plans]
timestamp: 2026-06-28T08:10:00Z
---
## Bulletproof Architecture Refactor

**Date:** 2025-12-05
**Status:** Implemented (with deviations — see note below)

## Implementation Note (2026-06)

This plan was largely implemented. Key divergences from the design:

- **State management**: Plan uses Pinia (`defineStore(...)`) everywhere. Actual implementation uses **VueUse `createGlobalState()`** — no Pinia. Both `src/stores/settings.ts` and `src/stores/exercises.ts` use `createGlobalState`, not `defineStore`.
- **`useAppInitialization.ts` NOT deleted**: The plan says to delete `src/composables/useAppInitialization.ts` and inline in `App.vue`. The file still exists at `src/features/workout/composables/useAppInitialization.ts` (moved but not deleted).
- **Shared types**: `src/types/blocks.ts`, `src/types/exercises.ts`, `src/types/settings.ts` were created as planned.
- **Timer views**: `src/components/timers/WorkoutAmrapView.vue` etc. were created as planned.
- **ESLint enforcement**: Architecture boundary rules are enforced (see architecture tests + `no-restricted-imports` config).

---

## Goal

Refactor to strict Bulletproof React architecture compliance:

- Zero cross-feature imports
- Unidirectional flow: `shared → features → app`

## Design Decisions

1. **Shared types** → `src/types/` (blocks, exercises, settings)
2. **Store layer split** → Global read-only state in `src/stores/`, mutations in features
3. **Timer views** → Extract to `src/components/timers/` as shared UI
4. **App init** → Inline in `App.vue` (app-level orchestration)

## New Directory Structure

```
src/
├── components/
│   ├── ui/              # shadcn primitives (unchanged)
│   └── timers/          # NEW: shared timer view components
│       ├── AmrapTimerView.vue
│       ├── EmomTimerView.vue
│       ├── TabataTimerView.vue
│       ├── ForTimeTimerView.vue
│       └── CircularTimer.vue
│
├── types/               # NEW: truly shared types
│   ├── blocks.ts        # Block, StrengthBlock, TimedBlock, etc.
│   ├── exercises.ts     # Exercise, Equipment, Muscle, Metrics
│   └── settings.ts      # WeightUnit, HeightUnit, Language
│
├── stores/              # Global read-only state
│   ├── settings.ts      # App preferences (read-only reactive state)
│   └── exercises.ts     # Exercise catalog (built-in + custom merged)
│
├── features/
│   ├── settings/        # Settings mutations only
│   ├── exercises/       # Custom exercise CRUD only
│   ├── workout/         # Workout logic (no more types/ subfolder)
│   ├── timers/          # Standalone timer feature
│   └── templates/       # Template management
│
├── composables/         # Shared composables (import from types/, stores/)
├── lib/                 # Utilities (import from types/, stores/)
├── db/                  # Database layer (import from types/)
└── views/               # Page components (compose features)
```

## Store Layer Split

### Global stores (`src/stores/`)

```typescript
// src/stores/settings.ts
export const useSettingsStore = defineStore('settings', () => {
  const weightUnit = ref<WeightUnit>('kg')
  const heightUnit = ref<HeightUnit>('cm')
  const language = ref<Language>('en')

  function _hydrate(data: SettingsData) {
    /* ... */
  }

  return { weightUnit, heightUnit, language, _hydrate }
})

// src/stores/exercises.ts
export const useExercisesStore = defineStore('exercises', () => {
  const exercises = ref<Array<Exercise>>([])

  function _hydrate(builtIn: Array<Exercise>, custom: Array<Exercise>) {
    /* ... */
  }

  return { exercises, _hydrate }
})
```

### Feature stores (mutations only)

- `features/settings/` - `updateWeightUnit()`, `importSettings()`, etc.
- `features/exercises/` - `createCustomExercise()`, `deleteCustomExercise()`, etc.

## Shared Types

```typescript
// src/types/blocks.ts
export type WorkoutMode = 'builder' | 'active'
export type TimedBlockKind = 'amrap' | 'emom' | 'tabata' | 'fortime'
export type StrengthBlock = { id: string; kind: 'strength'; exerciseId: string; sets: Array<WorkoutSet> }
export type TimedBlock = AmrapBlock | EmomBlock | TabataBlock | ForTimeBlock
export type Block = StrengthBlock | TimedBlock

// src/types/exercises.ts
export type Equipment = 'barbell' | 'dumbbell' | 'kettlebell' | /* ... */
export type Muscle = 'chest' | 'back' | 'shoulders' | /* ... */
export type Exercise = { id: string; name: string; equipment: Equipment; muscles: Array<Muscle> }

// src/types/settings.ts
export type WeightUnit = 'kg' | 'lbs'
export type HeightUnit = 'cm' | 'ft/in'
export type Language = 'en' | 'es' | 'de' | /* ... */
```

## ESLint Enforcement

```typescript
'import-x/no-restricted-paths': ['error', {
  zones: [
    // Cross-feature isolation - no feature imports other features
    { target: './src/features/workout', from: './src/features', except: ['./workout'] },
    { target: './src/features/exercises', from: './src/features', except: ['./exercises'] },
    { target: './src/features/settings', from: './src/features', except: ['./settings'] },
    { target: './src/features/timers', from: './src/features', except: ['./timers'] },
    { target: './src/features/templates', from: './src/features', except: ['./templates'] },

    // Unidirectional flow - shared cannot import features/views
    {
      target: ['./src/components', './src/composables', './src/lib', './src/db', './src/types', './src/stores'],
      from: ['./src/features', './src/views'],
    },

    // Features cannot import from views
    { target: './src/features', from: './src/views' },
  ],
}],
```

## Migration Tasks

### Files to move

| From                                                   | To                                           |
| ------------------------------------------------------ | -------------------------------------------- |
| `features/workout/types/blocks.ts`                     | `src/types/blocks.ts`                        |
| `features/exercises/stores/exercises.ts` (types)       | `src/types/exercises.ts`                     |
| `features/settings/stores/settings.ts` (types)         | `src/types/settings.ts`                      |
| `features/workout/components/WorkoutAmrapView.vue`     | `src/components/timers/AmrapTimerView.vue`   |
| `features/workout/components/WorkoutEmomView.vue`      | `src/components/timers/EmomTimerView.vue`    |
| `features/workout/components/WorkoutTabataView.vue`    | `src/components/timers/TabataTimerView.vue`  |
| `features/workout/components/WorkoutForTimeView.vue`   | `src/components/timers/ForTimeTimerView.vue` |
| `features/workout/components/WorkoutCircularTimer.vue` | `src/components/timers/CircularTimer.vue`    |

### Files to split

| File                                     | Read-only →               | Mutations →      |
| ---------------------------------------- | ------------------------- | ---------------- |
| `features/settings/stores/settings.ts`   | `src/stores/settings.ts`  | stays in feature |
| `features/exercises/stores/exercises.ts` | `src/stores/exercises.ts` | stays in feature |

### Files to delete

- `src/composables/useAppInitialization.ts` → inline in `App.vue`
- `src/features/*/index.ts` → no longer needed

### Import updates

~50 files need import path changes to point to new locations.
