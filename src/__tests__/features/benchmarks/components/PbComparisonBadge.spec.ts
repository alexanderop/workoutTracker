import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/vue'
import PbComparisonBadge from '@/features/benchmarks/components/PbComparisonBadge.vue'
import type { PbComparisonResult } from '@/features/benchmarks/composables/usePbComparison'

describe('PbComparisonBadge', () => {
  afterEach(() => {
    cleanup()
  })
  describe('new PB variant', () => {
    it('renders new PB message with celebration emoji', () => {
      const comparisonResult: PbComparisonResult = {
        status: 'new-pb',
        previousTime: 930, // 15:30
        improvement: 45, // 45 seconds faster
      }

      render(PbComparisonBadge, {
        props: { comparisonResult },
      })

      // Check for new PB message
      expect(screen.getByText(/New PB!/i)).toBeTruthy()
      expect(screen.getByText(/🎉/)).toBeTruthy()
    })

    it('displays improvement time', () => {
      const comparisonResult: PbComparisonResult = {
        status: 'new-pb',
        previousTime: 930,
        improvement: 45,
      }

      render(PbComparisonBadge, {
        props: { comparisonResult },
      })

      // Should show "45 seconds faster" or similar
      expect(screen.getByText(/45/)).toBeTruthy()
      expect(screen.getByText(/faster/i)).toBeTruthy()
    })

    it('displays previous time', () => {
      const comparisonResult: PbComparisonResult = {
        status: 'new-pb',
        previousTime: 930, // 15:30
        improvement: 45,
      }

      render(PbComparisonBadge, {
        props: { comparisonResult },
      })

      // Should show previous time formatted as "15:30"
      expect(screen.getByText(/Previous/i)).toBeTruthy()
      expect(screen.getByText(/15:30/)).toBeTruthy()
    })

    it('has green styling for new PB', () => {
      const comparisonResult: PbComparisonResult = {
        status: 'new-pb',
        previousTime: 930,
        improvement: 45,
      }

      const { container } = render(PbComparisonBadge, {
        props: { comparisonResult },
      })

      // Check for green color class (primary or success color)
      const badge = container.querySelector('[role="status"]')
      expect(badge).toBeTruthy()
      expect(badge?.className).toContain('bg-gradient')
    })
  })

  describe('first PB variant', () => {
    it('renders first PB message', () => {
      const comparisonResult: PbComparisonResult = {
        status: 'first-pb',
      }

      render(PbComparisonBadge, {
        props: { comparisonResult },
      })

      expect(screen.getByText(/First PB set!/i)).toBeTruthy()
      expect(screen.getByText(/🎉/)).toBeTruthy()
    })

    it('does not show improvement or previous time for first PB', () => {
      const comparisonResult: PbComparisonResult = {
        status: 'first-pb',
      }

      render(PbComparisonBadge, {
        props: { comparisonResult },
      })

      expect(screen.queryByText(/faster/i)).toBeNull()
      expect(screen.queryByText(/Previous/i)).toBeNull()
    })

    it('has blue styling for first PB', () => {
      const comparisonResult: PbComparisonResult = {
        status: 'first-pb',
      }

      const { container } = render(PbComparisonBadge, {
        props: { comparisonResult },
      })

      const badge = container.querySelector('[role="status"]')
      expect(badge).toBeTruthy()
      expect(badge?.className).toContain('bg-gradient')
    })
  })

  describe('no PB variant', () => {
    it('renders nothing when no PB was beaten', () => {
      const comparisonResult: PbComparisonResult = {
        status: 'no-pb',
        previousTime: 885,
      }

      render(PbComparisonBadge, {
        props: { comparisonResult },
      })

      // Should not render any badge content
      expect(screen.queryByRole('status')).toBeNull()
      expect(screen.queryByText(/PB/i)).toBeNull()
    })
  })

  describe('accessibility', () => {
    it('has role="status" for screen readers', () => {
      const comparisonResult: PbComparisonResult = {
        status: 'new-pb',
        previousTime: 930,
        improvement: 45,
      }

      const { container } = render(PbComparisonBadge, {
        props: { comparisonResult },
      })

      const badge = container.querySelector('[role="status"]')
      expect(badge).toBeTruthy()
    })

    it('has aria-live="polite" for announcements', () => {
      const comparisonResult: PbComparisonResult = {
        status: 'new-pb',
        previousTime: 930,
        improvement: 45,
      }

      const { container } = render(PbComparisonBadge, {
        props: { comparisonResult },
      })

      const badge = container.querySelector('[aria-live="polite"]')
      expect(badge).toBeTruthy()
    })
  })
})
