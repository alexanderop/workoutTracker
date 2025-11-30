import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useEnterAnimation } from '@/composables/useEnterAnimation'
import { withSetup } from '../helpers/withSetup'

describe('useEnterAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('starts with isVisible as false', () => {
      const [result, app] = withSetup(() => useEnterAnimation())

      expect(result.isVisible.value).toBe(false)

      app.unmount()
    })
  })

  describe('default delay', () => {
    it('becomes visible after default 100ms delay', () => {
      const [result, app] = withSetup(() => useEnterAnimation())

      expect(result.isVisible.value).toBe(false)

      vi.advanceTimersByTime(99)
      expect(result.isVisible.value).toBe(false)

      vi.advanceTimersByTime(1)
      expect(result.isVisible.value).toBe(true)

      app.unmount()
    })
  })

  describe('custom delay', () => {
    it('accepts custom delay parameter', () => {
      const [result, app] = withSetup(() => useEnterAnimation(200))

      vi.advanceTimersByTime(199)
      expect(result.isVisible.value).toBe(false)

      vi.advanceTimersByTime(1)
      expect(result.isVisible.value).toBe(true)

      app.unmount()
    })

    it('handles zero delay', () => {
      const [result, app] = withSetup(() => useEnterAnimation(0))

      expect(result.isVisible.value).toBe(false)

      vi.advanceTimersByTime(0)
      expect(result.isVisible.value).toBe(true)

      app.unmount()
    })
  })

  describe('cleanup', () => {
    it('does not error when unmounted before delay completes', () => {
      const [result, app] = withSetup(() => useEnterAnimation(1000))

      expect(result.isVisible.value).toBe(false)

      // Unmount before timer fires
      app.unmount()

      // Should not throw
      vi.advanceTimersByTime(1000)
    })
  })
})
