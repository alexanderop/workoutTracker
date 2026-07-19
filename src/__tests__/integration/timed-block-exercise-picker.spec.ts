import { page, userEvent } from 'vitest/browser'
import { describe, expect } from 'vitest'
import { it } from '../helpers/integrationTest'
import { getCustomExercisesRepository } from '@/db'
import { createDbCustomExercise } from '@/db/converters'

describe('Timed Block Exercise Picker', () => {
  describe('Custom exercises', () => {
    it('shows custom exercises from IndexedDB when adding to EMOM block', async ({
      createTestApp,
    }) => {
      // Given: a custom exercise exists in the database (name starts with 'A' to ensure it's in first 10 alphabetically)
      const customExercise = createDbCustomExercise({
        name: 'AAA Custom Lift',
        type: 'compound',
        metrics: 'weight-reps',
      })
      await getCustomExercisesRepository().add(customExercise)

      // When: I navigate to workout builder and add an EMOM block
      const { builder, common } = await createTestApp()
      await builder.navigateTo()
      await builder.openAddBlockDialog()
      await builder.switchToTimedBlocksTab()
      await userEvent.click(common.getDialogButton('EMOM'))

      // And: wait for configure dialog and open exercise picker
      await expect.element(page.getByText('Configure')).toBeVisible()
      await userEvent.click(common.getDialogButton('Add Exercise'))

      // Then: I should see my custom exercise in the picker (it's first alphabetically)
      await expect.element(page.getByText('AAA Custom Lift')).toBeVisible()
    })
  })
})
