import { describe, expect, it } from 'vitest'
import { createSplitTracker } from '@/lib/splitTracking'

describe('createSplitTracker', () => {
  it('starts with no splits', () => {
    const tracker = createSplitTracker()

    expect(tracker.getSplits()).toEqual([])
  })

  it('records splits in order', () => {
    const tracker = createSplitTracker()

    tracker.recordSplit(30)
    tracker.recordSplit(65)
    tracker.recordSplit(98)

    expect(tracker.getSplits()).toEqual([30, 65, 98])
  })

  it('returns a frozen snapshot that does not track later recordings', () => {
    const tracker = createSplitTracker()
    tracker.recordSplit(30)

    const snapshot = tracker.getSplits()
    tracker.recordSplit(60)

    expect(Object.isFrozen(snapshot)).toBe(true)
    expect(snapshot).toEqual([30])
    expect(tracker.getSplits()).toEqual([30, 60])
  })

  it('clears all splits on reset', () => {
    const tracker = createSplitTracker()
    tracker.recordSplit(30)
    tracker.recordSplit(60)

    tracker.reset()

    expect(tracker.getSplits()).toEqual([])
  })

  it('keeps independent state per tracker instance', () => {
    const first = createSplitTracker()
    const second = createSplitTracker()

    first.recordSplit(10)

    expect(second.getSplits()).toEqual([])
  })
})
