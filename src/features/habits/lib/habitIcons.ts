import type { AppIconKey } from '@/components/app-icons'

/**
 * Icons the habit form offers, in picker order.
 *
 * Habit icons used to be free-text emoji; the picker is now a closed set so
 * every habit renders in the same drawn style as the exercise artwork.
 * `labelKey` is a suffix under `habits.form.icons.*`.
 */
export const HABIT_ICON_PRESETS = [
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
] as const satisfies ReadonlyArray<{ key: AppIconKey; labelKey: string }>

/** Shown when a habit has no icon, or one this app no longer recognises. */
const HABIT_ICON_FALLBACK = 'habit-default'

/**
 * The keys a habit may legitimately hold: the picker presets plus the generic
 * marker. Deliberately narrower than `AppIconKey` -- a stored `equipment-barbell`
 * or `trophy` is not a habit icon and must not render as one.
 */
export type HabitIconKey = (typeof HABIT_ICON_PRESETS)[number]['key'] | typeof HABIT_ICON_FALLBACK

const HABIT_ICON_KEYS: ReadonlySet<unknown> = new Set<HabitIconKey>([
  ...HABIT_ICON_PRESETS.map((preset) => preset.key),
  HABIT_ICON_FALLBACK,
])

function isHabitIconKey(value: unknown): value is HabitIconKey {
  return HABIT_ICON_KEYS.has(value)
}

/**
 * Resolve a persisted habit icon to bundled artwork.
 *
 * `fallback` differs per surface -- the today list leans on progress/check
 * glyphs, everything else on the generic habit marker -- and also covers
 * habits saved with a hand-typed emoji the icon set has no equivalent for.
 */
export function resolveHabitIcon(
  icon: string | null,
  fallback: HabitIconKey = HABIT_ICON_FALLBACK,
): HabitIconKey {
  // `fallback` is checked at runtime as well as by the compiler: the return
  // feeds `AppIcon`, which throws on a key with no artwork, so the contract has
  // to hold even if a caller slips past the type.
  const safeFallback = isHabitIconKey(fallback) ? fallback : HABIT_ICON_FALLBACK
  return isHabitIconKey(icon) ? icon : safeFallback
}
