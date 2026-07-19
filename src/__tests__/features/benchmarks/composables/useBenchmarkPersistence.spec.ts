import { ref } from 'vue'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useBenchmarkPersistence } from '@/features/benchmarks/composables/useBenchmarkPersistence'
import { getActiveBenchmarkWorkoutRepository, getHabitsRepository, generateId } from '@/db'
import { resetDatabase } from '@/__tests__/setup'
import { createDbHabit, createDbForTimeBlock } from '@/__tests__/factories'
import { getStartOfDay } from '@/lib/date'
import type { DbActiveBenchmarkWorkout } from '@/db/schema'
import type { BenchmarkWorkout } from '@/types/benchmark'

function seedActiveBenchmark(
  overrides: Partial<DbActiveBenchmarkWorkout> = {},
): Promise<DbActiveBenchmarkWorkout> {
  const benchmark: DbActiveBenchmarkWorkout = {
    id: 'current-benchmark',
    name: 'Test Benchmark',
    benchmarkId: generateId(),
    blocks: [createDbForTimeBlock()],
    selectedBlockIndex: 0,
    activeExerciseIndex: 0,
    startedAt: Date.now() - 60_000,
    lastModifiedAt: Date.now(),
    globalTimerStartedAt: Date.now() - 60_000,
    mode: 'active',
    ...overrides,
  }
  return getActiveBenchmarkWorkoutRepository()
    .save(benchmark)
    .then(() => benchmark)
}

function createBenchmarkWorkoutRef(): BenchmarkWorkout {
  return {
    id: 'current-benchmark',
    name: 'Test Benchmark',
    benchmarkId: generateId(),
    blocks: [],
    selectedBlockIndex: 0,
    activeExerciseIndex: 0,
    startedAt: Date.now() - 60_000,
    globalTimerStartedAt: Date.now() - 60_000,
    mode: 'active',
  }
}

/**
 * Benchmark completion persists through a separate repository method
 * (`ActiveBenchmarkWorkoutRepository.complete()`) than the regular workout
 * completion path, so the habit auto-link hook (src/lib/habits/autoLinkWorkout.ts)
 * needs its own wiring in `completeBenchmark()`
 * (src/features/benchmarks/composables/useBenchmarkPersistence.ts). These
 * tests mirror src/__tests__/features/workout/composables/useWorkoutPersistence.spec.ts
 * for that separate path.
 */
describe('useBenchmarkPersistence completeBenchmark -> habit auto-link', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  it('marks a binary auto-link habit done when the benchmark completes', async () => {
    const habitsRepository = getHabitsRepository()
    const habit = createDbHabit({
      kind: { type: 'binary' },
      autoLink: 'completed-workout',
    })
    await habitsRepository.addHabit(habit)
    await seedActiveBenchmark()

    const { completeBenchmark } = useBenchmarkPersistence(ref(createBenchmarkWorkoutRef()))
    const completed = await completeBenchmark()

    expect(completed).not.toBeNull()
    const entries = await habitsRepository.getEntriesForDay(
      getStartOfDay(new Date(completed!.completedAt)),
    )
    expect(entries.find((e) => e.habitId === habit.id)?.value).toBe(1)
  })

  it('completes the benchmark even when the habits repository throws', async () => {
    const habitsRepository = getHabitsRepository()
    const habit = createDbHabit({ kind: { type: 'binary' }, autoLink: 'completed-workout' })
    await habitsRepository.addHabit(habit)
    await seedActiveBenchmark()

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(habitsRepository, 'getAllHabits').mockRejectedValueOnce(new Error('boom'))

    const { completeBenchmark } = useBenchmarkPersistence(ref(createBenchmarkWorkoutRef()))
    const completed = await completeBenchmark()

    expect(completed).not.toBeNull()
    expect(completed?.name).toBe('Test Benchmark')
    expect(consoleErrorSpy).toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
  })
})
