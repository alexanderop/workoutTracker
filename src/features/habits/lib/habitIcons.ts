import { type AppIconKey, isAppIconKey } from '@/components/app-icons'

export type HabitIconPreset = Readonly<{
  key: AppIconKey
  /** Suffix under `habits.form.icons.*`. */
  labelKey: string
}>

/**
 * Icons the habit form offers, in picker order.
 *
 * Habit icons used to be free-text emoji; the picker is now a closed set so
 * every habit renders in the same drawn style as the exercise artwork.
 */
export const HABIT_ICON_PRESETS: ReadonlyArray<HabitIconPreset> = [
  { key: 'habit-water', labelKey: 'water' },
  { key: 'habit-run', labelKey: 'run' },
  { key: 'habit-strength', labelKey: 'strength' },
  { key: 'habit-meditate', labelKey: 'meditate' },
  { key: 'habit-read', labelKey: 'read' },
  { key: 'habit-journal', labelKey: 'journal' },
  { key: 'habit-sleep', labelKey: 'sleep' },
  { key: 'habit-nutrition', labelKey: 'nutrition' },
  { key: 'habit-no-smoke', labelKey: 'noSmoke' },
  { key: 'habit-clean', labelKey: 'clean' },
  { key: 'habit-check', labelKey: 'check' },
  { key: 'habit-progress', labelKey: 'progress' },
]

/**
 * Resolve a persisted habit icon to bundled artwork.
 *
 * `fallback` differs per surface -- the today list leans on progress/check
 * glyphs, everything else on the generic habit marker -- and also covers
 * habits saved with a hand-typed emoji the icon set has no equivalent for.
 */
export function resolveHabitIcon(
  icon: string | null,
  fallback: AppIconKey = 'habit-default',
): AppIconKey {
  return isAppIconKey(icon) ? icon : fallback
}
