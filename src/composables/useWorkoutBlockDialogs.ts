import type { WritableComputedRef } from 'vue'
import type { TimedBlockKind } from '@/types/blocks'
import { useDialogState } from './useDialogState'

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

export type WorkoutBlockDialogsState = {
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

export function useWorkoutBlockDialogs(
  controller?: WorkoutBlockDialogController,
): WorkoutBlockDialogsState {
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
