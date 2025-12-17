---
description: Analyze Vue code for refactoring opportunities using design patterns
allowed-tools: Read, Glob, Grep
---

# Vue Design Patterns Analysis

Analyze the target for refactoring opportunities based on Michael Thiessen's Vue design patterns.

## Target

**Input:** `$ARGUMENTS`

Determine if target is a file or directory:
- If path ends in `.vue` or `.ts` → single file analysis
- If path is a directory or feature name (e.g., `benchmarks`) → feature analysis
- For feature names without path, resolve to `src/features/{name}`

## Analysis Mode

### Single File Mode
When target is a file, read and analyze that file for pattern violations.

### Feature Mode
When target is a directory/feature:
1. Use `Glob` to find all `.vue` files in `{target}/components/`
2. Use `Glob` to find all `.ts` files in `{target}/composables/`
3. Analyze feature-level patterns first, then file-level patterns
4. Provide both feature-wide recommendations and per-file findings

## Pattern Application Order

Apply patterns in this priority order. Higher priority patterns are prerequisites for lower ones.

### Priority 1: Foundation (Apply First)
These establish the architectural foundation. Apply before any other refactoring.
- **Data Store Pattern** - Centralizes state management
- **Thin Composables** - Separates business logic from reactivity

### Priority 2: Extraction
Once foundation is solid, extract code into smaller units.
- **Extract Composable** - Pull logic into composables
- **Extract Conditional** - Pull v-if/v-else into components
- **List Component Pattern** - Pull v-for loops into components

### Priority 3: Structure
Organize relationships between components and composables.
- **Controller Components** - Create orchestration layer
- **Humble Components** - Ensure presentation-only components
- **Strategy Pattern** - Consolidate conditional rendering
- **Options Object** - Clean up composable signatures
- **Flexible Arguments** - Normalize composable inputs

### Priority 4: Cleanup (Apply Last)
Final optimizations after structure is established.
- **Insider Trading** - Inline unnecessary wrapper components
- **Hidden Components** - Split components with disjoint props
- **Long Components** - Break down remaining complexity
- **Preserve Object Pattern** - Simplify prop passing
- **Inline Composables** - Group related local logic
- **Hidden Composables** - Split unrelated composable logic
- **Dynamic Return** - Optimize return values

---

## Feature-Level Patterns (Feature Mode Only)

Analyze these cross-cutting concerns when reviewing a whole feature:

### F1. Composable Proliferation
**Smell**: More than 8-10 composables in a single feature
**Check**: Count files in `composables/` directory
**Fix**: Consolidate related composables, inline single-use ones into components

### F2. Circular Dependencies
**Smell**: Composable A imports from B, B imports from A
**Check**: `Grep` for cross-imports between composables
**Fix**: Extract shared logic to a third composable or merge them

### F3. State Fragmentation
**Smell**: Multiple composables managing related state independently
**Check**: Look for similar refs/reactive objects across composables
**Fix**: Consolidate into single state store or shared composable

### F4. Component-Composable Mismatch
**Smell**: Component imports 4+ composables, or composable used by only one component
**Check**: Count imports per component, grep for composable usage
**Fix**: Inline single-use composables, split components using too many

### F5. Missing Controller Layer
**Smell**: View components contain business logic, or many components access store directly
**Check**: Look for store/composable calls in leaf components
**Fix**: Add controller components to orchestrate logic

### F6. Inconsistent Patterns
**Smell**: Same problem solved differently across the feature
**Check**: Compare similar components/composables for pattern consistency
**Fix**: Standardize on one approach

---

## Design Patterns Reference

### Component Patterns

**1. Data Store Pattern** | Priority 1
Create a shareable data store using a composable with global state singleton.
- Global state in module scope (shared across all uses)
- Export some/all state via `toRefs()`
- Methods to access and modify state
- Use `readonly()` for protected state
```ts
const state = reactive({ user: null })
export function useUserStore() {
  return { ...toRefs(state), updateUser }
}
```
**Smell**: Prop drilling through 3+ component layers

**2. Thin Composables** | Priority 1
Separate reactivity management from core business logic. Use pure functions for business logic with a thin reactive layer on top.
```ts
import { convertToFahrenheit } from './temperatureConversion'
export function useTemperature(celsius: Ref<number>) {
  return computed(() => convertToFahrenheit(celsius.value))
}
```
**Smell**: Complex logic embedded in watch/computed callbacks

**3. Humble Components** | Priority 3
Components focus on presentation and user input only. Follow "Props down, events up" principle.
**Smell**: Components fetching data, managing complex state, or containing business logic

**4. Extract Conditional** | Priority 2
Extract large v-if/v-else blocks into separate components for readability.
```vue
<!-- Before -->
<div v-if="condition"><!-- 50 lines --></div>
<div v-else><!-- 50 lines --></div>

<!-- After -->
<TrueComponent v-if="condition" />
<FalseComponent v-else />
```
**Smell**: v-if/v-else blocks with 10+ lines each

**5. Extract Composable** | Priority 2
Extract logic into composables even for single-use cases. Simplifies components and facilitates adding related functionality.
**Smell**: Script section with 100+ lines of related logic

**6. List Component Pattern** | Priority 2
Abstract v-for loop logic into a dedicated list/item component.
```vue
<!-- Before -->
<div v-for="item in list"><!-- complex item template --></div>

<!-- After -->
<ItemList :items="list" />
```
**Smell**: v-for with 20+ lines of template per item

**7. Preserve Object Pattern** | Priority 4
Pass entire object instead of individual props when props are tightly related.
```vue
<!-- Before -->
<UserCard :name="user.name" :email="user.email" :avatar="user.avatar" />

<!-- After -->
<UserCard :user="user" />
```
**Smell**: 5+ props from same object being passed individually

