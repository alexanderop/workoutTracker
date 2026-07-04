import { describe, it, expect, afterEach } from 'vitest'
import { getWorkoutsRepository } from '@/db'
import {
  getRepositoryProvider,
  resetRepositoryProvider,
  setRepositoryProvider,
} from '@/db/provider'
import { createMockRepositoryProvider } from '@/__tests__/helpers/mockRepositories'

describe('setRepositoryProvider', () => {
  afterEach(() => {
    resetRepositoryProvider()
  })

  it('should return the injected mock repository when set before resolving repositories', () => {
    const mockProvider = createMockRepositoryProvider()

    setRepositoryProvider(mockProvider)

    expect(getWorkoutsRepository()).toBe(mockProvider.workouts)
  })

  it('should fall back to the default Dexie-backed provider after resetting', () => {
    const mockProvider = createMockRepositoryProvider()
    setRepositoryProvider(mockProvider)
    expect(getWorkoutsRepository()).toBe(mockProvider.workouts)

    resetRepositoryProvider()

    expect(getWorkoutsRepository()).not.toBe(mockProvider.workouts)
    expect(getRepositoryProvider()).not.toBe(mockProvider)
  })
})
