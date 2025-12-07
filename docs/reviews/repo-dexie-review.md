# Code Review: repo-dexie Branch

**Date:** 2025-12-06
**Branch:** `repo-dexie`
**Reviewer:** Claude Code (8 parallel review agents)

## Summary

Reviewed **45+ changed files** introducing a database provider/interface pattern for Dexie access. Overall the refactoring demonstrates **excellent architecture** with clean separation of concerns. Found **2 critical issues**, **8 high-priority items**, and several medium/low improvements.

---

## Critical Issues

### 1. Security: Insufficient JSON Schema Validation (Prototype Pollution Risk)

**Location:** `src/features/settings/utils/dataImport.ts:45-85`
**OWASP:** A03:2021 Injection / A08:2021 Data Integrity Failures

The `validateExportData` function only validates top-level structure but not nested content. Attackers can craft JSON with `__proto__` pollution payloads.

**Fix:** Implement comprehensive Zod schemas with `.strict()` to reject unknown properties:

```typescript
import { z } from 'zod'

const ExportDataSchema = z.object({
  version: z.number().int().min(1).max(100),
  exportedAt: z.string().datetime(),
  data: z.object({
    settings: z.array(DbUserSettingSchema).max(20),
    customExercises: z.array(DbCustomExerciseSchema).max(500),
    // ... with .strict() on all schemas
  }).strict(),
}).strict()
```

### 2. Security: No File Size Limits on Import (DoS)

**Location:** `src/features/settings/utils/dataImport.ts:96`

Import accepts JSON files without size limits, enabling browser-freezing attacks.

**Fix:** Add 10MB maximum file size check before parsing.

---

## High Priority Issues

### TypeScript: 2 Type Assertions with @ts-expect-error

**Locations:**
- `src/db/implementations/dexie/settings.ts:23-24, 36-37`
- `src/features/settings/utils/dataImport.ts:83-84`

**Fix:** Replace with proper type guards using discriminated union exhaustive switching.

### Performance: Deep Reactivity on Large Data Structures

**Locations:**
- `src/stores/workoutState.ts:17` - Workout singleton
- `src/stores/exercises.ts:9` - Custom exercises array

**Impact:** During active workouts, Vue tracks thousands of nested paths unnecessarily.

**Fix:** Change `ref` to `shallowRef` (1-line change each; existing immutable update patterns already support this).

### Accessibility: Missing ARIA Labels on Interactive Cards

**Location:** `src/views/TheWorkoutsView.vue:86-107, 126-145`

Cards with `role="button"` lack `aria-label`. Screen readers announce "button" without context.

**Fix:** Add `:aria-label="t('workouts.aria.openTemplate') + ' ' + template.name"`.

### Accessibility: Touch Targets Too Small

**Location:** `src/features/templates/components/TemplateExerciseItem.vue:79-103`

Set count controls are 40x40px, below 44x44px PWA recommendation.

---

## Refactoring Opportunities (Fowler)

| Priority | Issue | Location | Suggestion |
|----------|-------|----------|------------|
| High | Duplicated timed block conversion | `templates.ts:119-181` | Extract `createTimedWorkoutBlock` helper |
| High | Repetitive block converters | `converters.ts:153-320` | Use converter registry pattern |
| Medium | Settings setter duplication | `settings.ts:40-75` | Factory function `createSettingSetter()` |
| Medium | Trivial repository getters | `db/index.ts:18-40` | Consider direct property access `db.activeWorkout` |
| Low | Deprecated function | `db/index.ts:57-59` | Remove `deleteAllData()` wrapper |

---

## Vue Component Issues

| Component | Issue | Impact |
|-----------|-------|--------|
| CreateTemplateView.vue | Business logic in view (50+ lines) | Medium |
| TheWorkoutsView.vue | Data fetching in view, duplicate card rendering | Medium |
| WorkoutSummaryView.vue | 292 lines mixing stats, confetti, dialogs | Medium |
| WorkoutDetailView.vue | Complex template conditionals for block types | Low |

**Fix:** Extract `useTemplateCreation`, `useWorkoutsList` composables; create `TemplateListCard`, `WorkoutHistoryCard` components.

---

## Test Quality

**Score:** 8.5/10

**Strengths:**
- Excellent Testing Trophy adherence (integration tests)
- Proper query priority (getByRole, getByText)
- Database reset uses repository pattern correctly

**Issue:** `localization.spec.ts:44-46` directly manipulates i18n internals instead of testing rendered UI.

---

## Architecture

**Grade:** A+ (EXEMPLARY)

✅ Zero feature-to-feature imports
✅ Clean repository abstraction
✅ Proper dependency direction (views → features → shared)
✅ Type-safe interfaces with readonly parameters

The workout state singleton shared across features is **acceptable** because it lives in `/src/stores/` (shared layer).

---

## Security Summary

| Severity | Count | Key Issues |
|----------|-------|------------|
| High | 1 | Prototype pollution via insufficient validation |
| Medium | 3 | DoS via large files, IndexedDB injection, unvalidated strings |
| Low | 2 | Reactive proxy leakage, no rate limiting |

---

## Recommended Actions (Top 5)

1. **[CRITICAL]** Implement Zod validation schemas for data import with `.strict()` mode
2. **[CRITICAL]** Add file size limits (10MB max) on import
3. **[HIGH]** Convert `workout` and `customExercises` refs to `shallowRef`
4. **[HIGH]** Add aria-labels to interactive cards in TheWorkoutsView
5. **[HIGH]** Replace `@ts-expect-error` comments with proper type guards

---

## Sections Passing Review

✅ **Architecture** - Exemplary feature isolation
✅ **Performance** - Database queries optimized (parallel Promise.all)
✅ **Bundle** - No barrel imports, tree-shakeable

---

## Detailed Findings by Reviewer

### Fowler Refactoring Review

The refactoring successfully introduces a clean repository pattern. Main opportunities:

1. **Timed block conversion duplication** - 80+ lines of similar code for EMOM, AMRAP, Tabata, ForTime blocks
2. **Block converters** - 10+ repetitive functions that could use a registry pattern
3. **Settings setters** - 5 identical patterns that could use a factory function

### Vue Component Review

Components successfully use the database provider pattern. Key improvements:

1. **CreateTemplateView** - Extract 50+ lines of business logic to `useTemplateCreation` composable
2. **TheWorkoutsView** - Extract data loading to composable, create reusable card components
3. **WorkoutSummaryView** - Split 292-line component into smaller pieces (stats, confetti, dialogs)

### TypeScript Review

Strong type safety with only 2 violations:

1. Settings repository uses `@ts-expect-error` for discriminated union handling
2. Data import validation uses `@ts-expect-error` for narrowing unknown to ExportData

Both fixable with proper type guards.

### Accessibility Review

Good semantic HTML and keyboard support. Issues:

1. Interactive cards missing accessible names (high severity)
2. Touch targets below 44x44px minimum (medium severity)
3. Missing live regions for loading states (medium severity)

### Performance Review

Solid overall with key improvements needed:

1. **shallowRef for workout state** - Eliminates deep reactivity overhead during active workouts
2. **shallowRef for exercises store** - Reduces overhead on exercise list mutations
3. **Explicit watch cleanup** in useWorkoutPersistence for defensive programming

### Security Review

Data import/export functionality needs hardening:

1. Add Zod schemas with strict validation
2. Implement file size limits
3. Validate ID uniqueness and formats
4. Add import rate limiting
