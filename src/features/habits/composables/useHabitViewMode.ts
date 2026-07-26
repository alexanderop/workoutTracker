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
  isLoaded: Ref<boolean>
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
  const isLoaded = ref(false)

  async function load(): Promise<void> {
    const [error, stored] = await tryCatch(store.get())
    if (error) {
      console.error('Failed to read habit view mode:', error)
      isLoaded.value = true
      return
    }
    mode.value = stored
    isLoaded.value = true
  }

  async function setMode(next: HabitViewMode): Promise<boolean> {
    mode.value = next
    const [error] = await tryCatch(store.set(next))
    if (error) {
      console.error('Failed to save habit view mode:', error)
      return false
    }
    return true
  }

  return { mode, isLoaded, load, setMode }
}
