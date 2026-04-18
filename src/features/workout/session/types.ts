import type {
  AmrapConfig,
  AmrapResult,
  BlockExercise,
  CardioConfig,
  CardioResult,
  EmomConfig,
  EmomResult,
  ForTimeConfig,
  ForTimeResult,
  StrengthBlock,
  TabataConfig,
  TabataResult,
} from '@/types/blocks'
import type { Set, Workout } from '@/types/workout'

export type CompleteSetOutcome =
  | { kind: 'uncompleted' }
  | { kind: 'invalid' }
  | { kind: 'completed'; nextAction: 'next-set'; blockIndex: number; setId: number }
  | { kind: 'completed'; nextAction: 'next-block'; blockIndex: number }
  | { kind: 'completed'; nextAction: 'workout-complete' }

export type SessionState =
  | { status: 'empty' }
  | { status: 'draft'; workout: Workout }
  | { status: 'running'; workout: Workout; lastOutcome: CompleteSetOutcome | null }
  | { status: 'completed'; workout: Workout }

export type StrengthBlockSeed = {
  exerciseDefinitionId: string
  name: string
  equipment: StrengthBlock['equipment']
  image: Blob | null
  prefill?: { kg: string; reps: string; duration: string; rir: string }
}

export type TimedResult = AmrapResult | EmomResult | TabataResult | ForTimeResult

export type Command =
  | { type: 'NewDraft' }
  | { type: 'LoadActive'; workout: Workout }
  | { type: 'StartWorkout'; now: number }
  | { type: 'FinishWorkout' }
  | { type: 'Discard' }
  | { type: 'ReturnToBuilder' }
  | { type: 'AddStrengthBlock'; seed: StrengthBlockSeed }
  | { type: 'AddAmrapBlock'; config: AmrapConfig; exercises: ReadonlyArray<BlockExercise> }
  | { type: 'AddEmomBlock'; config: EmomConfig; exercises: ReadonlyArray<BlockExercise> }
  | { type: 'AddTabataBlock'; config: TabataConfig; exercise: BlockExercise }
  | { type: 'AddForTimeBlock'; config: ForTimeConfig; exercises: ReadonlyArray<BlockExercise> }
  | { type: 'AddCardioBlock'; config: CardioConfig }
  | { type: 'RemoveBlock'; blockIndex: number }
  | { type: 'ReorderBlocks'; fromIndex: number; toIndex: number }
  | { type: 'SelectBlock'; blockIndex: number }
  | {
      type: 'UpdateStrengthBlock'
      blockIndex: number
      updates: Partial<
        Pick<StrengthBlock, 'name' | 'equipment' | 'targetReps' | 'targetDuration' | 'targetWeight'>
      >
    }
  | {
      type: 'UpdateSetValue'
      blockIndex: number
      setId: number
      field: 'kg' | 'reps' | 'duration' | 'rir'
      value: number | undefined
    }
  | { type: 'AddSet'; blockIndex: number }
  | { type: 'RemoveSet'; blockIndex: number; setId: number }
  | { type: 'DuplicateSet'; blockIndex: number; setId: number }
  | { type: 'SetSetCount'; blockIndex: number; count: number }
  | { type: 'ActivateSet'; blockIndex: number; setIndex: number }
  | { type: 'CompleteSet'; set: Set; useDurationValidation: boolean }
  | { type: 'SetBlockResult'; blockIndex: number; result: TimedResult }
  | { type: 'SetCardioResult'; blockIndex: number; result: CardioResult }
  | { type: 'JumpTo'; blockIndex: number }

export type Effect = { kind: 'persist' } | { kind: 'clearPersisted' }

export type ReduceResult = { next: SessionState; effects: ReadonlyArray<Effect> }

export function hasWorkout(
  state: SessionState,
): state is Exclude<SessionState, { status: 'empty' }> {
  return state.status !== 'empty'
}
