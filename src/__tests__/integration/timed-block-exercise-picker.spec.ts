import { waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { resetInitState } from '@/features/workout/composables/useAppInitialization'
import { resetWorkout } from '@/features/workout/composables/useWorkout'
import { customExercisesRepository } from '@/db/repositories/customExercises'
import { createDbCustomExercise } from '@/db/converters'
import { createTestApp } from '../helpers/createTestApp'
import { resetDatabase } from '../setup'

describe('Timed Block Exercise Picker', () => {
  beforeEach(async () => {
    resetInitState()
    await resetDatabase()
  })

  afterEach(async () => {
    resetWorkout()
    await resetDatabase()
    document.body.innerHTML = ''
  })

  describe('Custom exercises', () => {
    it('shows custom exercises from IndexedDB when adding to EMOM block', async () => {
      // Given: a custom exercise exists in the database (name starts with 'A' to ensure it's in first 10 alphabetically)
      const customExercise = createDbCustomExercise({
        name: 'AAA Custom Lift',
        icon: '🏋️',
        type: 'compound',
        metrics: 'weight-reps',
      })
      await customExercisesRepository.add(customExercise)

      // When: I navigate to workout builder and add an EMOM block
      const { builder, user, common, getByRole, queryByText, cleanup } = await createTestApp()
      await builder.navigateTo()
      await builder.openAddBlockDialog()
      await builder.switchToTimedBlocksTab()
      await user.click(common.getDialogButton('EMOM'))

      // And: wait for configure dialog and open exercise picker
      await waitFor(() => {
        const dialog = getByRole('dialog')
        expect(dialog.textContent).toContain('Configure')
      })
      await user.click(common.getDialogButton('Add Exercise'))

      // Then: I should see my custom exercise in the picker (it's first alphabetically)
      await waitFor(() => {
        expect(queryByText('AAA Custom Lift')).toBeTruthy()
      })

      cleanup()
    })
  })
})
