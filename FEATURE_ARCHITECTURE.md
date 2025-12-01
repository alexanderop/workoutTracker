# Feature-Based Architecture for Vue 3 Workout Tracker

## Overview

Adopt the bulletproof-react feature-based architecture pattern for this Vue 3 project to improve scalability and maintainability as the codebase grows.

## Target Structure

```
src/
├── views/                  # Page-level components (unchanged location)
├── router/                 # Vue Router config (unchanged location)
│
├── features/               # Feature modules (NEW)
│   ├── workout/           # Builder mode, active mode, strength blocks
│   ├── timers/            # AMRAP/EMOM/Tabata/ForTime state machines
│   ├── exercise/          # Exercise library, custom exercises, search
│   ├── templates/         # Workout templates
│   ├── settings/          # User preferences, import/export
│   └── history/           # Past workouts, detail analytics
│
├── components/            # Shared components (ui/, Layout, etc.)
├── composables/           # Shared composables (useWorkout, useTheme, useRestTimer)
├── lib/                   # Utility functions
├── types/                 # Shared types (blocks.ts)
├── stores/                # Pinia stores (exercises, settings)
├── db/                    # Database layer (Dexie, repositories)
├── data/                  # Static data (popularExercises)
│
├── App.vue
└── main.ts
```

## Feature Folder Structure

Each feature contains only the subfolders it needs:

```
src/features/{feature}/
├── components/            # Feature-specific Vue components
├── composables/           # Feature-specific composables
├── types/                 # Feature-specific types (if any)
└── __tests__/             # Co-located tests
```

## File Mappings

### workout feature
```
src/features/workout/
├── components/
│   ├── WorkoutBuilderMode.vue         ← src/components/workout/WorkoutBuilderMode.vue
│   ├── WorkoutActiveMode.vue          ← src/components/workout/WorkoutActiveMode.vue
│   ├── WorkoutActiveModeFooter.vue
│   ├── WorkoutActiveStrengthView.vue
│   ├── WorkoutAddBlockDialog.vue
│   ├── WorkoutAddExerciseDialog.vue
│   ├── WorkoutBlockCarousel.vue
│   ├── WorkoutBlockPlaylist.vue
│   ├── WorkoutBlockPlaylistItem.vue
│   ├── WorkoutCancelDialog.vue
│   ├── WorkoutConfigureAmrapDialog.vue
│   ├── WorkoutConfigureEmomDialog.vue
│   ├── WorkoutConfigureForTimeDialog.vue
│   ├── WorkoutConfigureTabataDialog.vue
│   ├── WorkoutEditExerciseDialog.vue
│   ├── WorkoutExerciseCarousel.vue
│   ├── WorkoutExercisePicker.vue
│   ├── WorkoutFinishDialog.vue
│   ├── WorkoutHeader.vue
│   ├── WorkoutPreviousHistory.vue
│   ├── WorkoutRestTimerWidget.vue
│   ├── WorkoutSetTable.vue
│   └── WorkoutTimedBlockCard.vue
├── composables/
│   ├── useWorkoutMode.ts              ← src/composables/useWorkoutMode.ts
│   └── useWorkoutPersistence.ts       ← src/composables/useWorkoutPersistence.ts
└── __tests__/
    ├── useWorkoutMode.spec.ts         ← src/__tests__/composables/useWorkoutMode.spec.ts
    └── useWorkoutPersistence.spec.ts  ← src/__tests__/composables/useWorkoutPersistence.spec.ts
```

### timers feature
```
src/features/timers/
├── components/
│   ├── WorkoutAmrapConfig.vue         ← src/components/workout/WorkoutAmrapConfig.vue
│   ├── WorkoutAmrapView.vue           ← src/components/workout/WorkoutAmrapView.vue
│   ├── WorkoutEmomConfig.vue
│   ├── WorkoutEmomView.vue
│   ├── WorkoutTabataConfig.vue
│   ├── WorkoutTabataView.vue
│   ├── WorkoutForTimeConfig.vue
│   └── WorkoutForTimeView.vue
├── composables/
│   ├── useAmrapTimer.ts               ← src/composables/timers/useAmrapTimer.ts
│   ├── useEmomTimer.ts                ← src/composables/timers/useEmomTimer.ts
│   ├── useTabataTimer.ts              ← src/composables/timers/useTabataTimer.ts
│   └── useForTimeTimer.ts             ← src/composables/timers/useForTimeTimer.ts
└── __tests__/
    └── composables/
        ├── useAmrapTimer.spec.ts      ← src/__tests__/composables/timers/
        ├── useEmomTimer.spec.ts
        ├── useTabataTimer.spec.ts
        └── useForTimeTimer.spec.ts
```

### exercise feature
```
src/features/exercise/
├── components/
│   ├── ExerciseEquipmentSelector.vue  ← src/components/exercise/
│   ├── ExerciseMetricsSelector.vue
│   ├── ExerciseMuscleSelector.vue
│   ├── ExerciseSettingsItem.vue
│   └── ExerciseTypeSelector.vue
├── composables/
│   ├── useExerciseForm.ts             ← src/composables/useExerciseForm.ts
│   └── useExerciseSearch.ts           ← src/composables/useExerciseSearch.ts
└── __tests__/
    └── useExerciseSearch.spec.ts      ← src/__tests__/composables/useExerciseSearch.spec.ts
```

### templates feature
```
src/features/templates/
├── components/
│   ├── TemplateExerciseItem.vue       ← src/components/templates/
│   └── TemplateExerciseList.vue
└── __tests__/
```

### settings feature
```
src/features/settings/
├── components/
│   ├── SettingsDeleteAllDataDialog.vue ← src/components/settings/
│   ├── SettingsImportDataDialog.vue
│   └── SettingsImportErrorDialog.vue
└── __tests__/
```

