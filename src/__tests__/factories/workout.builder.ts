import type { Set, Workout } from '@/features/workout/composables/useWorkout'
import type { StrengthBlock, WorkoutBlock } from '@/types/blocks'
import { createStrengthBlock, createStrengthBlockWithSets } from './block.factory'
import { createWorkout } from './workout.factory'

export class WorkoutBuilder {
  private workout: Workout

  constructor() {
    this.workout = createWorkout({ blocks: [] })
  }

  withName(name: string): this {
    this.workout.name = name
    return this
  }

  withBlock(block: WorkoutBlock): this {
    this.workout.blocks.push(block)
    if (this.workout.blocks.length === 1) {
      this.workout.selectedBlockIndex = 0
    }
    return this
  }

  withStrengthBlock(overrides: Partial<StrengthBlock> = {}): this {
    const id = this.workout.blocks.length + 1
    this.workout.blocks.push(createStrengthBlock({ id, ...overrides }))
    if (this.workout.blocks.length === 1) {
      this.workout.selectedBlockIndex = 0
    }
    return this
  }

  // Backward compatible alias for withStrengthBlock
  withExercise(overrides: Partial<StrengthBlock> = {}): this {
    return this.withStrengthBlock(overrides)
  }

  withExerciseAndSets(
    sets: ReadonlyArray<Partial<Set>>,
    exerciseOverrides: Partial<Omit<StrengthBlock, 'sets'>> = {},
  ): this {
    const id = this.workout.blocks.length + 1
    this.workout.blocks.push(createStrengthBlockWithSets(sets, { id, ...exerciseOverrides }))
    if (this.workout.blocks.length === 1) {
      this.workout.selectedBlockIndex = 0
    }
    return this
  }

  selectBlock(blockIndex: number): this {
    this.workout.selectedBlockIndex = blockIndex
    return this
  }

  // Backward compatible alias - selects by exercise ID (finds the block with that ID)
  selectExercise(exerciseId: number): this {
    const index = this.workout.blocks.findIndex((b) => b.id === exerciseId)
    if (index !== -1) {
      this.workout.selectedBlockIndex = index
    }
    return this
  }

  build(): Workout {
    return this.workout
  }
}

export function workoutBuilder(): WorkoutBuilder {
  return new WorkoutBuilder()
}
