import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, shallowRef } from 'vue'
import { useEnterAnimation } from '@/composables/useEnterAnimation'

describe('useEnterAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should be defined', () => {
    expect(useEnterAnimation).toBeDefined()
  })

  it('is hidden before the delay and visible after it', async () => {
    const { isVisible } = useEnterAnimation(100)

    expect(isVisible.value).toBe(false)

    await vi.advanceTimersByTimeAsync(150)

    expect(isVisible.value).toBe(true)
  })

  it('accepts a reactive delay', async () => {
    const delay = shallowRef(200)
    const { isVisible } = useEnterAnimation(delay)

    await vi.advanceTimersByTimeAsync(150)
    expect(isVisible.value).toBe(false)

    await vi.advanceTimersByTimeAsync(100)
    expect(isVisible.value).toBe(true)
  })

  it('never becomes visible when the owning scope is disposed before the delay', async () => {
    const scope = effectScope()
    const result = scope.run(() => useEnterAnimation(100))!

    scope.stop()
    await vi.advanceTimersByTimeAsync(500)

    expect(result.isVisible.value).toBe(false)
  })
})
