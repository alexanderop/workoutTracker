# Vue.js Style Guide Compliance (Priority B Rules)

## Overview
This memory documents the Vue.js Style Guide violations found in the workoutTracker project and the refactoring done to fix them.

## Violations Found & Fixed

### 1. Tightly-Coupled Component Names (Most Important)
**Problem:** Child components in subdirectories were not prefixed with parent component names, making their relationships unclear and scattering them alphabetically.

**Before:**
```
src/components/workout/
  ├─ ExerciseCarousel.vue
  ├─ RestTimerWidget.vue
  ├─ SetTable.vue
  └─ PreviousHistory.vue

src/components/exercise/
  ├─ MuscleSelector.vue
  ├─ MetricsSelector.vue
  ├─ EquipmentSelector.vue
```

**After:**
```
src/components/workout/
  ├─ WorkoutExerciseCarousel.vue
  ├─ WorkoutRestTimerWidget.vue
  ├─ WorkoutSetTable.vue
  └─ WorkoutPreviousHistory.vue

src/components/exercise/
  ├─ ExerciseMuscleSelector.vue
  ├─ ExerciseMetricsSelector.vue
  ├─ ExerciseEquipmentSelector.vue
```

**Key Takeaway:** Always prefix child components with their parent name. This:
- Groups related files alphabetically
- Makes parent-child relationships explicit in code
- Improves IDE autocomplete context
- Follows Vue Style Guide Rule B

**References:**
- Vue Style Guide: "Tightly coupled component names"
- Updated files: ActiveWorkout.vue, CreateCustomExercise.vue

---

### 2. Multi-Attribute Elements on Single Lines
**Problem:** Elements with multiple attributes were written on a single line, reducing readability.

**Violations Found:**
- `Dialog` elements with `:open`, `@update:open` attributes
- `TableRow` with `v-for`, `:key`, `:class` attributes
- Button elements with multiple attributes in loops

**Example - Before:**
```vue
<Dialog :open="open" @update:open="(val) => $emit('update:open', val)">
```

**Example - After:**
```vue
<Dialog
  :open="open"
  @update:open="(val) => $emit('update:open', val)"
>
```

**Key Takeaway:** Split multi-attribute elements across lines like JavaScript objects. One attribute per line improves readability and makes diffs cleaner.

**Files Fixed:**
- ExerciseMuscleSelector.vue
- ExerciseEquipmentSelector.vue
- ExerciseMetricsSelector.vue
- ExerciseTypeSelector.vue

---

### 3. Complex Expressions in Templates
**Problem:** Complex logic was embedded directly in template expressions, violating the "Simple expressions in templates" rule.

**Before (SetTable.vue:102):**
```vue
{{ set.kg && set.reps ? calculate10RM(parseInt(set.kg), parseInt(set.reps)).toFixed(1) : '—' }}
```

**After:**
```ts
function getFormattedEstimated10RM(set: Set) {
  if (!set.kg || !set.reps)
    return '—'
  return calculate10RM(Number.parseInt(set.kg), Number.parseInt(set.reps)).toFixed(1)
}
```

```vue
{{ getFormattedEstimated10RM(set) }}
```

**Key Takeaway:** Extract complex template logic into methods or computed properties. This:
- Improves template readability
- Makes logic testable and reusable
- Keeps templates declarative (describing "what" not "how")
- Follows Vue Style Guide Rule B

---

## Rules We're Following

### ✅ Already Compliant
1. **Component files** - Each component in its own file
2. **Filename casing** - Consistent PascalCase
3. **Component name casing in templates** - PascalCase in SFCs
4. **Component name casing in JS** - PascalCase imports
5. **Self-closing components** - Used correctly
6. **Quoted attribute values** - All properly quoted
7. **Directive shorthands** - Consistent use of @, :, #

### ⚠️ Fixed During This Session
1. **Tightly coupled component names** - Added parent prefix to 7 components
2. **Multi-attribute elements** - Reformatted 4 Dialog components
3. **Complex template expressions** - Extracted logic from SetTable.vue

---

## How to Avoid These Violations Going Forward

### When Creating New Components:
1. **Naming Convention:**
   - If component is a child of specific parent, prefix with parent name
   - Example: `WorkoutTimer.vue` not just `Timer.vue` if only used in workouts

2. **Template Formatting:**
   - If element has 2+ attributes, split to multiple lines
   - One attribute per line
   - Closing bracket on own line

3. **Template Expressions:**
   - Keep expressions simple (operators, property access, method calls)
   - Extract multi-step logic to methods/computed properties
   - Avoid chained method calls or complex conditionals in templates

### Linting Check:
- Run `pnpm lint` to check for code quality issues
- Run `pnpm type-check` to verify no TypeScript errors
- These commands help catch issues early

---

## Reference Links
- [Vue Style Guide - Priority B Rules](https://vuejs.org/style-guide/)
- Component locations: `src/components/workout/`, `src/components/exercise/`
- Updated view files: `src/views/ActiveWorkout.vue`, `src/views/CreateCustomExercise.vue`

## Summary
All Priority B violations have been fixed. The codebase now follows Vue.js Style Guide conventions for component naming, template formatting, and expression complexity.
