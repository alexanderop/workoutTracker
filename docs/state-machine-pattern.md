# State Machine Pattern for Exclusive UI States

This document explains how to replace multiple boolean flags with a discriminated union when managing mutually exclusive UI states in Vue 3.

## The Problem: Boolean Flag Explosion

When building forms with multiple modals, a common anti-pattern emerges:

```typescript
const showEquipmentModal = ref(false)
const showMuscleModal = ref(false)
const showTypeModal = ref(false)
const showMetricsModal = ref(false)
```

This approach has several issues:

1. **Invalid states are possible** - Nothing prevents `showEquipmentModal` and `showMuscleModal` from both being `true`
2. **No single source of truth** - The "current modal" requires checking all 4 booleans
3. **Scales poorly** - Adding a 5th modal means adding another boolean and updating all close logic
4. **Easy to forget cleanup** - Each handler must remember to set its boolean to `false`

## The Solution: Discriminated Union

Replace the booleans with a single state variable using a discriminated union:

```typescript
type ModalState =
  | { kind: 'closed' }
  | { kind: 'equipment' }
  | { kind: 'muscle' }
  | { kind: 'type' }
  | { kind: 'metrics' }

const modalState = ref<ModalState>({ kind: 'closed' })
```

This approach makes invalid states unrepresentable. The modal can only be in one state at a time by definition.

## Implementation

### 1. Define the State Type

Use a discriminated union with a `kind` property:

```typescript
type ModalState =
  | { kind: 'closed' }
  | { kind: 'equipment' }
  | { kind: 'muscle' }
  | { kind: 'type' }
  | { kind: 'metrics' }

const modalState = ref<ModalState>({ kind: 'closed' })
```

### 2. Add Transition Functions

Create explicit functions to change state:

```typescript
function openModal(kind: ModalState['kind']) {
  modalState.value = { kind }
}

function closeModal() {
  modalState.value = { kind: 'closed' }
}
```

### 3. Add Computed Helpers for Template Compatibility

If your modal components expect boolean `:open` props, create computed helpers:

```typescript
const showEquipmentModal = computed(() => modalState.value.kind === 'equipment')
const showMuscleModal = computed(() => modalState.value.kind === 'muscle')
const showTypeModal = computed(() => modalState.value.kind === 'type')
const showMetricsModal = computed(() => modalState.value.kind === 'metrics')
```

### 4. Update Event Handlers

Simplify your handlers to use the transition functions:

```typescript
// Before: Must remember which boolean to set
function handleEquipmentSelect(selected: Equipment) {
  form.value.equipment = selected
  showEquipmentModal.value = false  // Easy to forget or get wrong
}

// After: Single closeModal call works for all
function handleEquipmentSelect(selected: Equipment) {
  form.value.equipment = selected
  closeModal()
}
```

### 5. Update Template

```vue
<!-- Opening modals -->
<ExerciseSettingsItem
  label="Equipment"
  @click="openModal('equipment')"
/>

<!-- Modal components -->
<ExerciseEquipmentSelector
  :open="showEquipmentModal"
  @update:open="closeModal"
  @select="handleEquipmentSelect"
/>
```

## Benefits

| Aspect | Boolean Flags | Discriminated Union |
|--------|--------------|---------------------|
| Invalid states | Possible (multiple true) | Impossible by design |
| Adding new modal | Add boolean + update handlers | Add union variant |
| Current state | Check N booleans | Read single value |
| Close logic | Set specific boolean false | Call `closeModal()` |
| Type safety | None | Full TypeScript support |

## When to Use This Pattern

Use discriminated unions for mutually exclusive states:

- Modal/dialog management (only one open at a time)
- Multi-step wizards (only one step active)
- Tab navigation (only one tab selected)
- Loading states (`idle | loading | success | error`)

Stick with booleans for truly independent states:

- Multiple toggles that can be on/off independently
- Feature flags
- Simple show/hide without exclusivity requirements

## Extending the Pattern

### Adding State Data

If a modal needs context, extend the union:

```typescript
type ModalState =
  | { kind: 'closed' }
  | { kind: 'equipment' }
  | { kind: 'confirm-delete', exerciseId: string }  // Carries data
```

### Adding Transition Guards

Validate transitions if needed:

```typescript
function openModal(kind: ModalState['kind']) {
  // Guard: Don't allow opening modals while saving
  if (isSaving.value) return

  modalState.value = { kind }
}
```

## Related Patterns

- **useAppInitialization.ts** - Uses discriminated union for app loading states
- **useWorkout.ts** - Uses discriminated union for `CompleteSetResult`
- **useWorkoutPersistence.ts** - Uses discriminated union for `PersistenceState`
