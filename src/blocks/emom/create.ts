import type { BlockExercise } from '../shared/types'
import type { EmomBlock, EmomConfig } from './types'

export function createEmomWorkoutBlock(
  config: EmomConfig,
  exercises: ReadonlyArray<BlockExercise>,
  id: number,
): EmomBlock {
  return {
    kind: 'emom',
    id,
    config: { minutes: config.minutes, exerciseRotation: config.exerciseRotation },
    exercises: [...exercises],
    result: null,
  }
}
