/**
 * The habits page's persisted layout choice.
 *
 * Reads and writes the `habitViewMode` user-setting through a narrow port
 * (`HabitViewModeStore`) rather than the global settings store: this is a
 * habits-only concern, and `src/stores/settings.ts` already declines to track
 * `theme` and `autoSaveInterval` for the same reason.
 *
 * Optimistic by design (local-first ideal 1 -- no spinners): `setMode` moves
 * the ref first and persists after, and a failed write leaves the user on the
 * mode they picked rather than snapping them back. Losing the *persistence*
 * of a preference is a smaller harm than the page changing layout under their
 * hands.
 *
 * Not a `createGlobalState()` singleton, matching `useHabits`: only one
 * consumer (`HabitsView`) is ever on screen, and each mount reloads.
 */
import { ref } from 'vue'
import type { Ref } from 'vue'
import { DEFAULT_HABIT_VIEW_MODE } from '@/db/schema'
import type { HabitViewMode } from '@/db/schema'
import type { Context } from '@/lib/di/context'
import { useRuntimeContext } from '@/lib/di/vue'
import { tryCatch } from '@/lib/tryCatch'
import { HabitViewModeStore } from '../services'
import type { HabitViewModePrefs } from '../services'

export type UseHabitViewMode = {
  mode: Ref<HabitViewMode>
  load: () => Promise<void>
  setMode: (mode: HabitViewMode) => Promise<boolean>
}

export function useHabitViewMode(
  ctx: Context<HabitViewModePrefs> = useRuntimeContext<HabitViewModePrefs>(),
): UseHabitViewMode {
  const store = ctx.get(HabitViewModeStore)

  // Starts at the default so the first paint renders a real layout instead of
  // nothing while the stored value is in flight.
  const mode = ref<HabitViewMode>(DEFAULT_HABIT_VIEW_MODE)

  /**
   * Set once the user picks a mode, so a slow `load()` cannot overwrite it.
   * `HabitsView` calls `load()` on mount; the toggle is a one-tap control right
   * there, so a pick can easily land first and the read would otherwise snap the
   * layout back to whatever was stored.
   */
  let userHasChosen = false

  /**
   * Writes are chained rather than issued in parallel. `store.set` is async, so
   * two quick taps could resolve out of order and leave the *older* mode
   * persisted while the UI shows the newer one -- the ref and the database
   * disagreeing is precisely the bug persistence exists to avoid.
   */
  let pendingWrites: Promise<unknown> = Promise.resolve()

  async function load(): Promise<void> {
    const [error, stored] = await tryCatch(store.get())
    if (error) {
      console.error('Failed to read habit view mode:', error)
      return
    }
    if (userHasChosen) return
    mode.value = stored
  }

  async function setMode(next: HabitViewMode): Promise<boolean> {
    userHasChosen = true
    mode.value = next

    const write = pendingWrites.then(() => store.set(next))
    // Swallow on the chain itself so one rejection does not poison later writes;
    // the caller still sees this write's own outcome via `tryCatch` below.
    pendingWrites = write.catch(() => {})

    const [error] = await tryCatch(write)
    if (error) {
      console.error('Failed to save habit view mode:', error)
      return false
    }
    return true
  }

  return { mode, load, setMode }
}
