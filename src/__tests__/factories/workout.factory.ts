import type { Workout } from '@/features/workout/composables/useWorkout'
import { createStrengthBlock } from './block.factory'

const DEFAULTS: Readonly<Omit<Workout, 'blocks'>> = {
  id: 1,
  name: 'Test Workout',
  selectedBlockIndex: 0,
  startedAt: Date.now(),
  mode: 'builder',
  activeSetIndex: null,
}

export function createWorkout(overrides: Partial<Workout> = {}): Workout {
  const blocks = overrides.blocks ?? [createStrengthBlock()]
  return {
    ...DEFAULTS,
    blocks,
    selectedBlockIndex: overrides.selectedBlockIndex ?? (blocks.length > 0 ? 0 : -1),
    ...overrides,
  }
}
