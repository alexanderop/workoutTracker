import { beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { effectScope, ref } from 'vue'
import { useFormDraft } from '@/composables/useFormDraft'
import { getDraftsRepository } from '@/db'
import { resetDatabase } from '@/__tests__/setup'

// The composable uses a 50ms debounce in test mode (see DEFAULT_DEBOUNCE_MS)
const TEST_DEBOUNCE_MS = 50

async function flushDraftDebounce(): Promise<void> {
  await vi.advanceTimersByTimeAsync(TEST_DEBOUNCE_MS)
}

function installTestClock(): void {
  vi.useFakeTimers()
  onTestFinished(() => {
    vi.useRealTimers()
  })
}

describe('useFormDraft', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  it('should be defined', () => {
    expect(useFormDraft).toBeDefined()
  })

  it('restores a saved draft at setup time in a bare effect scope', async () => {
    await getDraftsRepository().save('template-create', { name: 'Saved Draft' })
    const formState = ref({ name: '' })

    const scope = effectScope()
    const result = scope.run(() => useFormDraft('template-create', formState))!

    await vi.waitFor(() => expect(result.hasDraft.value).toBe(true))
    expect(formState.value.name).toBe('Saved Draft')

    scope.stop()
  })

  it('discards a draft whose shape no longer matches the form', async () => {
    await getDraftsRepository().save('template-create', { obsoleteField: 'x' })
    const formState = ref({ name: '' })

    const scope = effectScope()
    const result = scope.run(() => useFormDraft('template-create', formState))!

    await vi.waitFor(async () => {
      const draft = await getDraftsRepository().get('template-create')
      expect(draft).toBeUndefined()
    })
    expect(result.hasDraft.value).toBe(false)
    expect(formState.value.name).toBe('')

    scope.stop()
  })

  it('auto-saves changes after the debounce window', async () => {
    const formState = ref({ name: '' })

    const scope = effectScope()
    const result = scope.run(() => useFormDraft('template-create', formState))!

    formState.value.name = 'My Template'

    await vi.waitFor(async () => {
      const draft = await getDraftsRepository().get('template-create')
      expect(draft?.data).toEqual({ name: 'My Template' })
    })
    expect(result.hasDraft.value).toBe(true)

    scope.stop()
  })

  it('skips saving when the form is empty per the isEmpty option', async () => {
    installTestClock()
    const formState = ref({ name: '' })

    const scope = effectScope()
    scope.run(() =>
      useFormDraft('template-create', formState, { isEmpty: (state) => state.name === '' }),
    )

    formState.value.name = 'not empty'
    formState.value.name = ''

    await flushDraftDebounce()

    const draft = await getDraftsRepository().get('template-create')
    expect(draft).toBeUndefined()

    scope.stop()
  })

  it('does not write a draft when the scope is disposed before the debounce fires', async () => {
    installTestClock()
    const formState = ref({ name: '' })

    const scope = effectScope()
    scope.run(() => useFormDraft('template-create', formState))

    formState.value.name = 'about to unmount'
    scope.stop()

    await flushDraftDebounce()

    const draft = await getDraftsRepository().get('template-create')
    expect(draft).toBeUndefined()
  })

  it('clearDraft removes the stored draft', async () => {
    installTestClock()
    await getDraftsRepository().save('template-create', { name: 'Saved Draft' })
    const formState = ref({ name: '' })

    const scope = effectScope()
    const result = scope.run(() => useFormDraft('template-create', formState))!
    await vi.waitFor(() => expect(result.hasDraft.value).toBe(true))

    // Restoring mutated the form state, which schedules a debounced auto-save;
    // let it land first so clearDraft() is the last write.
    await flushDraftDebounce()

    await result.clearDraft()

    expect(result.hasDraft.value).toBe(false)
    expect(await getDraftsRepository().get('template-create')).toBeUndefined()

    scope.stop()
  })
})
