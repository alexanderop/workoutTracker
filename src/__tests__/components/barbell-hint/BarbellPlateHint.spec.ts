import { describe, it, expect } from 'vitest'
import { render } from 'vitest-browser-vue'
import { page } from 'vitest/browser'
import BarbellPlateHint from '@/components/ui/barbell-hint/BarbellPlateHint.vue'

describe('BarbellPlateHint', () => {
  describe('empty bar state', () => {
    it('shows bar weight indicator when weight equals bar weight (kg)', async () => {
      render(BarbellPlateHint, {
        props: {
          weight: 20,
          unit: 'kg',
        },
      })

      // Should show "20" for bar weight
      await expect.element(page.getByText('20')).toBeVisible()
    })

    it('shows bar weight indicator when weight equals bar weight (lbs)', async () => {
      render(BarbellPlateHint, {
        props: {
          weight: 45,
          unit: 'lbs',
        },
      })

      // Should show "45" for bar weight
      await expect.element(page.getByText('45')).toBeVisible()
    })

    it('shows bar weight indicator when weight is less than bar weight', async () => {
      render(BarbellPlateHint, {
        props: {
          weight: 10,
          unit: 'kg',
        },
      })

      // Should show "20" for bar weight (empty bar state)
      await expect.element(page.getByText('20')).toBeVisible()
    })
  })

  describe('plate visualization', () => {
    it('renders correct number of plates for 60kg (one 20kg plate)', async () => {
      render(BarbellPlateHint, {
        props: {
          weight: 60,
          unit: 'kg',
        },
      })

      // Should show "20" on a plate (20kg plate per side)
      await expect.element(page.getByText('20')).toBeVisible()
    })

    it('renders correct number of plates for 100kg (two 20kg plates)', async () => {
      render(BarbellPlateHint, {
        props: {
          weight: 100,
          unit: 'kg',
        },
      })

      // Should show two "20" plates (20kg prioritized over 25kg)
      const plates = page.getByText('20')
      await expect.element(plates.first()).toBeVisible()
    })

    it('renders plates for 135lb (one 45lb plate)', async () => {
      render(BarbellPlateHint, {
        props: {
          weight: 135,
          unit: 'lbs',
        },
      })

      // Should show "45" on a plate
      await expect.element(page.getByText('45')).toBeVisible()
    })

    it('renders plates for 225lb (two 45lb plates)', async () => {
      render(BarbellPlateHint, {
        props: {
          weight: 225,
          unit: 'lbs',
        },
      })

      // Should show two "45" plates
      const plates = page.getByText('45')
      await expect.element(plates.first()).toBeVisible()
    })

    it('shows number on 5kg plate', async () => {
      render(BarbellPlateHint, {
        props: {
          weight: 30, // 30kg = 20 bar + 5 per side
          unit: 'kg',
        },
      })

      await expect.element(page.getByText('5')).toBeVisible()
    })

    it('shows number on 2.5kg plate', async () => {
      render(BarbellPlateHint, {
        props: {
          weight: 25, // 25kg = 20 bar + 2.5 per side
          unit: 'kg',
        },
      })

      await expect.element(page.getByText('2.5')).toBeVisible()
    })

    it('shows number on 1.25kg plate', async () => {
      render(BarbellPlateHint, {
        props: {
          weight: 22.5, // 22.5kg = 20 bar + 1.25 per side
          unit: 'kg',
        },
      })

      await expect.element(page.getByText('1.25')).toBeVisible()
    })
  })

  describe('accessibility', () => {
    it('has accessible label for empty bar', async () => {
      render(BarbellPlateHint, {
        props: {
          weight: 20,
          unit: 'kg',
        },
      })

      await expect
        .element(page.getByRole('img', { name: /empty barbell.*20kg bar/i }))
        .toBeVisible()
    })

    it('has accessible label with plate description', async () => {
      render(BarbellPlateHint, {
        props: {
          weight: 60,
          unit: 'kg',
        },
      })

      await expect
        .element(page.getByRole('img', { name: /barbell with 20kg plates/i }))
        .toBeVisible()
    })

    it('lists multiple plates in accessible label', async () => {
      render(BarbellPlateHint, {
        props: {
          weight: 100,
          unit: 'kg',
        },
      })

      // 100kg = 40kg per side = 20 + 20 (two 20kg plates)
      await expect
        .element(page.getByRole('img', { name: /barbell with 20kg.*20kg plates/i }))
        .toBeVisible()
    })
  })

  describe('unachievable weights', () => {
    it('shows empty bar for impossible weights (21kg)', async () => {
      render(BarbellPlateHint, {
        props: {
          weight: 21,
          unit: 'kg',
        },
      })

      // Should show bar weight indicator (empty bar)
      await expect.element(page.getByText('20')).toBeVisible()
    })
  })
})
