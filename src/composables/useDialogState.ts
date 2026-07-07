import {
  computed,
  shallowReadonly,
  shallowRef,
  type ComputedRef,
  type ShallowRef,
  type WritableComputedRef,
} from 'vue'

export type UseDialogStateReturn<T extends string> = {
  activeDialog: Readonly<ShallowRef<T | null>>
  createDialogModel: (dialogName: T) => WritableComputedRef<boolean>
  open: (dialogName: T) => void
  close: () => void
  isOpen: (dialogName: T) => ComputedRef<boolean>
}

/**
 * Manage single-dialog-at-a-time state with computed v-model bindings.
 * Only one dialog can be open at any time - opening a new dialog closes the previous one.
 *
 * @example
 * type MyDialogs = 'edit' | 'delete' | 'confirm'
 * const { activeDialog, createDialogModel, open, close, isOpen } = useDialogState<MyDialogs>()
 *
 * // In template: v-model:open="editDialogOpen"
 * const editDialogOpen = createDialogModel('edit')
 */
export function useDialogState<T extends string>(): UseDialogStateReturn<T> {
  // State
  const activeDialog = shallowRef<T | null>(null)

  // Methods

  /**
   * Create a writable computed for v-model:open binding.
   * Returns true when the specified dialog is active.
   * Setting to true opens the dialog (closing any other).
   * Setting to false closes the dialog.
   */
  function createDialogModel(dialogName: T): WritableComputedRef<boolean> {
    return computed({
      get: () => activeDialog.value === dialogName,
      set: (value: boolean) => {
        activeDialog.value = value ? dialogName : null
      },
    })
  }

  /**
   * Open a specific dialog (closes any currently open dialog).
   */
  function open(dialogName: T): void {
    activeDialog.value = dialogName
  }

  /**
   * Close the currently open dialog.
   */
  function close(): void {
    activeDialog.value = null
  }

  /**
   * Check if a specific dialog is currently open.
   * Returns a reactive computed for use in templates.
   */
  function isOpen(dialogName: T): ComputedRef<boolean> {
    return computed(() => activeDialog.value === dialogName)
  }

  return {
    activeDialog: shallowReadonly(activeDialog),
    createDialogModel,
    open,
    close,
    isOpen,
  }
}
