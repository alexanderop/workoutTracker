import { describe, expect, it } from 'vitest'
import { useDialogState } from '@/composables/useDialogState'

type TestDialog = 'edit' | 'delete' | 'confirm'

describe('useDialogState', () => {
  describe('initial state', () => {
    it('starts with no dialog open', () => {
      const { activeDialog } = useDialogState<TestDialog>()

      expect(activeDialog.value).toBeNull()
    })
  })

  describe('open()', () => {
    it('opens the specified dialog', () => {
      const { activeDialog, open } = useDialogState<TestDialog>()

      open('edit')

      expect(activeDialog.value).toBe('edit')
    })

    it('closes previously open dialog when opening a new one', () => {
      const { activeDialog, open } = useDialogState<TestDialog>()

      open('edit')
      open('delete')

      expect(activeDialog.value).toBe('delete')
    })
  })

  describe('close()', () => {
    it('closes the currently open dialog', () => {
      const { activeDialog, open, close } = useDialogState<TestDialog>()

      open('edit')
      close()

      expect(activeDialog.value).toBeNull()
    })

    it('does nothing when no dialog is open', () => {
      const { activeDialog, close } = useDialogState<TestDialog>()

      close()

      expect(activeDialog.value).toBeNull()
    })
  })

  describe('isOpen()', () => {
    it('returns true when the specified dialog is open', () => {
      const { open, isOpen } = useDialogState<TestDialog>()

      open('edit')

      expect(isOpen('edit').value).toBe(true)
    })

    it('returns false when a different dialog is open', () => {
      const { open, isOpen } = useDialogState<TestDialog>()

      open('delete')

      expect(isOpen('edit').value).toBe(false)
    })

    it('returns false when no dialog is open', () => {
      const { isOpen } = useDialogState<TestDialog>()

      expect(isOpen('edit').value).toBe(false)
    })

    it('is reactive to dialog state changes', () => {
      const { open, close, isOpen } = useDialogState<TestDialog>()
      const editOpen = isOpen('edit')

      expect(editOpen.value).toBe(false)

      open('edit')
      expect(editOpen.value).toBe(true)

      close()
      expect(editOpen.value).toBe(false)
    })
  })

  describe('createDialogModel()', () => {
    it('returns a computed that reads false when dialog is closed', () => {
      const { createDialogModel } = useDialogState<TestDialog>()

      const editOpen = createDialogModel('edit')

      expect(editOpen.value).toBe(false)
    })

    it('returns a computed that reads true when dialog is open', () => {
      const { createDialogModel, open } = useDialogState<TestDialog>()

      const editOpen = createDialogModel('edit')
      open('edit')

      expect(editOpen.value).toBe(true)
    })

    it('opens the dialog when set to true', () => {
      const { createDialogModel, activeDialog } = useDialogState<TestDialog>()

      const editOpen = createDialogModel('edit')
      editOpen.value = true

      expect(activeDialog.value).toBe('edit')
    })

    it('closes the dialog when set to false', () => {
      const { createDialogModel, activeDialog, open } = useDialogState<TestDialog>()

      const editOpen = createDialogModel('edit')
      open('edit')
      editOpen.value = false

      expect(activeDialog.value).toBeNull()
    })

    it('closes other dialogs when setting a different model to true', () => {
      const { createDialogModel, activeDialog, open } = useDialogState<TestDialog>()

      const editOpen = createDialogModel('edit')
      const deleteOpen = createDialogModel('delete')

      open('edit')
      expect(editOpen.value).toBe(true)
      expect(deleteOpen.value).toBe(false)

      deleteOpen.value = true
      expect(editOpen.value).toBe(false)
      expect(deleteOpen.value).toBe(true)
      expect(activeDialog.value).toBe('delete')
    })

    it('multiple models for the same dialog share state', () => {
      const { createDialogModel, open } = useDialogState<TestDialog>()

      const editOpen1 = createDialogModel('edit')
      const editOpen2 = createDialogModel('edit')

      open('edit')

      expect(editOpen1.value).toBe(true)
      expect(editOpen2.value).toBe(true)

      editOpen1.value = false

      expect(editOpen1.value).toBe(false)
      expect(editOpen2.value).toBe(false)
    })
  })
})
