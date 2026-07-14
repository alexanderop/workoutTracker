import type { BlockExercise } from '../shared/types'
import type { TabataBlock, TabataConfig } from './types'

export function createTabataWorkoutBlock(
  config: TabataConfig,
  exercise: BlockExercise,
  id: number,
): TabataBlock {
  return {
    kind: 'tabata',
    id,
    config: {
      rounds: config.rounds,
      workSeconds: config.workSeconds,
      restSeconds: config.restSeconds,
    },
    exercise,
    result: null,
  }
}