### history feature
```
src/features/history/
├── components/
│   ├── WorkoutDetailExerciseCard.vue  ← src/components/workout/WorkoutDetailExerciseCard.vue
│   ├── WorkoutDetailSetRow.vue
│   ├── WorkoutDetailSetTable.vue
│   └── WorkoutDetailStatsRow.vue
├── composables/
│   └── useWorkoutDetail.ts            ← src/composables/useWorkoutDetail.ts
└── __tests__/
```

## Shared Code (stays at root)

These files remain in their current locations as shared code:

### composables/ (cross-cutting)
- `useWorkout.ts` - Singleton workout state
- `useRestTimer.ts` - Rest timer (used by workout + timers)
- `useTheme.ts` - Theme management
- `useAppInitialization.ts` - App startup
- `useAnimatedCounter.ts` - Animations
- `useEnterAnimation.ts` - Animations
- `useWorkoutWakeLock.ts` - Screen wake lock

### components/ (shared UI)
- `ui/` - shadcn-vue primitives (do not modify)
- `Layout.vue`
- `PageHeader.vue`
- `PageLayout.vue`
- `MobileDialogContent.vue`
- `PwaUpdatePrompt.vue`
- `ResumeWorkoutDialog.vue`

### Other shared directories
- `types/blocks.ts` - Core domain types
- `stores/` - Pinia stores
- `db/` - Database layer
- `lib/` - Utilities
- `data/` - Static data

## Import Boundaries

### Flow direction
```
shared (components/, composables/, lib/, types/, db/, stores/)
    ↓
features/ (can import from shared, NOT from other features)
    ↓
views/ + router/ (can import from features and shared)
```

### ESLint configuration

Add to `eslint.config.js`:

```javascript
import noRestrictedPaths from 'eslint-plugin-import/rules/no-restricted-paths'

// Add this rule
'import/no-restricted-paths': ['error', {
  zones: [
    // Prevent cross-feature imports
    { target: './src/features/workout', from: './src/features', except: ['./workout'] },
    { target: './src/features/timers', from: './src/features', except: ['./timers'] },
    { target: './src/features/exercise', from: './src/features', except: ['./exercise'] },
    { target: './src/features/templates', from: './src/features', except: ['./templates'] },
    { target: './src/features/settings', from: './src/features', except: ['./settings'] },
    { target: './src/features/history', from: './src/features', except: ['./history'] },

    // Prevent features from importing from views
    { target: './src/features', from: './src/views' },

    // Prevent shared from importing features
    {
      target: ['./src/components', './src/composables', './src/lib', './src/types', './src/stores'],
      from: './src/features'
    },
  ]
}]
```

## Migration Steps (All at Once)

### Step 1: Create directory structure
```bash
mkdir -p src/features/{workout,timers,exercise,templates,settings,history}/{components,composables,__tests__}
```

### Step 2: Move workout feature files
- Move `src/components/workout/Workout{Builder,Active,Add,Block,Cancel,Configure,Edit,Exercise,Finish,Header,Previous,Rest,Set,Timed}*.vue` → `src/features/workout/components/`
- Move `src/composables/useWorkout{Mode,Persistence}.ts` → `src/features/workout/composables/`
- Move related tests → `src/features/workout/__tests__/`

### Step 3: Move timers feature files
- Move `src/components/workout/Workout{Amrap,Emom,Tabata,ForTime}*.vue` → `src/features/timers/components/`
- Move `src/composables/timers/*.ts` → `src/features/timers/composables/`
- Move `src/__tests__/composables/timers/*.ts` → `src/features/timers/__tests__/composables/`

### Step 4: Move exercise feature files
- Move `src/components/exercise/*.vue` → `src/features/exercise/components/`
- Move `src/composables/useExercise{Form,Search}.ts` → `src/features/exercise/composables/`
- Move related tests → `src/features/exercise/__tests__/`

### Step 5: Move templates feature files
- Move `src/components/templates/*.vue` → `src/features/templates/components/`

### Step 6: Move settings feature files
- Move `src/components/settings/*.vue` → `src/features/settings/components/`

### Step 7: Move history feature files
- Move `src/components/workout/WorkoutDetail*.vue` → `src/features/history/components/`
- Move `src/composables/useWorkoutDetail.ts` → `src/features/history/composables/`

### Step 8: Update all imports
- Update imports in views to use `@/features/{feature}/components/`
- Update imports in components to use feature-relative paths
- Update test imports

### Step 9: Add ESLint rule
- Install `eslint-plugin-import` if not present
- Add `import/no-restricted-paths` rule to `eslint.config.js`

### Step 10: Clean up
- Remove empty `src/components/{workout,exercise,templates,settings}/` directories
- Remove empty `src/composables/timers/` directory
- Remove empty `src/__tests__/composables/` directories
- Update `src/components/CLAUDE.md` to reflect new structure

### Step 11: Verify
- Run `pnpm lint` to check for boundary violations
- Run `pnpm test:unit` to ensure tests pass
- Run `pnpm build` to verify type-checking

## Files to Update

### Critical files requiring import updates:
- `src/views/ActiveWorkout.vue` - imports workout + timer components
- `src/views/TheExercisesView.vue` - imports exercise components
- `src/views/TheSettingsView.vue` - imports settings components
- `src/views/WorkoutDetailView.vue` - imports history components
- `src/views/TemplateDetailView.vue` - imports template components
- `src/views/CreateTemplateView.vue` - imports template components
- `src/components/CLAUDE.md` - update documentation
- `CLAUDE.md` - update architecture section

### Test configuration:
- `vitest.config.ts` - ensure test patterns include `features/**/__tests__/**/*.spec.ts`
