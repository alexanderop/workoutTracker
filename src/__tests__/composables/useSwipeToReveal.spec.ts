import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { useSwipeToReveal } from '@/composables/useSwipeToReveal'
import { useSwipeActionsManager } from '@/composables/useSwipeActionsManager'
import { withSetup } from '../helpers/withSetup'

// Mock motion-v
vi.mock('motion-v', () => ({
  useMotionValue: vi.fn((initial: number) => {
    const value = ref(initial)
    return {
      get: () => value.value,
      set: (newValue: number) => {
        value.value = newValue
      },
    }
  }),
  animate: vi.fn(),
}))

// Mock @vueuse/core
vi.mock('@vueuse/core', () => ({
  onClickOutside: vi.fn(),
  useMediaQuery: vi.fn(() => ref(false)),
}))

describe('useSwipeToReveal', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Reset singleton state
    const { setRevealed } = useSwipeActionsManager()
    setRevealed(null)
  })

  describe('constants', () => {
    it('returns correct BUTTON_WIDTH of 60', () => {
      const [result, app] = withSetup(() => useSwipeToReveal(1))

      expect(result.BUTTON_WIDTH).toBe(60)

      app.unmount()
    })

    it('returns correct REVEAL_WIDTH for default 2 actions (120)', () => {
      const [result, app] = withSetup(() => useSwipeToReveal(1))

      expect(result.REVEAL_WIDTH).toBe(120)

      app.unmount()
    })

    it('respects custom actionCount option', () => {
      const [result, app] = withSetup(() => useSwipeToReveal(1, { actionCount: 3 }))

      expect(result.REVEAL_WIDTH).toBe(180) // 60 * 3

      app.unmount()
    })
  })

  describe('initial state', () => {
    it('initializes x motion value at 0', () => {
      const [result, app] = withSetup(() => useSwipeToReveal(1))

      expect(result.x.get()).toBe(0)

      app.unmount()
    })

    it('returns containerRef', () => {
      const [result, app] = withSetup(() => useSwipeToReveal(1))

      expect(result.containerRef).toBeDefined()

      app.unmount()
    })

    it('returns isTouchDevice from useMediaQuery', async () => {
      const { useMediaQuery } = await import('@vueuse/core')

      const [result, app] = withSetup(() => useSwipeToReveal(1))

      expect(result.isTouchDevice).toBeDefined()
      expect(useMediaQuery).toHaveBeenCalledWith('(pointer: coarse)')

      app.unmount()
    })
  })

  describe('closeSwipe', () => {
    it('animates x to 0', async () => {
      const { animate } = await import('motion-v')

      const [result, app] = withSetup(() => useSwipeToReveal(1))

      result.closeSwipe()

      expect(animate).toHaveBeenCalledWith(result.x, 0, {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      })

      app.unmount()
    })

    it('calls setRevealed with null', () => {
      const { currentRevealedId } = useSwipeActionsManager()

      const [result, app] = withSetup(() => useSwipeToReveal(1))

      // Set up revealed state
      const { setRevealed } = useSwipeActionsManager()
      setRevealed(1)
      expect(currentRevealedId.value).toBe(1)

      result.closeSwipe()

      expect(currentRevealedId.value).toBeNull()

      app.unmount()
    })

    it('calls onClose callback when provided', () => {
      const onCloseMock = vi.fn()

      const [result, app] = withSetup(() => useSwipeToReveal(1, { onClose: onCloseMock }))

      result.closeSwipe()

      expect(onCloseMock).toHaveBeenCalledOnce()

      app.unmount()
    })

    it('does not error when onClose is not provided', () => {
      const [result, app] = withSetup(() => useSwipeToReveal(1))

      expect(() => result.closeSwipe()).not.toThrow()

      app.unmount()
    })
  })

  describe('handleDragEnd', () => {
    it('opens reveal when offset exceeds negative SNAP_THRESHOLD', async () => {
      const { animate } = await import('motion-v')
      const { currentRevealedId } = useSwipeActionsManager()

      const [result, app] = withSetup(() => useSwipeToReveal(5))

      const mockEvent = new PointerEvent('pointerup')
      const mockInfo = { offset: { x: -61 } } // Just past -60 threshold

      result.handleDragEnd(mockEvent, mockInfo)

      expect(animate).toHaveBeenCalledWith(result.x, -120, {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      })
      expect(currentRevealedId.value).toBe(5)

      app.unmount()
    })

    it('closes reveal when offset does not exceed negative SNAP_THRESHOLD', async () => {
      const { animate } = await import('motion-v')
      const { currentRevealedId } = useSwipeActionsManager()

      const [result, app] = withSetup(() => useSwipeToReveal(5))

      const mockEvent = new PointerEvent('pointerup')
      const mockInfo = { offset: { x: -59 } } // Just before -60 threshold

      result.handleDragEnd(mockEvent, mockInfo)

      expect(animate).toHaveBeenCalledWith(result.x, 0, {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      })
      expect(currentRevealedId.value).toBeNull()

      app.unmount()
    })

    it('closes reveal when offset is exactly at SNAP_THRESHOLD', async () => {
      const { animate } = await import('motion-v')
      const { currentRevealedId } = useSwipeActionsManager()

      const [result, app] = withSetup(() => useSwipeToReveal(5))

      const mockEvent = new PointerEvent('pointerup')
      const mockInfo = { offset: { x: -60 } } // Exactly at threshold

      result.handleDragEnd(mockEvent, mockInfo)

      expect(animate).toHaveBeenCalledWith(result.x, 0, {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      })
      expect(currentRevealedId.value).toBeNull()

      app.unmount()
    })

    it('calls onClose callback when closing', () => {
      const onCloseMock = vi.fn()

      const [result, app] = withSetup(() => useSwipeToReveal(5, { onClose: onCloseMock }))

      const mockEvent = new PointerEvent('pointerup')
      const mockInfo = { offset: { x: -30 } } // Will close

      result.handleDragEnd(mockEvent, mockInfo)

      expect(onCloseMock).toHaveBeenCalledOnce()

      app.unmount()
    })

    it('does not call onClose callback when opening', () => {
      const onCloseMock = vi.fn()

      const [result, app] = withSetup(() => useSwipeToReveal(5, { onClose: onCloseMock }))

      const mockEvent = new PointerEvent('pointerup')
      const mockInfo = { offset: { x: -100 } } // Will open

      result.handleDragEnd(mockEvent, mockInfo)

      expect(onCloseMock).not.toHaveBeenCalled()

      app.unmount()
    })
  })

  describe('onClickOutside integration', () => {
    it('registers click outside listener on containerRef', async () => {
      const { onClickOutside } = await import('@vueuse/core')

      const [result, app] = withSetup(() => useSwipeToReveal(1))

      expect(onClickOutside).toHaveBeenCalledWith(result.containerRef, expect.any(Function))

      app.unmount()
    })

    it('closes swipe when clicking outside and x is not 0', async () => {
      const { animate } = await import('motion-v')
      const { onClickOutside } = await import('@vueuse/core')

      const [result, app] = withSetup(() => useSwipeToReveal(1))

      // Simulate swipe being open
      result.x.set(-120)

      // Get the callback that was passed to onClickOutside
      const clickOutsideCallback = vi.mocked(onClickOutside).mock.calls[0]?.[1]
      clickOutsideCallback?.(new PointerEvent('click'))

      expect(animate).toHaveBeenCalledWith(result.x, 0, {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      })

      app.unmount()
    })

    it('does nothing when clicking outside and x is already 0', async () => {
      const { animate } = await import('motion-v')
      const { onClickOutside } = await import('@vueuse/core')
      vi.clearAllMocks()

      const [result, app] = withSetup(() => useSwipeToReveal(1))

      // x is already 0
      expect(result.x.get()).toBe(0)

      // Get the callback that was passed to onClickOutside
      const clickOutsideCallback = vi.mocked(onClickOutside).mock.calls[0]?.[1]
      clickOutsideCallback?.(new PointerEvent('click'))

      expect(animate).not.toHaveBeenCalled()

      app.unmount()
    })
  })

  describe('integration with useSwipeActionsManager', () => {
    it('closes when another item is revealed', async () => {
      const { animate } = await import('motion-v')

      const [result, app] = withSetup(() => useSwipeToReveal(1))

      // Open this item
      result.x.set(-120)

      // Trigger another item to open
      const { setRevealed } = useSwipeActionsManager()
      setRevealed(2)

      // Wait for watch callback to run
      await nextTick()

      expect(animate).toHaveBeenCalledWith(result.x, 0, {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      })

      app.unmount()
    })

    it('calls onClose when closed by another item', async () => {
      const onCloseMock = vi.fn()

      const [result, app] = withSetup(() => useSwipeToReveal(1, { onClose: onCloseMock }))

      // Open this item
      result.x.set(-120)

      // Trigger another item to open
      const { setRevealed } = useSwipeActionsManager()
      setRevealed(2)

      // Wait for watch callback to run
      await nextTick()

      expect(onCloseMock).toHaveBeenCalledOnce()

      app.unmount()
    })

    it('does not close when same item is set as revealed', async () => {
      const { animate } = await import('motion-v')
      vi.clearAllMocks()

      const [result, app] = withSetup(() => useSwipeToReveal(1))

      // Open this item
      result.x.set(-120)
      const { setRevealed } = useSwipeActionsManager()
      setRevealed(1)

      // Set same item again
      setRevealed(1)

      // Should not animate (only called once during setup)
      expect(animate).not.toHaveBeenCalled()

      app.unmount()
    })

    it('does not animate when x is already 0 and another item is revealed', async () => {
      const { animate } = await import('motion-v')
      vi.clearAllMocks()

      const [result] = withSetup(() => useSwipeToReveal(1))

      // x is already 0
      expect(result.x.get()).toBe(0)

      // Trigger another item to open
      const { setRevealed } = useSwipeActionsManager()
      setRevealed(2)

      // Should not animate because x was already 0
      expect(animate).not.toHaveBeenCalled()
    })
  })

  describe('accepts MaybeRefOrGetter for itemId', () => {
    it('works with plain number', () => {
      const { currentRevealedId } = useSwipeActionsManager()

      const [result, app] = withSetup(() => useSwipeToReveal(42))

      const mockEvent = new PointerEvent('pointerup')
      const mockInfo = { offset: { x: -100 } }

      result.handleDragEnd(mockEvent, mockInfo)

      expect(currentRevealedId.value).toBe(42)

      app.unmount()
    })

    it('works with ref', () => {
      const { currentRevealedId } = useSwipeActionsManager()
      const itemIdRef = ref(99)

      const [result, app] = withSetup(() => useSwipeToReveal(itemIdRef))

      const mockEvent = new PointerEvent('pointerup')
      const mockInfo = { offset: { x: -100 } }

      result.handleDragEnd(mockEvent, mockInfo)

      expect(currentRevealedId.value).toBe(99)

      app.unmount()
    })

    it('works with getter function', () => {
      const { currentRevealedId } = useSwipeActionsManager()
      const itemId = ref(77)

      const [result, app] = withSetup(() => useSwipeToReveal(() => itemId.value))

      const mockEvent = new PointerEvent('pointerup')
      const mockInfo = { offset: { x: -100 } }

      result.handleDragEnd(mockEvent, mockInfo)

      expect(currentRevealedId.value).toBe(77)

      app.unmount()
    })

    it('responds to changes in ref itemId when closed by manager', async () => {
      const { animate } = await import('motion-v')
      const itemIdRef = ref(10)

      const [result, app] = withSetup(() => useSwipeToReveal(itemIdRef))

      // Open this item
      result.x.set(-120)

      // Change the itemId
      itemIdRef.value = 20

      // Trigger another item to open (not matching new ID)
      const { setRevealed } = useSwipeActionsManager()
      setRevealed(30)

      // Wait for watch callback to run
      await nextTick()

      // Should animate to close because currentRevealedId (30) !== itemId (20)
      expect(animate).toHaveBeenCalledWith(result.x, 0, {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      })

      app.unmount()
    })
  })

  describe('custom actionCount', () => {
    it('calculates correct REVEAL_WIDTH for 1 action', () => {
      const [result, app] = withSetup(() => useSwipeToReveal(1, { actionCount: 1 }))

      expect(result.REVEAL_WIDTH).toBe(60)

      app.unmount()
    })

    it('calculates correct REVEAL_WIDTH for 4 actions', () => {
      const [result, app] = withSetup(() => useSwipeToReveal(1, { actionCount: 4 }))

      expect(result.REVEAL_WIDTH).toBe(240)

      app.unmount()
    })

    it('animates to correct REVEAL_WIDTH when opening with custom actionCount', async () => {
      const { animate } = await import('motion-v')

      const [result, app] = withSetup(() => useSwipeToReveal(1, { actionCount: 3 }))

      const mockEvent = new PointerEvent('pointerup')
      const mockInfo = { offset: { x: -100 } }

      result.handleDragEnd(mockEvent, mockInfo)

      expect(animate).toHaveBeenCalledWith(result.x, -180, {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      })

      app.unmount()
    })
  })
})
