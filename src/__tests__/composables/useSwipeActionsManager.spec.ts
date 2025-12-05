import { describe, it, expect, beforeEach } from 'vitest'
import { useSwipeActionsManager } from '@/composables/useSwipeActionsManager'

describe('useSwipeActionsManager', () => {
  // Reset the singleton state before each test
  beforeEach(() => {
    const { setRevealed } = useSwipeActionsManager()
    setRevealed(null)
  })

  describe('setRevealed', () => {
    it('sets the currently revealed item ID', () => {
      const { currentRevealedId, setRevealed } = useSwipeActionsManager()

      setRevealed(123)

      expect(currentRevealedId.value).toBe(123)
    })

    it('clears the revealed ID when set to null', () => {
      const { currentRevealedId, setRevealed } = useSwipeActionsManager()

      setRevealed(456)
      setRevealed(null)

      expect(currentRevealedId.value).toBeNull()
    })
  })

  describe('closeOthers', () => {
    it('clears currentRevealedId when closing a different item', () => {
      const { currentRevealedId, setRevealed, closeOthers } = useSwipeActionsManager()

      setRevealed(100)
      closeOthers(200)

      expect(currentRevealedId.value).toBeNull()
    })

    it('does not clear currentRevealedId when closing the same item', () => {
      const { currentRevealedId, setRevealed, closeOthers } = useSwipeActionsManager()

      setRevealed(100)
      closeOthers(100)

      expect(currentRevealedId.value).toBe(100)
    })

    it('does nothing when no item is revealed', () => {
      const { currentRevealedId, closeOthers } = useSwipeActionsManager()

      closeOthers(100)

      expect(currentRevealedId.value).toBeNull()
    })
  })

  describe('closeAll', () => {
    it('clears the currently revealed item', () => {
      const { currentRevealedId, setRevealed, closeAll } = useSwipeActionsManager()

      setRevealed(789)
      closeAll()

      expect(currentRevealedId.value).toBeNull()
    })
  })

  describe('isRevealed', () => {
    it('returns true when the item is revealed', () => {
      const { setRevealed, isRevealed } = useSwipeActionsManager()

      setRevealed(123)

      expect(isRevealed(123)).toBe(true)
    })

    it('returns false when a different item is revealed', () => {
      const { setRevealed, isRevealed } = useSwipeActionsManager()

      setRevealed(123)

      expect(isRevealed(456)).toBe(false)
    })

    it('returns false when no item is revealed', () => {
      const { isRevealed } = useSwipeActionsManager()

      expect(isRevealed(123)).toBe(false)
    })
  })

  describe('singleton behavior', () => {
    it('shares state across multiple calls', () => {
      const manager1 = useSwipeActionsManager()
      const manager2 = useSwipeActionsManager()

      manager1.setRevealed(999)

      expect(manager2.currentRevealedId.value).toBe(999)
      expect(manager2.isRevealed(999)).toBe(true)
    })
  })
})
