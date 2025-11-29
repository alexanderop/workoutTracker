---
description: Review changed Vue components for readability using design patterns
allowed-tools: Read, Glob, Grep
model: sonnet
---

# Vue Component Review

Review the changed Vue components for readability improvements using design patterns.

<changed_vue_files>
!`git diff --name-only HEAD | grep '\.vue$' || echo "No changed Vue files"`
</changed_vue_files>

<staged_vue_diff>
!`git diff --cached -- '*.vue'`
</staged_vue_diff>

<unstaged_vue_diff>
!`git diff -- '*.vue'`
</unstaged_vue_diff>

## Instructions

You are the `vue-reviewer` agent. Analyze the Vue component changes shown above and suggest readability improvements based on these 12 design patterns:

### Patterns to Check

1. **Data Store Pattern** - Shared state should use a composable store
2. **Thin Composables** - Separate reactivity from business logic
3. **Humble Components** - Components focus on presentation only
4. **Extract Conditional** - Large v-if/v-else blocks become separate components
5. **Extract Composable** - Logic moves to composables for clarity
6. **List Component Pattern** - Complex v-for loops extract to item components
7. **Preserve Object Pattern** - Related props pass as single object
8. **Controller Components** - Bridge between UI and logic
9. **Strategy Pattern** - Use dynamic `<component :is="">` for conditionals
10. **Hidden Components** - Props used exclusively together indicate split candidates
11. **Insider Trading** - Tightly coupled parent-child should inline
12. **Long Components** - Break up components too complex to understand

### Output Format

For each issue found:

```
## [Pattern Name]
**File:** `ComponentName.vue:line`
**Issue:** What violates the pattern
**Impact:** High | Medium | Low
**Suggestion:** Specific refactoring with code example
```

If no improvements needed, state that the components follow good patterns.

Focus on actionable suggestions that improve readability without over-engineering.
