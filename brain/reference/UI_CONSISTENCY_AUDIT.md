---
type: Reference
title: "UI Consistency Audit"
description: Migrated reference documentation from the former root documentation tree.
resource: brain/reference/UI_CONSISTENCY_AUDIT.md
tags: [reference]
timestamp: 2026-06-28T08:10:00Z
---
## UI Consistency Audit

Generated: 2025-12-12

This document captures UI inconsistencies found across the codebase that should be addressed to create a more cohesive user experience.

---

## Cross-Cutting Issues

These issues appear across multiple features and should be prioritized.

### 1. Dialog Footer Patterns (Partially Addressed ✅)

`DialogActions` component created at `src/components/DialogActions.vue`. Pattern A dialogs (ErrorDialog, ResumeWorkoutDialog, WorkoutFinishDialog, WorkoutCancelDialog) should now use it. Configure dialogs moved to `src/components/blocks/` (ConfigureAmrapDialog.vue, ConfigureEmomDialog.vue, ConfigureTabataDialog.vue, ConfigureForTimeDialog.vue, ConfigureCardioDialog.vue).

**Status (2026-07-13): resolved.** Verified against current code — `ConfigureAmrapDialog.vue` is
now a thin wrapper around `ConfigureTimedBlockDialog.vue`, which uses `DialogActions`.
`WorkoutSaveTemplateDialog.vue` now imports and uses `DialogActions` (`variant="inline"`) instead
of a plain div. `BenchmarkRepsDialog.vue` no longer exists in the codebase (component was
renamed/removed). The table below is left for historical reference only.

**Remaining inconsistencies (historical, at time of audit):**

| Pattern | Location                   | Classes                                          |
| ------- | -------------------------- | ------------------------------------------------ |
| B       | ConfigureAmrapDialog       | `pt-4 border-t flex gap-3`                       |
| C       | BenchmarkRepsDialog        | `DialogFooter class="flex-row gap-2"`            |
| D       | WorkoutSaveTemplateDialog  | `flex gap-3`                                     |

**Canonical pattern** (DialogActions component):

```vue
<div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
  <Button variant="outline" class="w-full sm:w-auto">Cancel</Button>
  <Button class="w-full sm:w-auto">Confirm</Button>
</div>
```

### 2. Hardcoded Slate Colors ✅ Fixed

All `bg-slate-*` / `hover:bg-slate-*` occurrences have been removed from Vue components. Theme-aware tokens (`hover:bg-muted`, `bg-muted`) are used throughout. Note: `CreateCustomExercise.vue` was renamed to `ExerciseFormView.vue`.

### 3. Custom Button Elements (Medium Priority — Partially Fixed)

**Fixed:**
- `src/features/settings/components/SettingsDataSection.vue` — Export/Import now use `<Button>` ✅

**Still uses native `<button>`:**
- `src/features/templates/components/TemplateExerciseItem.vue:79-103` - Increment/decrement controls
- `src/features/benchmarks/components/BenchmarkTypeCard.vue:21-27` - Type selection card
- Icon picker in exercise form (`src/views/ExerciseFormView.vue`) — `CreateCustomExercise.vue` was renamed

**Why it matters:** Loses accessibility features, focus states, and consistent styling

### 4. Button Sizing Inconsistency (Medium Priority)

**Problem:** Same button purposes use different sizes

| Context        | Examples                                                           |
| -------------- | ------------------------------------------------------------------ |
| Primary CTAs   | `size="lg"`, `h-14 text-lg`, `h-12 text-base`, default             |
| Dialog actions | `flex-1` with default, `flex-1` with gap-2, `flex-1` with gap-3    |
| Icon buttons   | `size="icon"`, `size="icon-sm"`, `h-8 w-8`, `h-9 w-9`, `h-12 w-12` |

**Recommendation:** Establish hierarchy:

