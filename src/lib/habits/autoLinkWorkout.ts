import type { HabitRepository } from '@/db/interfaces'
import { generateId } from '@/db/generateId'
import { getStartOfDay } from '@/lib/date'
import { type Clock, systemClock } from '@/lib/clock'

/**
 * Auto-link active, workout-linked habits when a workout is completed.
 *
 * For every active (non-archived) habit with `autoLink === 'completed-workout'`:
 * - binary habits are marked done (value 1) for the day -- idempotent, a
 *   second workout completed the same day leaves the entry at value 1.
 * - quantity habits are ignored; workout completion cannot infer their unit.
 *
 * Archived habits and habits with `autoLink: null` are left untouched.
 *
 * Lives in `src/lib` (shared code) rather than under a feature: it's called
 * from both the regular workout-completion path (`useWorkoutPersistence`,
 * in the `workout` feature) and the benchmark-completion path
 * (`useBenchmarkPersistence`, in the `benchmarks` feature), which persist
 * through separate repository methods. Features may not import from each
 * other, so
 * this couldn't live under `src/features/habits` without both call sites
 * violating that boundary -- `src/lib` is importable from any feature.
 *
 * Callers are responsible for failure isolation: a broken habits table must
 * never block or fail workout completion (mid-workout gym UX), so wrap this
 * call in `tryCatch` at the call site rather than relying on this function
 * to swallow errors.
 *
 * `recordedAt` comes from an injectable `Clock` (defaulting to the system
 * clock) so tests can pin it, while `completedAt` -- the workout's own
 * completion instant, used to derive `date` -- stays caller-supplied.
 */
export async function autoLinkWorkoutCompletion(
  habitRepository: HabitRepository,
  completedAt: number,
  clock: Clock = systemClock,
): Promise<void> {
  const date = getStartOfDay(new Date(completedAt))

  const habits = await habitRepository.getAllHabits()

  const linkedHabits = habits.filter(
    (habit) => habit.kind.type === 'binary' && habit.autoLink === 'completed-workout',
  )
  if (linkedHabits.length === 0) return

  const recordedAt = clock.now()

  for (const habit of linkedHabits) {
    await habitRepository.upsertEntry({
      id: generateId(),
      habitId: habit.id,
      date,
      value: 1,
      recordedAt,
    })
  }
}
