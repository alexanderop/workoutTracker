import type { BlockExercise } from '../shared/types'
import type { ForTimeBlock, ForTimeConfig } from './types'

export function createForTimeWorkoutBlock(
  config: ForTimeConfig,
  exercises: ReadonlyArray<BlockExercise>,
  id: number,
): ForTimeBlock {
  return {
    kind: 'fortime',
    id,
    config: { timeCapSeconds: config.timeCapSeconds },
    exercises: [...exercises],
    result: null,
  }
}
