import type { WritableComputedRef } from 'vue'
import { useDialogState } from '@/composables/useDialogState'
import type { TimedBlockKind } from '@/types/blocks'

export type WorkoutBlockDialog =
  | 'addBlock'
  | 'configureAmrap'
  | 'configureEmom'
  | 'configureTabata'
  | 'configureForTime'
  | 'configureCardio'

const timedBlockDialogByKind = {
  amrap: 'configureAmrap',
  emom: 'configureEmom',
  tabata: 'configureTabata',
  fortime: 'configureForTime',
} as const satisfies Record<TimedBlockKind, WorkoutBlockDialog>

export type UseWorkoutBlockDialogsReturn = {
  addBlockDialogOpen: WritableComputedRef<boolean>
  configureAmrapOpen: WritableComputedRef<boolean>
  configureEmomOpen: WritableComputedRef<boolean>
  configureTabataOpen: WritableComputedRef<boolean>
  configureForTimeOpen: WritableComputedRef<boolean>
  configureCardioOpen: WritableComputedRef<boolean>
  openAddBlockDialog: () => void
  openTimedBlockDialog: (kind: TimedBlockKind) => void
  openCardioBlockDialog: () => void
}

export type WorkoutBlockDialogController = {
  createDialogModel(dialogName: WorkoutBlockDialog): WritableComputedRef<boolean>
  open(dialogName: WorkoutBlockDialog): void
}

/**
 * v-model bindings and open helpers for the workout block dialogs (add block
 * plus the per-kind configure dialogs). Only one dialog is open at a time.
 *
 * @param controller Optional shared dialog controller (e.g. from a parent view);
 * defaults to a standalone `useDialogState` instance
 */
export function useWorkoutBlockDialogs(
  controller?: WorkoutBlockDialogController,
): UseWorkoutBlockDialogsReturn {
  const standaloneController = useDialogState<WorkoutBlockDialog>()
  const { createDialogModel, open } = controller ?? standaloneController

  const addBlockDialogOpen = createDialogModel('addBlock')
  const configureAmrapOpen = createDialogModel('configureAmrap')
  const configureEmomOpen = createDialogModel('configureEmom')
  const configureTabataOpen = createDialogModel('configureTabata')
  const configureForTimeOpen = createDialogModel('configureForTime')
  const configureCardioOpen = createDialogModel('configureCardio')

  function openAddBlockDialog(): void {
    open('addBlock')
  }

  function openTimedBlockDialog(kind: TimedBlockKind): void {
    open(timedBlockDialogByKind[kind])
  }

  function openCardioBlockDialog(): void {
    open('configureCardio')
  }

  return {
    addBlockDialogOpen,
    configureAmrapOpen,
    configureEmomOpen,
    configureTabataOpen,
    configureForTimeOpen,
    configureCardioOpen,
    openAddBlockDialog,
    openTimedBlockDialog,
    openCardioBlockDialog,
  }
}
