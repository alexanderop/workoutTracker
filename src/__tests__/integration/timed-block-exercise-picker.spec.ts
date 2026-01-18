import { afterEach, beforeEach, describe, it } from 'vitest'
import { getCustomExercisesRepository } from '@/db'
import { createDbCustomExercise } from '@/db/converters'
import { page, userEvent } from '../helpers/locator'
import { expectElement } from '../helpers/assertions'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

describe('Timed Block Exercise Picker', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('Custom exercises', () => {
    it('shows custom exercises from IndexedDB when adding to EMOM block', async () => {
      // Given: a custom exercise exists in the database (name starts with 'A' to ensure it's in first 10 alphabetically)
      const customExercise = createDbCustomExercise({
        name: 'AAA Custom Lift',
        type: 'compound',
        metrics: 'weight-reps',
      })
      await getCustomExercisesRepository().add(customExercise)

      // When: I navigate to workout builder and add an EMOM block
      const { builder, common, cleanup } = await createTestApp()
      await builder.navigateTo()
      await builder.openAddBlockDialog()
      await builder.switchToTimedBlocksTab()

      // Wait for EMOM button to be visible after tab switch
      await expectElement(page.getByText('EMOM', { exact: true })).toBeVisible()
      await userEvent.click(common.getDialogButton('EMOM'))

      // And: wait for configure dialog and open exercise picker
      await expectElement(page.getByText(/configure emom/i)).toBeVisible()
      await userEvent.click(common.getDialogButton('Add Exercise'))

      // Then: I should see my custom exercise in the picker (it's first alphabetically)
      await expectElement(page.getByText('AAA Custom Lift')).toBeVisible()

      cleanup()
    })
  })
})
