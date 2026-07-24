import { beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'
import { getBenchmarksRepository } from '@/db'
import { useBenchmarksList } from '@/features/benchmarks/composables/useBenchmarksList'
import { resetDatabase } from '@/__tests__/setup'
import { createDbBenchmarkRound } from '@/__tests__/factories'

async function seedBenchmark(name: string) {
  return getBenchmarksRepository().create({
    name,
    type: 'fortime',
    rounds: [createDbBenchmarkRound()],
  })
}

describe('useBenchmarksList', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  it('should be defined', () => {
    expect(useBenchmarksList).toBeDefined()
  })

  it('should load benchmarks and personal bests in a bare effect scope', async () => {
    await seedBenchmark('Fran')
    await seedBenchmark('Murph')

    const scope = effectScope()
    const result = scope.run(() => useBenchmarksList())!

    await vi.waitFor(() => expect(result.isLoading.value).toBe(false))
    expect(result.benchmarks.value.map((b) => b.name)).toEqual(
      expect.arrayContaining(['Fran', 'Murph']),
    )
    expect(result.benchmarks.value).toHaveLength(2)

    scope.stop()
  })

  it('should reload via loadAll after a mutation', async () => {
    await seedBenchmark('Fran')

    const scope = effectScope()
    const result = scope.run(() => useBenchmarksList())!
    await vi.waitFor(() => expect(result.benchmarks.value).toHaveLength(1))

    await seedBenchmark('Cindy')
    await result.loadAll()

    expect(result.benchmarks.value).toHaveLength(2)

    scope.stop()
  })

  it('should survive scope disposal while the initial load is in flight', async () => {
    await seedBenchmark('Fran')

    const scope = effectScope()
    const result = scope.run(() => useBenchmarksList())!
    scope.stop()

    // The pending load settles without throwing after the scope is gone
    await vi.waitFor(() => expect(result.isLoading.value).toBe(false))
  })
})
