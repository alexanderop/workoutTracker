import { describe, it, expect } from 'vitest'
import { render } from 'vitest-browser-vue'
import { page } from 'vitest/browser'
import BarbellPlateHint from '@/components/ui/barbell-hint/BarbellPlateHint.vue'

describe('BarbellPlateHint', () => {
  describe('empty bar state', () => {
    it('shows the unit-specific empty bar at, below, and near an unachievable weight', async () => {
      const { rerender } = render(BarbellPlateHint, {
        props: {
          weight: 20,
          unit: 'kg',
        },
      })

      // Should show "20" for bar weight
      await expect.element(page.getByText('20')).toBeVisible()

      await rerender({ weight: 45, unit: 'lbs' })

      // Should show "45" for bar weight
      await expect.element(page.getByText('45')).toBeVisible()

      await rerender({ weight: 10, unit: 'kg' })

      // Should show "20" for bar weight (empty bar state)
      await expect.element(page.getByText('20')).toBeVisible()

      await rerender({ weight: 21, unit: 'kg' })

      // An impossible load should also fall back to the empty bar.
      await expect.element(page.getByText('20')).toBeVisible()
    })
  })

  describe('plate visualization', () => {
    it('renders representative kg and lb plate loads, including small labeled plates', async () => {
      const { rerender } = render(BarbellPlateHint, {
        props: {
          weight: 60,
          unit: 'kg',
        },
      })

      // Should show "20" on a plate (20kg plate per side)
      await expect.element(page.getByText('20')).toBeVisible()

      await rerender({ weight: 100, unit: 'kg' })

      // Should show two "20" plates (20kg prioritized over 25kg)
      const plates = page.getByText('20')
      await expect.element(plates.first()).toBeVisible()
      await expect
        .element(
          page.getByRole('img', {
            name: /barbell with 20kg, 20kg plates on each side/i,
          }),
        )
        .toBeVisible()

      await rerender({ weight: 135, unit: 'lbs' })

      // Should show "45" on a plate
      await expect.element(page.getByText('45')).toBeVisible()

      await rerender({ weight: 225, unit: 'lbs' })

      // Should show two "45" plates
      const poundPlates = page.getByText('45')
      await expect.element(poundPlates.first()).toBeVisible()
      await expect
        .element(
          page.getByRole('img', {
            name: /barbell with 45lbs, 45lbs plates on each side/i,
          }),
        )
        .toBeVisible()

      await rerender({ weight: 25, unit: 'kg' })

      await expect.element(page.getByText('2.5')).toBeVisible()

      await rerender({ weight: 30, unit: 'kg' })

      await expect.element(page.getByText('5')).toBeVisible()
    })
  })

  describe('accessibility', () => {
    it('announces empty, single-plate, and multiple-plate barbell states', async () => {
      const { rerender } = render(BarbellPlateHint, {
        props: {
          weight: 20,
          unit: 'kg',
        },
      })

      await expect
        .element(page.getByRole('img', { name: /empty barbell.*20kg bar/i }))
        .toBeVisible()

      await rerender({ weight: 60, unit: 'kg' })

      await expect
        .element(page.getByRole('img', { name: /barbell with 20kg plates/i }))
        .toBeVisible()

      await rerender({ weight: 100, unit: 'kg' })

      // 100kg = 40kg per side = 20 + 20 (two 20kg plates)
      await expect
        .element(page.getByRole('img', { name: /barbell with 20kg.*20kg plates/i }))
        .toBeVisible()
    })
  })
})
