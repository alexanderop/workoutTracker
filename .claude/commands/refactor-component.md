---
description: Automatically refactor large Vue components using design patterns
allowed-tools: Read, Write, Glob, Grep, Edit, Bash
---

# Component Refactor Assistant

Automatically refactor a Vue component by analyzing its structure and applying proven design patterns to improve maintainability, testability, and reusability.

## Target Component

**Path:** `{{ component_path }}`

## Analysis & Refactoring Strategy

### Step 1: Component Analysis

1. **Read** the component file completely
2. **Analyze** its structure:
   - Total lines of code
   - Number of reactive refs/computed
   - Number of functions
   - Number of template conditionals and loops
   - Presence of nested components
   - Business logic vs UI logic ratio
3. **Identify** refactoring opportunities based on these criteria:
   - **Long Components** (>300 lines) → Break into smaller components
   - **Multiple Local States** → Extract into composables
   - **Business Logic in Template** → Extract to composables/utilities
   - **Complex Conditionals** → Extract into child components
   - **v-for Loops with Complex Content** → Extract into list components
   - **Monolithic Structure** → Apply Controller Component pattern

### Step 2: Pattern Detection & Planning

For each pattern identified, create a refactoring plan:

```
PATTERN: Long Components
├─ Current: 520 lines
├─ Target: <100 lines (controller)
└─ Strategy: Extract 6 child components

PATTERN: Data Store
├─ State: workout, selectedExercise
├─ Actions: selectExercise, toggleSetComplete, addExercise, removeExercise
└─ Composable: useWorkout.ts

PATTERN: Thin Composables
├─ Timer Logic: toggleTimer, resetTimer, formatTime
└─ Composable: useRestTimer.ts

PATTERN: Utility Functions
├─ calculate10RM(kg, reps)
├─ formatTime(seconds)
└─ File: workout-utils.ts
```

### Step 3: File Generation

Generate files in this order:

#### 3A. Utility Functions (if applicable)
- File: `src/lib/{domain}-utils.ts`
- Contents: Pure functions extracted from component
- Example: `calculate10RM()`, `formatTime()`

#### 3B. Composables (if applicable)
- Files: `src/composables/use{Feature}.ts`
- Contents: Reactive state + business logic
- Patterns to follow:
  - Export a function `use{Feature}()`
  - Use `ref()` for state, `computed()` for derived state
  - Return object with state and methods
  - Include TypeScript interfaces

Example composable structure:
```typescript
import { computed, ref } from 'vue'

export function useWorkout() {
  const state = ref<WorkoutState>(initialState)

  const selectedExercise = computed(() => {
    return state.value.exercises.find(e => e.id === state.value.selectedExerciseId)
  })

  function selectExercise(id: number) {
    state.value.selectedExerciseId = id
  }

  return {
    state,
    selectedExercise,
    selectExercise,
    // ... other methods
  }
}
```

#### 3C. Child Components (if applicable)
- Files: `src/components/{domain}/{Feature}.vue`
- Contents: UI components that receive props and emit events
- Pattern: "Props Down, Events Up"
- Each component has single responsibility
- File naming: `{ComponentName}{Section}.vue`

Example child component structure:
```typescript
// src/components/workout/ChildComponent.vue
interface Props {
  title: string
  data: SomeType[]
}

// defineProps<Props>()
// defineEmits<{
//   action: [value: string]
// }>()
```

#### 3D. Updated Main Component
- Pattern: Controller Component
- Contents: Orchestrates child components & composables
- Structure:
  ```typescript
  // src/views/MainComponent.vue
  // Import composables
  // Import child components
  // Wire everything together
  ```

### Step 4: Implementation

1. **Create all files** in order (utils → composables → components → update main)
2. **Preserve types** - All generated TypeScript must be strictly typed
3. **Use path aliases** - Import from `@/lib`, `@/composables`, `@/components`
4. **Add comments** - Brief JSDoc or inline comments explaining purpose
5. **Maintain functionality** - No features should be lost or changed

### Step 5: Validation

1. Check that all new files are syntactically valid Vue/TypeScript
2. Verify all imports use correct paths and aliases
3. Ensure no circular dependencies between files
4. Check that props flow correctly ("Props Down, Events Up")
5. Verify all original functionality is preserved

### Step 6: Metrics & Reporting

Calculate and report:

**Before Metrics:**
- Total lines: X
- Components: 1
- Composables: 0
- Functions: N

**After Metrics:**
- Main component lines: Y (reduction: X-Y)
- New components: N
- New composables: M
- New utility functions: K

**Summary:**
```
✅ Refactoring Complete

📊 Improvements:
  • Component size reduced by X%
  • {N} reusable child components created
  • {M} state/logic composables extracted
  • {K} pure utility functions extracted

📁 Files Created:
  + src/lib/...
  + src/composables/...
  + src/components/{domain}/...

📝 Files Modified:
  ~ src/views/{ComponentName}.vue

⚙️  Recommended Next Steps:
  1. Run: pnpm type-check
  2. Run: pnpm lint
  3. Run: pnpm test
  4. Review components for domain-specific adjustments
```

## Critical Requirements

- ✅ All generated code must be valid TypeScript with proper types
- ✅ All composables must follow Vue 3 Composition API patterns
- ✅ All child components must follow "Props Down, Events Up" principle
- ✅ No breaking changes to component interface
- ✅ All files must use project conventions (imports, naming, formatting)
- ✅ Maintain logical grouping (workout features in `workout/` folder, etc.)
- ✅ Do NOT delete original files - create new alongside them
