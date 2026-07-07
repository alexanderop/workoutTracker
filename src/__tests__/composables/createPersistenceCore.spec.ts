import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, shallowRef } from 'vue'
import { createPersistenceCore } from '@/composables/persistence/createPersistenceCore'

type Domain = { items: Array<string> }

function createMockRepository() {
  return {
    get: vi.fn<() => Promise<Domain | undefined>>().mockResolvedValue(undefined),
    save: vi.fn<(database: Domain) => Promise<void>>().mockResolvedValue(undefined),
    clear: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    exists: vi.fn<() => Promise<boolean>>().mockResolvedValue(false),
  }
}

function createCore(repository = createMockRepository()) {
  const source = shallowRef<Domain>({ items: [] })
  const core = createPersistenceCore<Domain, Domain>({
    source,
    toDb: () => source.value,
    fromDb: (database) => database,
    repository,
    isEmpty: (domain) => domain.items.length === 0,
    debounceMs: 100,
  })
  return { source, core, repository }
}

describe('createPersistenceCore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should be defined', () => {
    expect(createPersistenceCore).toBeDefined()
  })

  it('auto-saves non-empty data after the debounce window once initialized', async () => {
    const { source, core, repository } = createCore()
    core.markInitialized()

    source.value = { items: ['squat'] }
    await vi.advanceTimersByTimeAsync(150)

    expect(repository.save).toHaveBeenCalledExactlyOnceWith({ items: ['squat'] })
    expect(core.hasUnsavedChanges.value).toBe(false)
  })

  it('does not auto-save before markInitialized', async () => {
    const { source, repository } = createCore()

    source.value = { items: ['squat'] }
    await vi.advanceTimersByTimeAsync(150)

    expect(repository.save).not.toHaveBeenCalled()
  })

  it('clears instead of saving when the data becomes empty', async () => {
    const { source, core, repository } = createCore()
    core.markInitialized()

    source.value = { items: ['squat'] }
    await vi.advanceTimersByTimeAsync(150)
    source.value = { items: [] }
    await vi.advanceTimersByTimeAsync(150)

    expect(repository.clear).toHaveBeenCalledOnce()
    expect(repository.save).toHaveBeenCalledOnce()
  })

  it('does not write when the owning scope is disposed before the debounce fires', async () => {
    const repository = createMockRepository()
    const scope = effectScope()
    const setup = scope.run(() => createCore(repository))!
    setup.core.markInitialized()

    setup.source.value = { items: ['stale write'] }
    scope.stop()
    await vi.advanceTimersByTimeAsync(300)

    expect(repository.save).not.toHaveBeenCalled()
  })

  it('load returns the domain model from the repository', async () => {
    const repository = createMockRepository()
    repository.get.mockResolvedValue({ items: ['from-db'] })
    const { core } = createCore(repository)

    const loaded = await core.load()

    expect(loaded).toEqual({ items: ['from-db'] })
    expect(core.persistenceState.value).toEqual({ status: 'idle' })
  })

  it('surfaces save errors through persistenceState', async () => {
    const repository = createMockRepository()
    const failure = new Error('disk full')
    repository.save.mockRejectedValue(failure)
    const { source, core } = createCore(repository)
    core.markInitialized()

    source.value = { items: ['squat'] }
    await vi.advanceTimersByTimeAsync(150)

    expect(core.persistenceState.value).toEqual({ status: 'error', error: failure })
  })

  it('saveNow persists immediately without waiting for the debounce', async () => {
    const { source, core, repository } = createCore()
    core.markInitialized()

    source.value = { items: ['squat'] }
    await core.saveNow()

    expect(repository.save).toHaveBeenCalledWith({ items: ['squat'] })
  })
})
