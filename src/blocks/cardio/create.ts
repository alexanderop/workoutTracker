import type { CardioBlock, CardioConfig } from './types'

export function createCardioWorkoutBlock(config: CardioConfig, id: number): CardioBlock {
  return {
    kind: 'cardio',
    id,
    config: {
      activity: config.activity,
      targetDurationSeconds: config.targetDurationSeconds,
      targetDistanceMeters: config.targetDistanceMeters,
    },
    result: null,
  }
}
