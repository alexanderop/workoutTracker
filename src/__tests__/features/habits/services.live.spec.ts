import { describe, it, expect, afterEach } from 'vitest'
import { useServices } from '@/features/habits/services.live'
import { HabitRepo } from '@/features/habits/services'
import { getRepositoryProvider, setRepositoryProvider } from '@/db/provider'
import { installProviderUnderTest } from '@/__tests__/helpers/providerUnderTest'
import { createFakeHabitRepository } from '@/__tests__/fakes/habitRepository'

/**
 * Pins the invariant `useServices()`'s doc comment now states: it builds a
 * fresh runtime per call rather than memoizing the runtime/context/repository
 * at module scope, so a `setRepositoryProvider` swap (what `resetDatabase()`
 * does via `installProviderUnderTest()` between every integration spec) is
 * always picked up by the *next* `useServices()` call.
 */
describe('useServices', () => {
  afterEach(() => {
    installProviderUnderTest()
  })

  it('resolves the currently installed provider rather than one memoized at module scope', () => {
    const first = createFakeHabitRepository()
    setRepositoryProvider({ ...getRepositoryProvider(), habits: first })

    expect(useServices().get(HabitRepo)).toBe(first)

    const second = createFakeHabitRepository()
    setRepositoryProvider({ ...getRepositoryProvider(), habits: second })

    expect(useServices().get(HabitRepo)).toBe(second)
  })
})
