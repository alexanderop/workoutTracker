import { describe, expect, it } from 'vitest'
import { useWeightLogSheet } from '@/features/weight/composables/useWeightLogSheet'
import type { DbWeightEntry } from '@/db/schema'

/**
 * Node-tier spec: the sheet's state machine is plain reactive state over
 * pure date math, no DOM, no IndexedDB. `now` is injected to pin "today"
 * instead of relying on fake timers.
 */

// 2026-07-30 12:00:00 local time.
const NOW = new Date(2026, 6, 30, 12, 0, 0).getTime()
const TODAY_START = new Date(2026, 6, 30, 0, 0, 0).getTime()

function entry(overrides: Partial<DbWeightEntry> = {}): DbWeightEntry {
  return {
    id: 'entry-1',
    weight: 80,
    date: TODAY_START,
    recordedAt: NOW,
    ...overrides,
  }
}

function makeSheet(entries: ReadonlyArray<DbWeightEntry> = []) {
  return useWeightLogSheet({ entries: () => entries, now: () => NOW })
}

describe('useWeightLogSheet', () => {
  it('starts on today, in form view, before any openFor()', () => {
    const sheet = makeSheet()

    expect(sheet.view.value).toEqual({ kind: 'form' })
    expect(sheet.selectedDay.value).toBe(TODAY_START)
  })

  it('openFor() re-reads now() into todayStart and selects the given day', () => {
    const sheet = makeSheet()
    const twoDaysAgo = TODAY_START - 2 * 24 * 60 * 60 * 1000

    sheet.openFor(twoDaysAgo)

    expect(sheet.todayStart.value).toBe(TODAY_START)
    expect(sheet.selectedDay.value).toBe(twoDaysAgo)
    expect(sheet.view.value).toEqual({ kind: 'form' })
  })

  it('openFor() defaults to today when no day is given', () => {
    const sheet = makeSheet()
    sheet.selectDay(TODAY_START - 24 * 60 * 60 * 1000)

    sheet.openFor()

    expect(sheet.selectedDay.value).toBe(TODAY_START)
  })

  it('openFor() clamps a future day down to todayStart', () => {
    const sheet = makeSheet()
    const tomorrow = TODAY_START + 24 * 60 * 60 * 1000

    sheet.openFor(tomorrow)

    expect(sheet.selectedDay.value).toBe(TODAY_START)
  })

  it('openCalendar() switches to calendar view on the selected month', () => {
    const sheet = makeSheet()
    const startOfJuly = new Date(2026, 6, 1).getTime()

    sheet.openCalendar()

    expect(sheet.view.value).toEqual({ kind: 'calendar', visibleMonth: startOfJuly })
  })

  it('openCalendar() is a no-op when already in calendar view', () => {
    const sheet = makeSheet()
    sheet.openCalendar()
    sheet.showNextMonth()
    const viewBefore = sheet.view.value

    sheet.openCalendar()

    expect(sheet.view.value).toEqual(viewBefore)
  })

  it('closeCalendar() returns to form view without changing the selection', () => {
    const sheet = makeSheet()
    const yesterday = TODAY_START - 24 * 60 * 60 * 1000
    sheet.openFor(yesterday)
    sheet.openCalendar()

    sheet.closeCalendar()

    expect(sheet.view.value).toEqual({ kind: 'form' })
    expect(sheet.selectedDay.value).toBe(yesterday)
  })

  it('goToToday() selects today and returns to form view from the calendar', () => {
    const sheet = makeSheet()
    const yesterday = TODAY_START - 24 * 60 * 60 * 1000
    sheet.openFor(yesterday)
    sheet.openCalendar()

    sheet.goToToday()

    expect(sheet.selectedDay.value).toBe(TODAY_START)
    expect(sheet.view.value).toEqual({ kind: 'form' })
  })

  it('selectDay() selects a past day and switches to form view', () => {
    const sheet = makeSheet()
    const yesterday = TODAY_START - 24 * 60 * 60 * 1000
    sheet.openCalendar()

    sheet.selectDay(yesterday)

    expect(sheet.selectedDay.value).toBe(yesterday)
    expect(sheet.view.value).toEqual({ kind: 'form' })
  })

  it('selectDay() ignores a future day and stays in calendar view', () => {
    const sheet = makeSheet()
    const tomorrow = TODAY_START + 24 * 60 * 60 * 1000
    sheet.openCalendar()
    sheet.showNextMonth()
    const viewBefore = sheet.view.value
    const selectedBefore = sheet.selectedDay.value

    sheet.selectDay(tomorrow)

    expect(sheet.selectedDay.value).toBe(selectedBefore)
    expect(sheet.view.value).toEqual(viewBefore)
  })

  it('showPreviousMonth() and showNextMonth() shift the visible month only in calendar view', () => {
    const sheet = makeSheet()
    const startOfJuly = new Date(2026, 6, 1).getTime()
    const startOfJune = new Date(2026, 5, 1).getTime()
    const startOfAugust = new Date(2026, 7, 1).getTime()

    // No-op outside calendar view.
    sheet.showNextMonth()
    expect(sheet.view.value).toEqual({ kind: 'form' })

    sheet.openCalendar()
    expect(sheet.view.value).toEqual({ kind: 'calendar', visibleMonth: startOfJuly })

    sheet.showPreviousMonth()
    expect(sheet.view.value).toEqual({ kind: 'calendar', visibleMonth: startOfJune })

    sheet.showNextMonth()
    sheet.showNextMonth()
    expect(sheet.view.value).toEqual({ kind: 'calendar', visibleMonth: startOfAugust })
  })

  it('showNextMonth() allows navigating into a future month', () => {
    const sheet = makeSheet()
    const startOfAugust = new Date(2026, 7, 1).getTime()

    sheet.openCalendar()
    sheet.showNextMonth()

    expect(sheet.view.value).toEqual({ kind: 'calendar', visibleMonth: startOfAugust })
  })

  it('existingEntry reflects the selected day and stays reactive to the entries list', () => {
    const entries = [entry({ id: 'today', date: TODAY_START })]
    const sheet = makeSheet(entries)

    expect(sheet.existingEntry.value?.id).toBe('today')

    const yesterday = TODAY_START - 24 * 60 * 60 * 1000
    sheet.openFor(yesterday)

    expect(sheet.existingEntry.value).toBeUndefined()
  })
})
