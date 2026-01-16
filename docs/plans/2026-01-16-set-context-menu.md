# Feature Spec: Set Context Menu in Active Workout

**Date:** 2026-01-16
**Status:** Ready for implementation

## Problem

Users cannot remove or duplicate sets during an active workout. Once a set is added, it cannot be deleted, even if added by mistake.

## Solution

Add a long-press context menu on set rows with Delete and Duplicate actions.

---

## Requirements

| Requirement | Value |
|-------------|-------|
| Trigger | Long press (500ms) |
| Menu options | Delete, Duplicate |
| Target sets | All (completed, active, planned) |
| Minimum sets | 1 must remain |
| Dismiss menu | Tap outside, select action |
| Confirmation | None |

---

## Technical Implementation

### VueUse Composables

| Composable | Purpose |
|------------|---------|
| `onLongPress` | Detect 500ms press on set row |
| `onClickOutside` | Dismiss menu when tapping elsewhere |

### `onLongPress` Configuration

```typescript
onLongPress(setRowRef, openContextMenu, {
  delay: 500,
  distanceThreshold: 10,  // Cancel if finger moves >10px
  modifiers: {
    prevent: true,  // Prevent text selection
    stop: true
  }
})
```

---

## Files to Change

| File | Changes |
|------|---------|
| `src/features/workout/components/WorkoutActiveStrengthView.vue` | Add long-press handler, render context menu |
| `src/features/workout/composables/useWorkout.ts` | Add `duplicateSet(blockIndex, setId)` |
| `src/features/workout/components/SetContextMenu.vue` | **New** - Context menu component |

### Existing Code to Leverage

| What | Where |
|------|-------|
| `removeSet(blockIndex, setId)` | `src/features/workout/composables/useWorkout.ts:509` |
| Delete guard logic | Already checks `block.sets.length <= 1` |
| Set data structure | `src/types/workout.ts` |

---

## Behavior

### Open Menu

1. Long press any set row for 500ms
2. Menu appears near press location
3. If moved >10px during press, cancel

### Delete

- Removes set immediately
- Disabled if only 1 set remains

### Duplicate

- Creates copy after current set
- Copies weight/reps/duration/RIR values
- New set status = `'planned'`

### Close Menu

- Tap outside menu
- Select an action
- Press back/escape

---

## Edge Cases

| Case | Behavior |
|------|----------|
| Last set | Delete option disabled |
| Long press during input focus | Should not trigger menu |
| Duplicate active set | Copy is `'planned'`, original stays active |
| Menu position near edge | Adjust to stay in viewport |

---

## Component Hierarchy

```
WorkoutActiveStrengthView.vue
├── Table rows (set rows)
│   └── onLongPress handler → opens SetContextMenu
└── SetContextMenu.vue (Teleport to body)
    ├── Delete option
    └── Duplicate option
```

---

## Context Menu Example (from VueUse docs)

```vue
<script setup lang="ts">
import { onLongPress, onClickOutside } from '@vueuse/core'
import { ref, useTemplateRef } from 'vue'

const setRow = useTemplateRef('setRow')
const contextMenu = useTemplateRef('contextMenu')
const showMenu = ref(false)
const menuPosition = ref({ x: 0, y: 0 })

function openContextMenu(event: PointerEvent) {
  showMenu.value = true
  menuPosition.value = {
    x: event.clientX,
    y: event.clientY
  }
}

function closeContextMenu() {
  showMenu.value = false
}

onLongPress(setRow, openContextMenu, {
  delay: 500,
  distanceThreshold: 10,
  modifiers: {
    prevent: true,
    stop: true
  }
})

onClickOutside(contextMenu, closeContextMenu, {
  ignore: [setRow]
})
</script>

<template>
  <div ref="setRow" class="set-row">
    <!-- Set content -->
  </div>

  <Teleport to="body">
    <div
      v-if="showMenu"
      ref="contextMenu"
      :style="{
        position: 'fixed',
        left: `${menuPosition.x}px`,
        top: `${menuPosition.y}px`
      }"
    >
      <button @click="handleDelete">Delete</button>
      <button @click="handleDuplicate">Duplicate</button>
    </div>
  </Teleport>
</template>
```
