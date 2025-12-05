# Bulletproof Architecture Refactor - Remaining Violations

## Summary
Refactoring Vue 3 workout tracker to strict Bulletproof React architecture. Foundational work complete (types, stores, db repos, ESLint rules). 22 ESLint violations remain for 100% strict compliance.

## Context
- **Build**: ✅ Passes
- **Tests**: ✅ All 259 pass
- **ESLint**: ❌ 22 violations (architecture boundaries)

## Completed Work
1. Created `src/types/` - shared types (blocks, exercises, settings)
2. Created `src/stores/` - global stores (settings, exercises)
3. Moved db repositories to `src/db/repositories/`
4. Updated ~50+ files with new import paths
5. Updated ESLint rules for strict enforcement

## Design Document
Full design decisions documented at: `docs/plans/2025-12-05-bulletproof-architecture-design.md`

## Current ESLint Rules
```typescript
// eslint.config.ts lines 187-209
rules: {
  'import-x/no-restricted-paths': ['error', {
    zones: [
      // Cross-feature isolation
      { target: './src/features/workout', from: './src/features', except: ['./workout'] },
      { target: './src/features/exercises', from: './src/features', except: ['./exercises'] },
      { target: './src/features/settings', from: './src/features', except: ['./settings'] },
      { target: './src/features/timers', from: './src/features', except: ['./timers'] },
      { target: './src/features/templates', from: './src/features', except: ['./templates'] },

      // Unidirectional flow - shared cannot import from features/views
      {
        target: ['./src/components', './src/composables', './src/lib', './src/db', './src/types', './src/stores'],
        from: ['./src/features', './src/views'],
      },

      // Features cannot import from views
      { target: './src/features', from: './src/views' },
    ],
  }],
},
```

## Remaining 22 Violations

### Shared Code → Features (4 errors)
| File | Imports | Fix |
|------|---------|-----|
| `src/composables/useAppInitialization.ts` | `features/workout/useWorkout`, `useWorkoutPersistence` | Inline into App.vue |
| `src/db/converters.ts` | `features/workout/useWorkout` | Move types to `src/types/` |
| `src/db/schema.ts` | `features/workout/useWorkout` | Move types to `src/types/` |
| `src/db/seedExercises.ts` | `features/exercises/popularExercises` | Move to `src/data/` |

### Cross-Feature: workout → timers (7 errors)
| File | Imports | Fix |
|------|---------|-----|
| `WorkoutActiveMode.vue` | `useRestTimer` | Move timer composables to shared |
| `WorkoutActiveModeFooter.vue` | `useRestTimer` | Move timer composables to shared |
| `WorkoutRestTimerWidget.vue` | `useRestTimer` | Move timer composables to shared |
| `WorkoutAmrapView.vue` | `useAmrapTimer` | Move timer composables to shared |
| `WorkoutEmomView.vue` | `useEmomTimer` | Move timer composables to shared |
| `WorkoutTabataView.vue` | `useTabataTimer` | Move timer composables to shared |
| `WorkoutForTimeView.vue` | `useForTimeTimer` | Move timer composables to shared |

### Cross-Feature: timers → workout (4 errors)
| File | Imports | Fix |
|------|---------|-----|
| `StandaloneTimerRunner.vue` | `WorkoutAmrapView`, `WorkoutEmomView`, `WorkoutTabataView`, `WorkoutForTimeView` | Move timer views to `src/components/timers/` |

### Cross-Feature: workout → exercises (3 errors)
| File | Imports | Fix |
|------|---------|-----|
| `WorkoutAddExerciseDialog.vue` | `useExerciseSearch`, `ExerciseListItem` | Move to shared or accept dependency |
| `WorkoutExercisePicker.vue` | `popularExercises` | Move to `src/data/` |

### Cross-Feature: templates → others (2 errors)
| File | Imports | Fix |
|------|---------|-----|
| `useTemplateDetail.ts` | `useWorkout`, `popularExercises` | Refactor to use shared code |

## Fix Order (Recommended)

1. **Move timer composables to `src/composables/timers/`**
   - `useAmrapTimer`, `useEmomTimer`, `useTabataTimer`, `useForTimeTimer`, `useRestTimer`
   - Fixes 7 workout→timers violations

2. **Move timer view components to `src/components/timers/`**
   - `WorkoutAmrapView` → `AmrapTimerView`
   - `WorkoutEmomView` → `EmomTimerView`
   - `WorkoutTabataView` → `TabataTimerView`
   - `WorkoutForTimeView` → `ForTimeTimerView`
   - `WorkoutCircularTimer` → `CircularTimer`
   - Fixes 4 timers→workout violations

3. **Move `popularExercises` to `src/data/popularExercises.ts`**
   - Fixes 3 violations (seedExercises, WorkoutExercisePicker, useTemplateDetail)

4. **Move remaining types from `useWorkout.ts` to `src/types/`**
   - `Set` type, `SetStatus` type (already moved as `WorkoutSet`)
   - Export `restoreWorkout`, `getWorkoutRef` functions if needed by converters
   - Fixes 2 violations (db/converters, db/schema)

5. **Inline `useAppInitialization` into `App.vue`**
   - Views can legally import from features
   - Fixes 1 violation

6. **Handle workout → exercises dependency** (3 violations)
   - Option A: Move `useExerciseSearch`, `ExerciseListItem` to shared
   - Option B: Accept this dependency (less strict but practical)

## Commands to Verify

```bash
pnpm lint          # Check ESLint violations
pnpm build         # Verify build passes
pnpm test:unit     # Run all tests
```
