/**
 * Node-tier composable spec for `useProgression` (ADR 004:
 * brain/decisions/004-db-in-di.md).
 *
 * Covers paths the browser integration suite cannot reach without booting the
 * app and monkey-patching the singleton: the `not-found` arm, the repository
 * error arm, `deleteProgression`'s re-entrancy guard, and the
 * session-history-failed fallback where the progression still loads but its
 * history comes back empty.
 *
 * `onMounted` is not exercised — instantiated outside a component there is no
 * instance to attach it to, so these specs call `reload()` explicitly.
 */
import { describe, it, expect } from 'vitest'
import { useProgression } from '@/features/progressions/composables/useProgression'
import { ProgressionRepo } from '@/features/progressions/services'
import { empty } from '@/lib/di/context'
import { createFakeProgressionsRepository } from '@/__tests__/fakes/progressionsRepository'
import type { ProgressionsRepository } from '@/db/interfaces'
import type { Context } from '@/lib/di/context'

type DetailState = ReturnType<typeof useProgression>['state']['value']
type SuccessState = Extract<DetailState, { status: 'success' }>

function contextFor(
  repo: ProgressionsRepository,
  failing: Partial<ProgressionsRepository> = {},
): Context<ProgressionsRepository> {
  return empty().add(ProgressionRepo, { ...repo, ...failing })
}

const rejects = () => Promise.reject(new Error('boom'))

function asSuccess(state: DetailState): SuccessState {
  if (state.status !== 'success') {
    throw new Error(`expected the success state, got "${state.status}"`)
  }
  return state
}

async function seeded(): Promise<{ repo: ProgressionsRepository; id: string }> {
  const repo = createFakeProgressionsRepository()
  const progression = await repo.create({ name: 'KB Swing Ladder', availableWeights: [16, 20] })
  return { repo, id: progression.id }
}

describe('useProgression', () => {
  it('loads the progression with its derived level, phase and progress', async () => {
    const { repo, id } = await seeded()
    const { state, reload, currentLevel, phase, progress, levelDisplay } = useProgression(
      id,
      contextFor(repo),
    )

    await reload()

    expect(asSuccess(state.value).progression.name).toBe('KB Swing Ladder')
    expect(currentLevel.value).toEqual({ weight: 16, reps: 10, minutes: 10 })
    expect(phase.value).toBe('reps')
    expect(progress.value).toBe(0)
    expect(levelDisplay.value).not.toBe('')
  })

  it('reports not-found for an id that was never stored', async () => {
    const { repo } = await seeded()
    const { state, reload } = useProgression('missing', contextFor(repo))

    await reload()

    expect(state.value.status).toBe('not-found')
  })

  it('reports an error when the lookup itself throws', async () => {
    const { repo, id } = await seeded()
    const { state, reload } = useProgression(id, contextFor(repo, { getById: rejects }))

    await reload()

    expect(state.value.status).toBe('error')
  })

  it('still loads the progression when the session history fails, with an empty history', async () => {
    const { repo, id } = await seeded()
    const ctx = contextFor(repo, { getSessionHistory: rejects })
    const { state, reload, sessions } = useProgression(id, ctx)

    await reload()

    // The progression is the page's primary content; a failed history read
    // degrades to an empty list rather than blanking the whole detail view.
    expect(asSuccess(state.value).progression.id).toBe(id)
    expect(sessions.value).toEqual([])
  })

  it('lists session history newest first', async () => {
    const { repo, id } = await seeded()
    await repo.recordSession(id, true, { reps: 12, minutes: 10, weightIndex: 0, isComplete: false })
    await repo.recordSession(id, false)
    const { state, reload } = useProgression(id, contextFor(repo))

    await reload()

    const { sessions } = asSuccess(state.value)
    expect(sessions).toHaveLength(2)
    expect(sessions[0]?.completed).toBe(false)
    expect(sessions[1]?.completed).toBe(true)
  })

  it('deletes a loaded progression and reports success', async () => {
    const { repo, id } = await seeded()
    const { reload, deleteProgression } = useProgression(id, contextFor(repo))
    await reload()

    await expect(deleteProgression()).resolves.toBe(true)

    expect(await repo.getById(id)).toBeUndefined()
  })

  it('refuses to delete before the progression has loaded', async () => {
    const { repo, id } = await seeded()
    const { deleteProgression } = useProgression(id, contextFor(repo))

    await expect(deleteProgression()).resolves.toBe(false)

    expect(await repo.getById(id)).toBeDefined()
  })

  it('reports failure and clears the deleting flag when delete throws', async () => {
    const { repo, id } = await seeded()
    const { reload, deleteProgression, isDeleting } = useProgression(
      id,
      contextFor(repo, { delete: rejects }),
    )
    await reload()

    await expect(deleteProgression()).resolves.toBe(false)

    // The flag must clear on the failure path too, or the button stays
    // disabled forever and the user cannot retry.
    expect(isDeleting.value).toBe(false)
  })

  it('ignores a second delete while the first is still in flight', async () => {
    const { repo, id } = await seeded()
    const calls: Array<string> = []
    const slow: ProgressionsRepository = {
      ...repo,
      delete: async (target: string) => {
        calls.push(target)
        await Promise.resolve()
      },
    }
    const { reload, deleteProgression } = useProgression(id, empty().add(ProgressionRepo, slow))
    await reload()

    const [first, second] = await Promise.all([deleteProgression(), deleteProgression()])

    expect([first, second]).toEqual([true, false])
    expect(calls).toEqual([id])
  })
})
