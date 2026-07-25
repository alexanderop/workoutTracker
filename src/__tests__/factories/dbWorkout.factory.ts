import type { DbCompletedWorkout } from '@/db/schema'
import type { DbStrengthBlock, DbSet, DbWorkoutBlock } from '@/blocks'
import { generateId } from '@/db/generateId'
import {
  createDbStrengthBlock as createDatabaseStrengthBlock,
  createDbStrengthBlockWithSets as createDatabaseStrengthBlockWithSets,
} from './dbBlock.factory'

const DEFAULTS: Readonly<Omit<DbCompletedWorkout, 'id' | 'blocks'>> = {
  name: 'Test Workout',
  startedAt: Date.now() - 3_600_000,
  completedAt: Date.now(),
  durationSeconds: 3600,
  notes: '',
  benchmarkId: null,
}

export function createDbCompletedWorkout(
  overrides: Partial<DbCompletedWorkout> = {},
): DbCompletedWorkout {
  return {
    id: generateId(),
    ...DEFAULTS,
    blocks: overrides.blocks ?? [createDatabaseStrengthBlock()],
    ...overrides,
  }
}

export class DbWorkoutBuilder {
  private workout: DbCompletedWorkout

  constructor() {
    this.workout = createDbCompletedWorkout({ blocks: [] })
  }

  withName(name: string): this {
    this.workout = { ...this.workout, name }
    return this
  }

  withNotes(notes: string): this {
    this.workout = { ...this.workout, notes }
    return this
  }

  withDuration(seconds: number): this {
    this.workout = { ...this.workout, durationSeconds: seconds }
    return this
  }

  withTimestamps(startedAt: number, completedAt: number): this {
    this.workout = { ...this.workout, startedAt, completedAt }
    return this
  }

  withBlock(block: DbWorkoutBlock): this {
    this.workout = {
      ...this.workout,
      blocks: [...this.workout.blocks, block],
    }
    return this
  }

  withStrengthBlock(overrides: Partial<DbStrengthBlock> = {}): this {
    const orderIndex = this.workout.blocks.length
    const block = createDatabaseStrengthBlock({ orderIndex, ...overrides })
    this.workout = {
      ...this.workout,
      blocks: [...this.workout.blocks, block],
    }
    return this
  }

  // Backward compatible alias
  withExercise(overrides: Partial<DbStrengthBlock> = {}): this {
    return this.withStrengthBlock(overrides)
  }

  withExerciseAndSets(
    sets: ReadonlyArray<Partial<DbSet>>,
    exerciseOverrides: Partial<Omit<DbStrengthBlock, 'sets'>> = {},
  ): this {
    const orderIndex = this.workout.blocks.length
    const block = createDatabaseStrengthBlockWithSets(sets, { orderIndex, ...exerciseOverrides })
    this.workout = {
      ...this.workout,
      blocks: [...this.workout.blocks, block],
    }
    return this
  }

  build(): DbCompletedWorkout {
    return this.workout
  }
}

export function dbWorkoutBuilder(): DbWorkoutBuilder {
  return new DbWorkoutBuilder()
}
