import { addMonths, startOfDay, startOfMonth } from 'date-fns'
import { computed, ref, type ComputedRef } from 'vue'
import type { DbWeightEntry } from '@/db/schema'
import { findEntryForDay } from '../lib/weightLogSheet'

/**
 * The Scale Weight bottom sheet either shows the entry form for one day, or
 * (while the date label is tapped) a calendar for picking a different one.
 * A discriminated union rather than a `showCalendar` boolean plus a separate
 * "which month" field, because the visible month only has meaning while the
 * calendar is open.
 */
export type WeightLogSheetView = { kind: 'form' } | { kind: 'calendar'; visibleMonth: number } // start-of-month timestamp

export type UseWeightLogSheetOptions = {
  /** Live list of all weight entries. Order is not assumed. */
  entries: () => ReadonlyArray<DbWeightEntry>
  /** Injected clock so specs can pin "today". Defaults to Date.now. */
  now?: () => number
}

/**
 * State machine behind the Scale Weight bottom sheet: which day is selected,
 * whether the form or the calendar is showing, and the entry (if any) for
 * the selected day. Pure state/derivation -- persistence is the caller's
 * job via `entries`/upsert/delete on the weight repository.
 */
export function useWeightLogSheet(options: UseWeightLogSheetOptions): {
  view: ComputedRef<WeightLogSheetView>
  selectedDay: ComputedRef<number>
  todayStart: ComputedRef<number>
  existingEntry: ComputedRef<DbWeightEntry | undefined>
  openFor: (day?: number) => void
  openCalendar: () => void
  closeCalendar: () => void
  goToToday: () => void
  selectDay: (day: number) => void
  showPreviousMonth: () => void
  showNextMonth: () => void
} {
  const now = options.now ?? Date.now

  const todayStartValue = ref(startOfDay(now()).getTime())
  const selectedDayValue = ref(todayStartValue.value)
  const viewValue = ref<WeightLogSheetView>({ kind: 'form' })

  const todayStart = computed(() => todayStartValue.value)
  const selectedDay = computed(() => selectedDayValue.value)
  const view = computed(() => viewValue.value)

  const existingEntry = computed<DbWeightEntry | undefined>(() =>
    findEntryForDay(options.entries(), selectedDayValue.value),
  )

  function openFor(day?: number): void {
    todayStartValue.value = startOfDay(now()).getTime()
    const requested = startOfDay(day ?? now()).getTime()
    selectedDayValue.value = Math.min(requested, todayStartValue.value)
    viewValue.value = { kind: 'form' }
  }

  function openCalendar(): void {
    if (viewValue.value.kind === 'calendar') return
    viewValue.value = {
      kind: 'calendar',
      visibleMonth: startOfMonth(selectedDayValue.value).getTime(),
    }
  }

  function closeCalendar(): void {
    viewValue.value = { kind: 'form' }
  }

  function goToToday(): void {
    selectedDayValue.value = todayStartValue.value
    viewValue.value = { kind: 'form' }
  }

  function selectDay(day: number): void {
    const normalized = startOfDay(day).getTime()
    if (normalized > todayStartValue.value) return
    selectedDayValue.value = normalized
    viewValue.value = { kind: 'form' }
  }

  function shiftVisibleMonth(delta: number): void {
    if (viewValue.value.kind !== 'calendar') return
    viewValue.value = {
      kind: 'calendar',
      visibleMonth: addMonths(viewValue.value.visibleMonth, delta).getTime(),
    }
  }

  function showPreviousMonth(): void {
    shiftVisibleMonth(-1)
  }

  function showNextMonth(): void {
    shiftVisibleMonth(1)
  }

  return {
    view,
    selectedDay,
    todayStart,
    existingEntry,
    openFor,
    openCalendar,
    closeCalendar,
    goToToday,
    selectDay,
    showPreviousMonth,
    showNextMonth,
  }
}
