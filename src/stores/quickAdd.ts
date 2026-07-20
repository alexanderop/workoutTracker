import { createGlobalState } from '@vueuse/core'
import { reactive, ref } from 'vue'

/**
 * Global state for the quick-add bottom sheet opened from the nav's center
 * "+" button. Lives in a store (not view-local state like other dialogs)
 * because the trigger sits in Layout.vue while the sheet itself is mounted
 * once in App.vue, outside any route view.
 */
export const useQuickAddStore = createGlobalState(() => {
  const isOpen = ref(false)

  function open(): void {
    isOpen.value = true
  }

  function close(): void {
    isOpen.value = false
  }

  function $reset(): void {
    isOpen.value = false
  }

  return reactive({
    isOpen,
    open,
    close,
    $reset,
  })
})
