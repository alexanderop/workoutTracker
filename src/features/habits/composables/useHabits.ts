/**
 * Imperative shell for habit tracking: owns fetching from HabitRepository
 * and every mutation (create/edit/archive/reorder/log). `HabitRepository`
 * has no `observe*`/LiveQuery method (unlike WeightRepository/
 * TemplatesRepository) -- see the Phase 2 report for that gap. Reactivity
 * here is done the same way `stores/exercises.ts` handles
 * CustomExercisesRepository (which also has no LiveQuery): mutate the DB,
 * then patch the local `ref` state to match, rather than re-querying.
 *
 * Not a `createGlobalState()` singleton -- like `useWeightEntries`, a plain
 * composable is enough because every consumer (HabitsView, the home card)
 * mounts its own instance and only one is ever on screen at a time.
 */
import { computed, ref } from 'vue'
import { generateId, getHabitsRepository } from '@/db'
import type { DbHabit, DbHabitEntry, HabitKind, HabitSchedule } from '@/db/schema'
import { tryCatch } from '@/lib/tryCatch'
import { currentStreak, isEntryComplete, startOfDay, weeklyProgress } from '../lib/habitStats'
import type { WeeklyProgress } from '../lib/habitStats'

export type HabitFormData = {
  name: string
  icon: string | null
  schedule: HabitSchedule
  kind: HabitKind
  autoLink: 'completed-workout' | null
}

/** A habit plus everything its "today" row needs, pre-derived for display. */
export type HabitTodayItem = {
  habit: DbHabit
  value: number
  isComplete: boolean
  streak: number
  weekProgress: WeeklyProgress | null
}

