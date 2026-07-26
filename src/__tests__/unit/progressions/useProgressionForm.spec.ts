/**
 * Node-tier composable spec for `useProgressionForm` (ADR 004:
 * brain/decisions/004-db-in-di.md).
 *
 * Validation is pure computed logic and the save path is one repository call,
 * so none of this needs a DOM — the browser suite previously reached these
 * rules only by driving the create form through the UI.
 */
import { describe, it, expect } from 'vitest'
import { useProgressionForm } from '@/features/progressions/composables/useProgressionForm'
import { ProgressionRepo } from '@/features/progressions/services'
import { empty } from '@/lib/di/context'
import { createFakeProgressionsRepository } from '@/__tests__/fakes/progressionsRepository'
import type { ProgressionsRepository } from '@/db/interfaces'
import type { Context } from '@/lib/di/context'

function contextFor(
  repo: ProgressionsRepository,
  failing: Partial<ProgressionsRepository> = {},
): Context<ProgressionsRepository> {
  return empty().add(ProgressionRepo, { ...repo, ...failing })
}

const rejects = () => Promise.reject(new Error('boom'))

describe('useProgressionForm', () => {
  describe('validation', () => {
    it('disables save on an empty form', () => {
      const form = useProgressionForm(contextFor(createFakeProgressionsRepository()))

      expect(form.isSaveDisabled.value).toBe(true)
    })

    it('treats a whitespace-only name as invalid', () => {
      const form = useProgressionForm(contextFor(createFakeProgressionsRepository()))

      form.name.value = ' '.repeat(3)
      form.toggleWeight(16)

      expect(form.isNameValid.value).toBe(false)
      expect(form.isSaveDisabled.value).toBe(true)
    })

    it('still disables save when a name is given but no kettlebell is selected', () => {
      const form = useProgressionForm(contextFor(createFakeProgressionsRepository()))

      form.name.value = 'KB Swing Ladder'

      expect(form.hasWeights.value).toBe(false)
      expect(form.isSaveDisabled.value).toBe(true)
    })

    it('enables save once a name and at least one kettlebell are present', () => {
      const form = useProgressionForm(contextFor(createFakeProgressionsRepository()))

      form.name.value = 'KB Swing Ladder'
      form.toggleWeight(16)

      expect(form.isSaveDisabled.value).toBe(false)
    })
  })

  describe('weight selection', () => {
    it('toggles a weight off again on a second call', () => {
      const form = useProgressionForm(contextFor(createFakeProgressionsRepository()))

      form.toggleWeight(16)
      expect(form.isWeightSelected(16)).toBe(true)

      form.toggleWeight(16)
      expect(form.isWeightSelected(16)).toBe(false)
    })

    it('sorts selected weights ascending regardless of selection order', () => {
      const form = useProgressionForm(contextFor(createFakeProgressionsRepository()))

      form.toggleWeight(24)
      form.toggleWeight(12)
      form.toggleWeight(16)

      expect(form.sortedWeights.value).toEqual([12, 16, 24])
    })

    it('offers a starting-weight option per selected weight, indexed by sorted position', () => {
      const form = useProgressionForm(contextFor(createFakeProgressionsRepository()))

      form.toggleWeight(24)
      form.toggleWeight(16)

      expect(form.startingWeightOptions.value).toEqual([
        { value: 0, label: '16kg' },
        { value: 1, label: '24kg' },
      ])
    })
  })

  describe('save', () => {
    it('persists the trimmed name, the sorted weights and the starting index', async () => {
      const repo = createFakeProgressionsRepository()
      const form = useProgressionForm(contextFor(repo))
      form.name.value = '  KB Swing Ladder  '
      form.toggleWeight(24)
      form.toggleWeight(16)
      form.startingWeightIndex.value = 1

      const saved = await form.save()

      expect(saved?.name).toBe('KB Swing Ladder')
      expect(saved?.availableWeights).toEqual([16, 24])
      expect(saved?.currentWeightIndex).toBe(1)
      expect(await repo.getAll()).toHaveLength(1)
    })

    it('returns null and writes nothing when the form is invalid', async () => {
      const repo = createFakeProgressionsRepository()
      const form = useProgressionForm(contextFor(repo))

      await expect(form.save()).resolves.toBeNull()

      expect(await repo.getAll()).toEqual([])
    })

    it('records the error and clears the saving flag when the repository throws', async () => {
      const repo = createFakeProgressionsRepository()
      const form = useProgressionForm(contextFor(repo, { create: rejects }))
      form.name.value = 'KB Swing Ladder'
      form.toggleWeight(16)

      await expect(form.save()).resolves.toBeNull()

      expect(form.saveError.value).toBeInstanceOf(Error)
      // Must clear on the failure path too, or the save button stays disabled
      // and the user cannot retry.
      expect(form.isSaving.value).toBe(false)
      expect(form.isSaveDisabled.value).toBe(false)
    })

    it('clears a previous error on the next save attempt', async () => {
      const repo = createFakeProgressionsRepository()
      const gate = { failing: true }
      const flaky: ProgressionsRepository = {
        ...repo,
        create: (data) => (gate.failing ? Promise.reject(new Error('boom')) : repo.create(data)),
      }
      const form = useProgressionForm(empty().add(ProgressionRepo, flaky))
      form.name.value = 'KB Swing Ladder'
      form.toggleWeight(16)
      await form.save()
      expect(form.saveError.value).toBeInstanceOf(Error)

      gate.failing = false
      const saved = await form.save()

      expect(saved).not.toBeNull()
      expect(form.saveError.value).toBeNull()
    })
  })

  describe('reset', () => {
    it('clears the name, the selection, the starting index and any error', () => {
      const form = useProgressionForm(contextFor(createFakeProgressionsRepository()))
      form.name.value = 'KB Swing Ladder'
      form.toggleWeight(16)
      form.startingWeightIndex.value = 1

      form.reset()

      expect(form.name.value).toBe('')
      expect(form.selectedWeights.value).toEqual([])
      expect(form.startingWeightIndex.value).toBe(0)
      expect(form.saveError.value).toBeNull()
      expect(form.isSaveDisabled.value).toBe(true)
    })
  })
})
