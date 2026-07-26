/**
 * Node-tier specs for `useHabitViewMode` -- the habits page's persisted layout
 * choice. Runs as pure logic: the store port is faked in-line and injected via
 * `Context`, so there is no IndexedDB and no global mutation (ADR 003).
 *
 * The behaviour that matters here is the one the UI suite cannot prove without
 * a real reload: what the composable reads on load, what it writes on change,
 * and that a failed write never strands the UI on a mode the user did not pick.
 */
import { describe, it, expect, vi } from 'vitest'
import { nextTick } from 'vue'
import { useHabitViewMode } from '@/features/habits/composables/useHabitViewMode'
import { HabitViewModeStore } from '@/features/habits/services'
import type { HabitViewModePrefs } from '@/features/habits/services'
import { empty } from '@/lib/di/context'
import type { Context } from '@/lib/di/context'
import type { HabitViewMode } from '@/db/schema'

/** An in-memory `HabitViewModePrefs`, plus a handle on what was written. */
function fakeStore(initial: HabitViewMode = 'cards') {
  const writes: Array<HabitViewMode> = []
  let stored: HabitViewMode = initial
  const prefs: HabitViewModePrefs = {
    async get() {
      return stored
    },
    async set(mode) {
      writes.push(mode)
      stored = mode
    },
  }
  return { prefs, writes }
}

function contextFor(prefs: HabitViewModePrefs): Context<HabitViewModePrefs> {
  return empty().add(HabitViewModeStore, prefs)
}

describe('useHabitViewMode', () => {
  it('starts on the default mode before the stored value has loaded', () => {
    const { prefs } = fakeStore('grid')
    const { mode } = useHabitViewMode(contextFor(prefs))

    // No await: this is the very first paint, and it must not be blank.
    expect(mode.value).toBe('cards')
  })

  it('adopts the stored mode once loaded', async () => {
    const { prefs } = fakeStore('grid')
    const { mode, load } = useHabitViewMode(contextFor(prefs))

    await load()

    expect(mode.value).toBe('grid')
  })

  it('falls back to the default when nothing was ever stored', async () => {
    const { prefs } = fakeStore()
    const { mode, load } = useHabitViewMode(contextFor(prefs))

    await load()

    expect(mode.value).toBe('cards')
  })

  it('persists the mode the user picks', async () => {
    const { prefs, writes } = fakeStore()
    const { mode, setMode } = useHabitViewMode(contextFor(prefs))

    await setMode('rows')

    expect(writes).toEqual(['rows'])
    expect(mode.value).toBe('rows')
  })

  it('survives a reload: a second composable instance reads back what the first wrote', async () => {
    const { prefs } = fakeStore()
    const first = useHabitViewMode(contextFor(prefs))
    await first.setMode('grid')

    // A fresh instance is what a cold app start actually does.
    const second = useHabitViewMode(contextFor(prefs))
    await second.load()

    expect(second.mode.value).toBe('grid')
  })

  it('switches the UI immediately rather than waiting on the write', async () => {
    const { promise: blocked, resolve: release } = Promise.withResolvers<void>()
    const prefs: HabitViewModePrefs = {
      async get() {
        return 'cards'
      },
      set: () => blocked,
    }
    const { mode, setMode } = useHabitViewMode(contextFor(prefs))

    const pending = setMode('grid')
    await nextTick()

    // Local-first ideal 1: never block input on the write.
    expect(mode.value).toBe('grid')
    release()
    await pending
  })

  it('keeps the chosen mode when the write fails, and does not throw', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const prefs: HabitViewModePrefs = {
      async get() {
        return 'cards'
      },
      async set() {
        throw new Error('boom')
      },
    }
    const { mode, setMode } = useHabitViewMode(contextFor(prefs))

    await expect(setMode('rows')).resolves.toBe(false)

    // The user asked for `rows`; a storage failure must not yank them back.
    expect(mode.value).toBe('rows')
    expect(error).toHaveBeenCalled()
  })

  it('keeps the default when the initial read fails', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const prefs: HabitViewModePrefs = {
      async get() {
        throw new Error('boom')
      },
      async set() {},
    }
    const { mode, load } = useHabitViewMode(contextFor(prefs))

    await load()

    expect(mode.value).toBe('cards')
    expect(error).toHaveBeenCalled()
  })
})