export function useHabits() {
  // Primary State
  const habits = ref<Array<DbHabit>>([])
  const archivedHabits = ref<Array<DbHabit>>([])
  // Full entry history per habit (active + archived), kept in sync locally
  // after every mutation instead of re-fetched (see module doc).
  const entriesByHabit = ref<Map<string, Array<DbHabitEntry>>>(new Map())
  const isLoading = ref(true)

  // Computed
  const hasHabits = computed(() => habits.value.length > 0)

  function entriesFor(habitId: string): ReadonlyArray<DbHabitEntry> {
    return entriesByHabit.value.get(habitId) ?? []
  }

  function todayEntry(habitId: string): DbHabitEntry | undefined {
    const today = startOfDay(Date.now())
    return entriesFor(habitId).find((entry) => entry.date === today)
  }

  function todayValue(habitId: string): number {
    return todayEntry(habitId)?.value ?? 0
  }

  function isCompleteToday(habit: Readonly<DbHabit>): boolean {
    const entry = todayEntry(habit.id)
    return entry !== undefined && isEntryComplete(habit, entry)
  }

  function streakFor(habit: Readonly<DbHabit>): number {
    return currentStreak(habit, entriesFor(habit.id), Date.now())
  }

  function weekProgressFor(habit: Readonly<DbHabit>): WeeklyProgress {
    return weeklyProgress(habit, entriesFor(habit.id), Date.now())
  }

  const todayItems = computed<ReadonlyArray<HabitTodayItem>>(() =>
    habits.value.map((habit) => ({
      habit,
      value: todayValue(habit.id),
      isComplete: isCompleteToday(habit),
      streak: streakFor(habit),
      weekProgress: habit.schedule.type === 'weekly' ? weekProgressFor(habit) : null,
    })),
  )

  // Methods -- loading
  async function refreshEntriesFor(habitIds: ReadonlyArray<string>): Promise<void> {
    const repo = getHabitsRepository()
    const results = await Promise.all(
      habitIds.map(async (id) => [id, await repo.getEntriesForHabit(id)] as const),
    )
    const next = new Map(entriesByHabit.value)
    for (const [id, entries] of results) next.set(id, [...entries])
    entriesByHabit.value = next
  }

  async function load(): Promise<void> {
    isLoading.value = true
    const repo = getHabitsRepository()
    const [active, archived] = await Promise.all([repo.getAllHabits(), repo.getArchivedHabits()])
    habits.value = [...active]
    archivedHabits.value = [...archived]
    await refreshEntriesFor([...active, ...archived].map((habit) => habit.id))
    isLoading.value = false
  }

  // Methods -- entry mutations
  function setLocalEntry(habitId: string, date: number, entry: DbHabitEntry | undefined): void {
    const next = new Map(entriesByHabit.value)
    const withoutDay = (next.get(habitId) ?? []).filter((existing) => existing.date !== date)
    next.set(
      habitId,
      entry ? [...withoutDay, entry].toSorted((a, b) => a.date - b.date) : withoutDay,
    )
    entriesByHabit.value = next
  }

  async function setEntryValue(
    habit: Readonly<DbHabit>,
    date: number,
    value: number,
  ): Promise<boolean> {
    const repo = getHabitsRepository()

    if (value <= 0) {
      const [error] = await tryCatch(repo.clearEntryForDay(habit.id, date))
      if (error) {
        console.error('Failed to clear habit entry:', error)
        return false
      }
      setLocalEntry(habit.id, date, undefined)
      return true
    }

    const entry: DbHabitEntry = {
      id: generateId(),
      habitId: habit.id,
      date,
      value,
      recordedAt: Date.now(),
    }
    const [error] = await tryCatch(repo.upsertEntry(entry))
    if (error) {
      console.error('Failed to save habit entry:', error)
      return false
    }
    setLocalEntry(habit.id, date, entry)
    return true
  }

  /** Toggle today's completion for a binary habit; for a quantity habit, jumps straight to its target. */
  async function toggleToday(habit: Readonly<DbHabit>): Promise<boolean> {
    const today = startOfDay(Date.now())
    if (isCompleteToday(habit)) return setEntryValue(habit, today, 0)
    const value = habit.kind.type === 'quantity' ? habit.kind.target : 1
    return setEntryValue(habit, today, value)
  }

  /** Set today's exact value for a quantity habit (0 clears the entry). */
  async function logQuantityToday(habit: Readonly<DbHabit>, value: number): Promise<boolean> {
    const today = startOfDay(Date.now())
    return setEntryValue(habit, today, Math.max(0, value))
  }

  /** Retro-toggle a past (or today's) day complete/incomplete -- used by the history grid. */
  async function toggleDay(habit: Readonly<DbHabit>, date: number): Promise<boolean> {
    const day = startOfDay(date)
    const entry = entriesFor(habit.id).find((existing) => existing.date === day)
    const alreadyComplete = entry !== undefined && isEntryComplete(habit, entry)
    if (alreadyComplete) return setEntryValue(habit, day, 0)
    const value = habit.kind.type === 'quantity' ? habit.kind.target : 1
    return setEntryValue(habit, day, value)
  }

  // Methods -- habit CRUD
  async function createHabit(data: HabitFormData): Promise<DbHabit | undefined> {
    const repo = getHabitsRepository()
    const habit: DbHabit = {
      id: generateId(),
      name: data.name,
      icon: data.icon,
      schedule: data.schedule,
      kind: data.kind,
      autoLink: data.autoLink,
      archivedAt: null,
      orderIndex: habits.value.length,
      createdAt: Date.now(),
    }
    const [error] = await tryCatch(repo.addHabit(habit))
    if (error) {
      console.error('Failed to create habit:', error)
      return undefined
    }
    habits.value = [...habits.value, habit]
    entriesByHabit.value = new Map(entriesByHabit.value).set(habit.id, [])
    return habit
  }

  async function editHabit(id: string, data: HabitFormData): Promise<boolean> {
    const repo = getHabitsRepository()
    const [error] = await tryCatch(repo.updateHabit(id, data))
    if (error) {
      console.error('Failed to update habit:', error)
      return false
    }
    habits.value = habits.value.map((habit) => (habit.id === id ? { ...habit, ...data } : habit))
    return true
  }

  async function archive(id: string): Promise<boolean> {
    const repo = getHabitsRepository()
    const [error] = await tryCatch(repo.archiveHabit(id))
    if (error) {
      console.error('Failed to archive habit:', error)
      return false
    }
    const habit = habits.value.find((existing) => existing.id === id)
    habits.value = habits.value.filter((existing) => existing.id !== id)
    if (habit) {
      archivedHabits.value = [{ ...habit, archivedAt: Date.now() }, ...archivedHabits.value]
    }
    return true
  }

  async function unarchive(id: string): Promise<boolean> {
    const repo = getHabitsRepository()
    const [error] = await tryCatch(repo.unarchiveHabit(id))
    if (error) {
      console.error('Failed to restore habit:', error)
      return false
    }
    const habit = archivedHabits.value.find((existing) => existing.id === id)
    archivedHabits.value = archivedHabits.value.filter((existing) => existing.id !== id)
    if (habit) {
      habits.value = [...habits.value, { ...habit, archivedAt: null }]
    }
    return true
  }

  async function reorder(ids: ReadonlyArray<string>): Promise<boolean> {
    const repo = getHabitsRepository()
    const [error] = await tryCatch(repo.reorderHabits(ids))
    if (error) {
      console.error('Failed to reorder habits:', error)
      return false
    }
    const byId = new Map(habits.value.map((habit) => [habit.id, habit]))
    habits.value = ids
      .map((id, index) => {
        const habit = byId.get(id)
        return habit ? { ...habit, orderIndex: index } : undefined
      })
      .filter((habit): habit is DbHabit => habit !== undefined)
    return true
  }

  return {
    habits,
    archivedHabits,
    isLoading,
    hasHabits,
    todayItems,
    load,
    entriesFor,
    toggleToday,
    logQuantityToday,
    toggleDay,
    createHabit,
    editHabit,
    archive,
    unarchive,
    reorder,
  }
}
