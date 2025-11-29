# Components Guidelines

## Two-Way Binding with `defineModel`

Use Vue 3.4's `defineModel` macro for components that need two-way binding (e.g., dialogs, form inputs, toggles).

**Do this:**
```vue
<script setup lang="ts">
const open = defineModel<boolean>('open', { required: true })

function close() {
  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open">...</Dialog>
</template>
```

**Not this:**
```vue
<script setup lang="ts">
defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [value: boolean] }>()

function close() {
  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">...</Dialog>
</template>
```

### Benefits
- Less boilerplate (no manual prop + emit setup)
- Cleaner parent usage with `v-model:propName`
- Direct `.value` assignment instead of emitting events

## Vue 3.5 APIs

### Reactive Props Destructure

Destructure props directly with default values using native JavaScript syntax. Variables destructured from `defineProps` are automatically reactive.

**Do this:**
```vue
<script setup lang="ts">
const { count = 0, msg = 'hello' } = defineProps<{
  count?: number
  msg?: string
}>()
</script>
```

**Not this:**
```vue
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    count?: number
    msg?: string
  }>(),
  {
    count: 0,
    msg: 'hello'
  }
)
</script>
```

**Important:** When watching or passing destructured props to composables, wrap them in a getter to retain reactivity:
```ts
// ❌ Compile-time error
watch(count, () => { /* ... */ })

// ✅ Wrap in getter
watch(() => count, () => { /* ... */ })

// ✅ Composables should accept getters
useDynamicCount(() => count)
```

### `useTemplateRef()`

Use `useTemplateRef()` for template refs instead of plain refs with matching names. This approach supports dynamic ref bindings.

**Do this:**
```vue
<script setup lang="ts">
import { useTemplateRef } from 'vue'

const inputRef = useTemplateRef('input')
</script>

<template>
  <input ref="input">
</template>
```

**Not this:**
```vue
<script setup lang="ts">
import { ref } from 'vue'

const input = ref<HTMLInputElement | null>(null)
</script>

<template>
  <input ref="input">
</template>
```

### `useId()`

Generate unique IDs that remain stable across server and client renders. Use for form elements and accessibility attributes.

```vue
<script setup lang="ts">
import { useId } from 'vue'

const id = useId()
</script>

<template>
  <form>
    <label :for="id">Name:</label>
    <input :id="id" type="text" />
  </form>
</template>
```

### `onWatcherCleanup()`

Register cleanup callbacks inside watchers. Useful for aborting stale requests or cleaning up side effects.

```ts
import { watch, onWatcherCleanup } from 'vue'

watch(id, (newId) => {
  const controller = new AbortController()

  fetch(`/api/${newId}`, { signal: controller.signal }).then(() => {
    // callback logic
  })

  onWatcherCleanup(() => {
    // abort stale request
    controller.abort()
  })
})
```

### Deferred Teleport

Use the `defer` prop on `<Teleport>` to mount content after the current render cycle. This allows teleporting to elements rendered by Vue after the teleport.

```vue
<template>
  <Teleport defer target="#container">...</Teleport>
  <div id="container"></div>
</template>
```