**8. Controller Components** | Priority 3
Bridge between UI (Humble Components) and business logic (composables). Orchestrate behavior.
```vue
<script setup>
const { tasks, addTask, removeTask } = useTasks()
</script>
<template>
  <TaskInput @add="addTask" />
  <TaskList :tasks="tasks" @remove="removeTask" />
</template>
```
**Smell**: UI and logic mixed in same component without clear separation

**9. Strategy Pattern** | Priority 3
Use dynamic `<component :is="">` for conditional rendering based on type/mode.
```vue
<component :is="currentComponent" />
const currentComponent = computed(() => {
  switch (props.type) {
    case 'chart': return ChartView
    case 'table': return TableView
  }
})
```
**Smell**: Long switch/if-else chains determining which component to render

**10. Hidden Components** | Priority 4
Props used exclusively together indicate the component should be split.
```vue
<!-- If chart-* props never used with table-* props, split into two components -->
<DataDisplay :chart-data :chart-options /> <!-- -> <Chart /> -->
<DataDisplay :table-data :table-settings /> <!-- -> <Table /> -->
```
**Smell**: Two or more groups of props that are never used together

**11. Insider Trading (Anti-pattern)** | Priority 4
When child component needs ALL parent props/events, inline it instead.
```vue
<!-- Anti-pattern: Child just passes everything through -->
<Child :a="a" :b="b" :c="c" @x="$emit('x')" @y="$emit('y')" />

<!-- Fix: Inline the child's template directly -->
```
**Smell**: Child receives 5+ props and emits 3+ events that mirror parent exactly

**12. Long Components** | Priority 4
Break down components that are too complex to understand at a glance.
**Smell**: Component exceeds 300 lines or has 10+ reactive refs

### Composable Patterns

**13. Inline Composables** | Priority 4
Create composables within the component file for local reuse or incremental refactoring.
```ts
<script setup>
function useCounter() {
  const count = ref(0)
  const increment = () => count.value++
  return { count, increment }
}
const { count, increment } = useCounter()
</script>
```
**Smell**: Repeated local patterns that could be grouped

**14. Dynamic Return** | Priority 4
Return single value for simple use or object with controls for advanced use.
```ts
// Simple: const count = useCounter()
// Advanced: const { count, reset, undo } = useCounter({ controls: true })
```
**Smell**: Always returning objects when single value often suffices

**15. Flexible Arguments** | Priority 3
Accept refs, getters, or raw values using `ref()` and `toValue()`.
```ts
export function useDouble(input) {
  return computed(() => toValue(input) * 2)
}
// Works with: useDouble(5), useDouble(countRef), useDouble(() => props.count)
```
**Smell**: Multiple `isRef()` checks in composable

**16. Options Object** | Priority 3
Use config object instead of positional parameters.
```ts
// Before: useRefHistory(ref, true, 10, 500)
// After: useRefHistory(ref, { deep: true, capacity: 10, throttle: 500 })
```
**Smell**: Function with 4+ parameters

**17. Async + Sync Pattern** | Priority 4
Support both async await and immediate reactive access.
```ts
const { data } = useAsyncData() // Immediate (null initially)
const { data } = await useAsyncData() // Awaited (resolved value)
```
**Smell**: Separate sync/async versions of same composable

**18. Hidden Composables** | Priority 4
Split composables with mutually exclusive code paths.
```ts
// Before: useUserFlow() with admin AND guest logic
// After: useAdminFlow() and useGuestFlow()
```
**Smell**: if/else branches that never execute together

### Reusability Levels

**Level 1 - Templating**: Extract repeated code into component
**Level 2 - Configuration**: Add props for variations
**Level 3 - Adaptability**: Use slots for flexible content
**Level 4 - Inversion**: Use scoped slots for render instructions
**Level 5 - Extension**: Multiple named slots for extension points
**Level 6 - Nesting**: Pass slots through component layers

---

## Instructions

### For Single File
1. **Read** the target file completely
2. **Check** each pattern's "Smell" indicator against the code
3. **Identify** which patterns apply (usually 1-3 per file)
4. **Sort** recommendations by priority (P1 -> P2 -> P3 -> P4)
5. **Recommend** specific refactorings with code examples

### For Feature/Directory
1. **Glob** for all `.vue` and `.ts` files in the feature
2. **Count** composables and components to check feature-level smells
3. **Grep** for cross-imports and usage patterns
4. **Analyze** feature-level patterns (F1-F6) first
5. **Read** the largest/most complex files for detailed analysis
6. **Identify** both feature-wide and file-specific issues
7. **Sort** all recommendations by priority
8. **Recommend** with clear scope (feature-wide vs specific file)

**Application Order:**
- Apply P1 (Foundation) patterns before P2 (Extraction)
- Apply P2 (Extraction) before P3 (Structure)
- Apply P3 (Structure) before P4 (Cleanup)
- Within same priority, order by impact (High -> Medium -> Low)

---

## Output Format

### Feature Summary (Feature Mode Only)

```
## Feature Overview: {feature-name}

**Components:** X files
**Composables:** Y files
**Total Lines:** ~Z

### Feature-Level Issues

[List F1-F6 issues found, sorted by impact]
```

### Per-Issue Format

For each identified opportunity (sorted by priority):

```
### [Pattern Name] (Priority X)

**Scope:** Feature-wide | `specific-file.vue`
**Location:** `filename:line` or general area
**Current Issue:** What violates the pattern
**Impact:** High | Medium | Low
**Recommendation:** Specific change to make

**Before:**
[code snippet]

**After:**
[refactored code]
```

If no improvements needed, state that the code follows good patterns.

Focus on **actionable suggestions** that improve readability without over-engineering. Prioritize High impact items.
