/**
 * Habits pilot — Tags only (ADR 003: brain/decisions/003-effect-style-di.md).
 *
 * `import type` from `@/db/interfaces` is fully erased at compile time, so
 * this module stays importable from the Node `unit` tier. No value import
 * from `@/db` or `src/db/implementations/**` may appear here, directly or
 * transitively — the Live Layer that resolves an actual `HabitRepository`
 * lives in `services.live.ts` instead.
 */
import type { HabitRepository } from '@/db/interfaces'
import type { HabitViewMode } from '@/db/schema'
import { Tag } from '@/lib/di/tag'

export const HabitRepo = Tag<HabitRepository>('HabitRepo')

/**
 * Narrow port over the one user-setting the habits page owns. Deliberately
 * two methods rather than the whole `SettingsRepository`: the unit tier can
 * fake this in three lines, and nothing in the feature gains the ability to
 * read or write unrelated settings.
 */
export type HabitViewModePrefs = {
  get(): Promise<HabitViewMode>
  set(mode: HabitViewMode): Promise<void>
}

export const HabitViewModeStore = Tag<HabitViewModePrefs>('HabitViewModeStore')