- Primary page CTAs: `size="lg"`
- Dialog confirm/cancel: default size with `flex-1`
- Icon buttons: `size="icon"` (don't override dimensions)

### 5. Icon Sizing Inconsistency (Medium Priority)

**Problem:** Mix of sizing approaches

| Approach         | Examples                                 |
| ---------------- | ---------------------------------------- |
| Tailwind utility | `size-4`, `size-5`, `w-4 h-4`, `h-5 w-5` |
| Component prop   | `:size="20"`, `:size="32"`               |
| Text sizing      | `text-2xl`, `text-4xl` (for emojis)      |

**Recommendation:**

- Lucide icons: Use `size-4` or `size-5` class (not `:size` prop)
- Emoji icons: Use `text-*` sizing
- Standardize: action button icons = `size-4`, standalone icons = `size-5`

### 6. Missing i18n ✅ Resolved

Full vue-i18n is implemented across 12 translation domains (English + German). `BenchmarkCompletionScreen.vue` no longer exists as a separate component — benchmark completion UI was refactored into `BenchmarkForTimeView.vue` / `BenchmarkViewMode.vue`. Any remaining hardcoded strings should be found with `grep -r "\"[A-Z]"` rather than relying on the original file list.

---

## Per-Feature Issues

### Workout Feature

**Status (2026-07-13):** The dialog components in this table have since moved/renamed —
`WorkoutConfigureAmrapDialog.vue` and `WorkoutAddBlockDialog.vue` no longer exist under
`src/features/workout/components/`; that logic now lives in `src/components/blocks/` as
`ConfigureAmrapDialog.vue` (via shared `ConfigureTimedBlockDialog.vue`) and
`src/components/blocks/AddBlockDialog.vue`, both using `DialogActions`. Rows below describing
those files are stale; not re-verified line-by-line for the rest.

**Files:** `src/features/workout/components/`

| Issue                      | File                            | Line    | Description                                         |
| -------------------------- | ------------------------------- | ------- | --------------------------------------------------- |
| Custom close button        | WorkoutConfigureAmrapDialog.vue | 62-68   | Should use MobileDialogContent's showCloseButton    |
| Custom close button        | WorkoutAddBlockDialog.vue       | 103-109 | Same issue                                          |
| Inconsistent dialog footer | WorkoutSaveTemplateDialog.vue   | 60      | Uses plain div, not DialogFooter                    |
| Footer border              | WorkoutConfigureAmrapDialog.vue | 107     | Has `border-t`, others don't                        |
| Input height               | WorkoutEditExerciseDialog.vue   | 89,99   | Uses `h-12`, WorkoutSaveTemplateDialog uses default |
| Button with manual height  | WorkoutBuilderMode.vue          | 131     | `size="lg" class="h-14"` - conflicting              |
| Empty state pattern        | WorkoutAddBlockDialog.vue       | 148-154 | Custom div instead of Empty component               |

### Benchmarks Feature

**Files:** `src/features/benchmarks/components/`

| Issue                     | File                           | Line     | Description                              |
| ------------------------- | ------------------------------ | -------- | ---------------------------------------- |
| ~~Missing i18n~~          | ~~BenchmarkCompletionScreen.vue~~ | — | ✅ Resolved — component removed, i18n full |
| Order badge size (view)   | BenchmarkExerciseCard.vue      | 19-23    | `size-10 text-lg font-bold`              |
| Order badge size (edit)   | BenchmarkExerciseItem.vue      | 28-32    | `size-6 text-xs font-semibold`           |
| Exercise icon size (view) | BenchmarkExerciseCard.vue      | 26       | `text-4xl`                               |
| Exercise icon size (edit) | BenchmarkExerciseItem.vue      | 35       | `text-2xl`                               |
| Hard-coded color          | BenchmarkExerciseQueueItem.vue | 34       | `text-green-500` instead of semantic     |
| Redundant status badge    | BenchmarkExerciseQueueItem.vue | 99-101   | "Active" badge duplicates icon indicator |
| ~~Custom button~~ ✅ Fixed | ~~BenchmarkTypeCard.vue~~      | —        | Now uses `<Button>` (verified 2026-07-13)|
| Manual icon size          | BenchmarkEditMode.vue          | 95       | `<Plus class="mr-2 size-5" />`           |
| Manual icon size          | BenchmarkCompletionScreen.vue  | 71       | `<Check class="size-5" />`               |

### Settings Feature

**Files:** `src/features/settings/components/`

| Issue                  | File                            | Line   | Description                          |
| ---------------------- | ------------------------------- | ------ | ------------------------------------ |
| ~~Custom button elements~~ | ~~SettingsDataSection.vue~~   | — | ✅ Fixed — uses `<Button>` now       |
| Mixed button heights   | Multiple                        | -      | `min-h-11` vs `min-h-9`              |
| Spacing inconsistency  | SettingsDataSection.vue         | 80     | `space-y-3` vs `space-y-4` elsewhere |
| Custom range input     | SettingsScreenSection.vue       | 88-98  | Manual styling instead of Slider     |
| Status badge styling   | SettingsWakeLockDiagnostics.vue | 41-47  | Inline conditional colors            |

### Exercises Feature

**Files:** `src/features/exercises/components/`, `src/views/`

| Issue                 | File                       | Line    | Description                                 |
| --------------------- | -------------------------- | ------- | ------------------------------------------- |
| ~~Hardcoded hover color~~ | ~~ExerciseSettingsItem.vue~~ | — | ✅ Fixed — slate colors removed         |
| ~~Hardcoded hover color~~ | ~~ExerciseSelectorDialog.vue~~ | — | ✅ Fixed — slate colors removed       |
| Custom icon button    | ExerciseFormView.vue       | —       | Renamed from CreateCustomExercise.vue       |
| Filter pills          | TheExercisesView.vue       | 76-88   | Custom pattern, consider extraction         |

### Templates Feature

**Files:** `src/features/templates/components/`, `src/views/`

| Issue                    | File                     | Line        | Description                             |
| ------------------------ | ------------------------ | ----------- | --------------------------------------- |
| ~~Custom increment buttons~~ ✅ Fixed | ~~TemplateExerciseItem.vue~~ (renamed `TemplateBlockItem.vue`) | — | Now uses `<Button>` for inc/dec (verified 2026-07-13) |
| Icon size inconsistency  | TemplateBlockItem.vue (renamed from TemplateExerciseItem.vue) | ~200s | Not re-verified 2026-07-13, file renamed |
| Footer spacing           | CreateTemplateView.vue   | 87          | `gap-3` vs `gap-2` elsewhere            |
| Footer spacing           | TemplateDetailView.vue   | 126         | `gap-3` vs `gap-2` elsewhere            |

### Views

**Files:** `src/views/`

| Issue                 | File                    | Line    | Description                          |
| --------------------- | ----------------------- | ------- | ------------------------------------ |
| Custom page layout    | TheExercisesView.vue    | 44-137  | Doesn't use PageLayout               |
| Custom page layout    | TheSettingsView.vue     | 14-36   | Doesn't use PageLayout               |
| Custom page layout    | CreateBenchmarkView.vue | 83-185  | Doesn't use PageLayout               |
| Hero title style      | TheExercisesView.vue    | 49      | `text-4xl font-semibold`             |
| Hero title style      | TheSettingsView.vue     | 17      | `text-3xl font-bold`                 |
| Empty state pattern   | TheExercisesView.vue    | 105-122 | Custom div instead of Empty          |
| Loading state padding | Multiple                | -       | Mix of `py-8` and `py-16`            |
| Footer safe area      | WorkoutSummaryView.vue  | 241     | Has `safe-area-bottom`, others don't |

### Shared Components

**Files:** `src/components/`

| Issue                    | File                        | Line  | Description                             |
| ------------------------ | --------------------------- | ----- | --------------------------------------- |
| Dialog footer pattern A  | ErrorDialog.vue             | 34    | `flex flex-col gap-3 sm:flex-row`       |
| Dialog footer pattern B  | WorkoutConfigureAmrapDialog | 107   | `pt-4 border-t flex gap-3`              |
| Custom close buttons     | ExercisePicker.vue          | 85-91 | Duplicates MobileDialogContent          |
| Card interactive pattern | TemplateListCard.vue        | 33    | `<Card role="button">` vs native button |
| Text chevron             | TemplateListCard.vue        | 47    | Uses `›` text, not ChevronRight icon    |
| ~~Text chevron~~ ✅ Fixed | ~~ExerciseListItem.vue~~    | —     | Now uses `<ChevronRight>` icon (verified 2026-07-13) |
| Mobile height values     | ExercisePicker.vue          | 82    | `sm:max-h-[80vh]`                       |
| Mobile height values     | WorkoutConfigureAmrapDialog | 60    | `sm:max-h-[85vh]`                       |

---

## Recommended Action Plan

### Phase 1: High Priority (Breaking Issues)

- [x] Add i18n to BenchmarkCompletionScreen (3 strings) ✅ Done — component removed, i18n full (see Cross-Cutting Issue #6)
- [x] Replace `bg-slate-*` with `bg-muted` in exercises feature (4 locations) ✅ Done (see Cross-Cutting Issue #2)
- [x] Standardize dialog footer pattern (create DialogActions component) ✅ Done — `DialogActions` exists and is used widely (see Cross-Cutting Issue #1)

### Phase 2: Medium Priority (Consistency)

- [ ] Replace custom `<button>` with Button component in:
  - [x] SettingsDataSection (export/import) ✅ Done
  - [x] TemplateExerciseItem (increment/decrement) ✅ Done (component renamed `TemplateBlockItem.vue`)
  - [x] BenchmarkTypeCard (type selection) ✅ Done
  - [ ] CreateCustomExercise (icon picker) — component renamed `ExerciseFormView.vue`, not re-verified 2026-07-13
- [ ] Standardize button sizing hierarchy
- [ ] Replace custom empty states with Empty component
- [ ] Remove redundant close buttons (use MobileDialogContent prop)

### Phase 3: Low Priority (Polish)

- [ ] Standardize icon sizing to `size-4`/`size-5`
- [ ] Unify footer button spacing to `gap-2`
- [ ] Standardize loading state padding
- [ ] Add `safe-area-bottom` to all footers
- [ ] Consider extracting reusable components:
  - [ ] FilterPill
  - [ ] NumberInput (increment/decrement)
  - [ ] StatusBadge

---

## Design System Gaps Identified

These patterns should be documented or added to the design system:

1. **Button Sizing Hierarchy** - When to use `size="lg"` vs default vs `size="sm"`
2. **Dialog Content Spacing** - Standard padding/spacing for dialog internals
3. **Empty State Component** - Always use shadcn Empty, not custom divs
4. **Section Background Patterns** - Hero (`gradient`), standard (`bg-muted/30`), subtle (`bg-muted/20`)
5. **Typography Scale for Focus UI** - Hero numbers `text-7xl`, titles `text-5xl`
6. **Mobile Dialog Heights** - Centralize in MobileDialogContent variants
7. **Interactive Card Pattern** - Prefer `<button>` over `<Card role="button">`
