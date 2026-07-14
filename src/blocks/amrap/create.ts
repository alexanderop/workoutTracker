import type { BlockExercise } from '../shared/types'
import type { AmrapBlock, AmrapConfig } from './types'

export function createAmrapWorkoutBlock(
  config: AmrapConfig,
  exercises: ReadonlyArray<BlockExercise>,
  id: number,
): AmrapBlock {
  return {
    kind: 'amrap',
    id,
    config: { durationSeconds: config.durationSeconds },
    exercises: [...exercises],
    result: null,
  }
}
