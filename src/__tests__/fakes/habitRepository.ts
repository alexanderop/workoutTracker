/**
 * In-memory `HabitRepository` fake (C5, habits pilot). Node-safe: only
 * `import type` from `@/db/schema` and `@/db/interfaces`, so it is reachable
 * from the Node `unit` tier (enforced by
 * `src/__tests__/architecture/unitTierImports.test.ts`). No `vi`/Vitest
 * import — a plain factory usable from any tier.
 *
 * Honours the `@throws` / ordering / dedup contracts documented on
 * `HabitRepository` (`src/db/interfaces.ts:608-676`).
 */
import type { DbHabit, DbHabitEntry } from '@/db/schema'
import type { HabitRepository, HabitSnapshot, LiveQuery } from '@/db/interfaces'

export function createFakeHabitRepository(initial?: {
  habits?: ReadonlyArray<DbHabit>
  entries?: ReadonlyArray<DbHabitEntry>
}): HabitRepository {
  let habits: Array<DbHabit> = initial?.habits ? [...initial.habits] : []
  let entries: Array<DbHabitEntry> = initial?.entries ? [...initial.entries] : []

  function requireHabit(id: string): DbHabit {
    const found = habits.find((existing) => existing.id === id)
    if (found === undefined) throw new Error(`Habit not found: ${id}`)
    return found
  }

  async function getAllHabits(): Promise<ReadonlyArray<DbHabit>> {
    return habits
      .filter((existing) => existing.archivedAt === null)
      .toSorted((a, b) => a.orderIndex - b.orderIndex)
  }

  async function getArchivedHabits(): Promise<ReadonlyArray<DbHabit>> {
    return habits
      .filter((existing) => existing.archivedAt !== null)
      .toSorted((a, b) => (b.archivedAt ?? 0) - (a.archivedAt ?? 0))
  }

  async function getHabitById(id: string): Promise<DbHabit | undefined> {
    return habits.find((existing) => existing.id === id)
  }

  function observeAll(): LiveQuery<HabitSnapshot> {
    // Minimal: fires once with the current snapshot on subscribe, honouring
    // the port's documented initial emission. Not reactive to later writes —
    // nothing in the pilot consumes it (the plan forbids wiring it in).
    return {
      async get(): Promise<HabitSnapshot> {
        return { habits: [...habits], entries: [...entries] }
      },
      subscribe(onChange: (value: HabitSnapshot) => void): () => void {
        onChange({ habits: [...habits], entries: [...entries] })
        return () => {}
      },
    }
  }

  async function addHabit(habitToAdd: Readonly<DbHabit>): Promise<void> {
    habits = [...habits, { ...habitToAdd }]
  }

  async function updateHabit(
    id: string,
    updates: Partial<Omit<DbHabit, 'id' | 'createdAt'>>,
  ): Promise<void> {
    requireHabit(id)
    habits = habits.map((existing) => (existing.id === id ? { ...existing, ...updates } : existing))
  }

  async function archiveHabit(id: string): Promise<void> {
    requireHabit(id)
    habits = habits.map((existing) =>
      existing.id === id ? { ...existing, archivedAt: Date.now() } : existing,
    )
  }

  async function unarchiveHabit(id: string): Promise<void> {
    requireHabit(id)
    habits = habits.map((existing) =>
      existing.id === id ? { ...existing, archivedAt: null } : existing,
    )
  }

  async function reorderHabits(ids: ReadonlyArray<string>): Promise<void> {
    const knownIds = new Set(habits.map((existing) => existing.id))
    const orderIndexById = new Map(
      ids.filter((id) => knownIds.has(id)).map((id, index) => [id, index]),
    )
    habits = habits.map((existing) => {
      const orderIndex = orderIndexById.get(existing.id)
      return orderIndex === undefined ? existing : { ...existing, orderIndex }
    })
  }

  async function upsertEntry(entryToUpsert: Readonly<DbHabitEntry>): Promise<void> {
    const withoutSameDay = entries.filter(
      (existing) =>
        !(existing.habitId === entryToUpsert.habitId && existing.date === entryToUpsert.date),
    )
    entries = [...withoutSameDay, { ...entryToUpsert }]
  }

  async function deleteEntry(id: string): Promise<void> {
    entries = entries.filter((existing) => existing.id !== id)
  }

  async function clearEntryForDay(habitId: string, date: number): Promise<void> {
    entries = entries.filter(
      (existing) => !(existing.habitId === habitId && existing.date === date),
    )
  }

  async function getEntriesForHabit(habitId: string): Promise<ReadonlyArray<DbHabitEntry>> {
    return entries
      .filter((existing) => existing.habitId === habitId)
      .toSorted((a, b) => a.date - b.date)
  }

  async function getEntriesInRange(from: number, to: number): Promise<ReadonlyArray<DbHabitEntry>> {
    return entries
      .filter((existing) => existing.date >= from && existing.date <= to)
      .toSorted((a, b) => a.date - b.date)
  }

  async function getEntriesForDay(date: number): Promise<ReadonlyArray<DbHabitEntry>> {
    return entries.filter((existing) => existing.date === date)
  }

  return {
    getAllHabits,
    getArchivedHabits,
    getHabitById,
    observeAll,
    addHabit,
    updateHabit,
    archiveHabit,
    unarchiveHabit,
    reorderHabits,
    upsertEntry,
    deleteEntry,
    clearEntryForDay,
    getEntriesForHabit,
    getEntriesInRange,
    getEntriesForDay,
  }
}
