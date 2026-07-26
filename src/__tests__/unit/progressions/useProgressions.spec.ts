/**
 * Node-tier composable spec for `useProgressions` — the tracer bullet for the
 * ADR 004 DI template's second conversion
 * (brain/decisions/004-db-in-di.md).
 *
 * Every world is constructed in-line: a fake repository injected through a
 * `Context`, no DOM, no IndexedDB, no global mutation. The repository error
 * branch below was previously unreachable without booting the whole app and
 * monkey-patching the singleton.
 *
 * `onMounted` is not exercised here. Instantiated outside a component there is
 * no instance for Vue to attach the hook to, so these specs call `reload()`
 * explicitly — see the plan's `onMounted` contract.
 */
import { describe, it, expect } from 'vitest'
import { useProgressions } from '@/features/progressions/composables/useProgressions'
import { ProgressionRepo } from '@/features/progressions/services'
import { empty } from '@/lib/di/context'
import { createFakeProgressionsRepository } from '@/__tests__/fakes/progressionsRepository'
import type { ProgressionsRepository } from '@/db/interfaces'
import type { Context } from '@/lib/di/context'

type ProgressionsState = ReturnType<typeof useProgressions>['state']['value']
type SuccessState = Extract<ProgressionsState, { status: 'success' }>
type ErrorState = Extract<ProgressionsState, { status: 'error' }>

function contextFor(
  repo: ProgressionsRepository,
  failing: Partial<ProgressionsRepository> = {},
): Context<ProgressionsRepository> {
  return empty().add(ProgressionRepo, { ...repo, ...failing })
}

/** A repository method that always rejects — the "the repository throws" arm. */
const rejects = () => Promise.reject(new Error('boom'))

// Narrowing helpers live at module scope so the branch is not a conditional
// inside a test body (`vitest/no-conditional-in-test`).
function asSuccess(state: ProgressionsState): SuccessState {
  if (state.status !== 'success') {
    throw new Error(`expected the success state, got "${state.status}"`)
  }
  return state
}

function asError(state: ProgressionsState): ErrorState {
  if (state.status !== 'error') {
    throw new Error(`expected the error state, got "${state.status}"`)
  }
  return state
}

describe('useProgressions', () => {
  it('starts in the loading state before anything is loaded', () => {
    const { state } = useProgressions(contextFor(createFakeProgressionsRepository()))

    expect(state.value.status).toBe('loading')
  })

  it('surfaces an empty list as success, not as an error', async () => {
    const { state, reload } = useProgressions(contextFor(createFakeProgressionsRepository()))

    await reload()

    expect(state.value).toEqual({ status: 'success', items: [] })
  })

  it('derives level, progress and completion for each progression', async () => {
    const repo = createFakeProgressionsRepository()
    await repo.create({ name: 'KB Swing Ladder', availableWeights: [16, 20] })
    const { state, reload } = useProgressions(contextFor(repo))

    await reload()

    const { items } = asSuccess(state.value)
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      name: 'KB Swing Ladder',
      level: { weight: 16, reps: 10, minutes: 10 },
      isComplete: false,
      sessionsCompleted: 0,
      progress: 0,
    })
  })

  it('preserves the repository ordering — most recent session first', async () => {
    const repo = createFakeProgressionsRepository()
    await repo.create({ name: 'Stale', availableWeights: [16] })
    const fresh = await repo.create({ name: 'Fresh', availableWeights: [16] })
    // Only `Fresh` has a session, so it must sort ahead of the never-used one.
    await repo.recordSession(fresh.id, true)

    const { state, reload } = useProgressions(contextFor(repo))
    await reload()

    expect(asSuccess(state.value).items.map((item) => item.name)).toEqual(['Fresh', 'Stale'])
  })

  it('reports the error and keeps no stale items when the repository throws', async () => {
    const ctx = contextFor(createFakeProgressionsRepository(), { getAll: rejects })
    const { state, reload } = useProgressions(ctx)

    await reload()

    expect(asError(state.value).error).toBeInstanceOf(Error)
  })

  it('returns to loading before a reload resolves, so a stale list is never shown', async () => {
    const repo = createFakeProgressionsRepository()
    await repo.create({ name: 'KB Swing Ladder', availableWeights: [16] })
    const { state, reload } = useProgressions(contextFor(repo))
    await reload()
    expect(state.value.status).toBe('success')

    const pending = reload()
    expect(state.value.status).toBe('loading')
    await pending

    expect(state.value.status).toBe('success')
  })

  it('recovers to success on a reload after an earlier failure', async () => {
    const repo = createFakeProgressionsRepository()
    await repo.create({ name: 'KB Swing Ladder', availableWeights: [16] })
    // A mutable holder rather than `let`, which is disallowed in a describe body.
    const gate = { failing: true }
    const flaky: ProgressionsRepository = {
      ...repo,
      getAll: () => (gate.failing ? Promise.reject(new Error('boom')) : repo.getAll()),
    }
    const { state, reload } = useProgressions(empty().add(ProgressionRepo, flaky))

    await reload()
    expect(state.value.status).toBe('error')

    gate.failing = false
    await reload()

    expect(state.value.status).toBe('success')
  })
})
