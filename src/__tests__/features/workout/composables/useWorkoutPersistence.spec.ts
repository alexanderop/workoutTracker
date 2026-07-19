import { ref } from 'vue'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useWorkoutPersistence } from '@/features/workout/composables/useWorkoutPersistence'
import { getActiveWorkoutRepository, getHabitsRepository } from '@/db'
import { resetDatabase } from '@/__tests__/setup'
import { createDbHabit, createDbStrengthBlock, createWorkout } from '@/__tests__/factories'
import { getStartOfDay } from '@/lib/date'
import type { DbActiveWorkout } from '@/db/schema'

function seedActiveWorkout(overrides: Partial<DbActiveWorkout> = {}): Promise<DbActiveWorkout> {
  const workout: DbActiveWorkout = {
    id: 'current',
    name: 'Test Workout',
    blocks: [createDbStrengthBlock()],
    selectedBlockIndex: 0,
    startedAt: Date.now() - 60_000,
    lastModifiedAt: Date.now(),
    mode: 'active',
    activeSetIndex: null,
    activeExerciseIndex: null,
    benchmarkId: null,
    globalTimerStartedAt: null,
    ...overrides,
  }
  return getActiveWorkoutRepository()
    .save(workout)
    .then(() => workout)
}

/**
 * Integration coverage for the habit auto-link hook wired into
 * `completeWorkout()` (src/features/workout/composables/useWorkoutPersistence.ts).
 * The pure linking logic itself is covered in
 * src/__tests__/lib/habits/autoLinkWorkout.spec.ts -- these tests exist to
 * prove the hook is actually wired up through the real completion path,
 * and that a habit-repo failure never breaks workout completion.
 */
describe('useWorkoutPersistence completeWorkout -> habit auto-link', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  it('marks a binary auto-link habit done when the workout completes', async () => {
    const habitsRepository = getHabitsRepository()
    const habit = createDbHabit({ kind: { type: 'binary' }, autoLink: 'completed-workout' })
    await habitsRepository.addHabit(habit)
    await seedActiveWorkout()

    const { completeWorkout } = useWorkoutPersistence(ref(createWorkout()))
    const completed = await completeWorkout()

    expect(completed).not.toBeNull()
    const entries = await habitsRepository.getEntriesForDay(
      getStartOfDay(new Date(completed!.completedAt)),
    )
    expect(entries.find((e) => e.habitId === habit.id)?.value).toBe(1)
  })

  it('does not auto-link a habit with autoLink: null', async () => {
    const habitsRepository = getHabitsRepository()
    const habit = createDbHabit({ kind: { type: 'binary' }, autoLink: null })
    await habitsRepository.addHabit(habit)
    await seedActiveWorkout()

    const { completeWorkout } = useWorkoutPersistence(ref(createWorkout()))
    const completed = await completeWorkout()

    expect(completed).not.toBeNull()
    const entries = await habitsRepository.getEntriesForDay(
      getStartOfDay(new Date(completed!.completedAt)),
    )
    expect(entries).toHaveLength(0)
  })

  it('completes the workout even when the habits repository throws', async () => {
    const habitsRepository = getHabitsRepository()
    const habit = createDbHabit({ kind: { type: 'binary' }, autoLink: 'completed-workout' })
    await habitsRepository.addHabit(habit)
    await seedActiveWorkout()

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(habitsRepository, 'getAllHabits').mockRejectedValueOnce(new Error('boom'))

    const { completeWorkout } = useWorkoutPersistence(ref(createWorkout()))
    const completed = await completeWorkout()

    // Workout completion itself must be unaffected by the habits failure.
    expect(completed).not.toBeNull()
    expect(completed?.name).toBe('Test Workout')
    expect(consoleErrorSpy).toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
  })
})
