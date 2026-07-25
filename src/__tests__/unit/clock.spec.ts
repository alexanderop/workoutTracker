import { describe, expect, it } from 'vitest'
import { empty } from '@/lib/di/context'
import { Clock, IdGen } from '@/lib/clock'
import { testClock } from '@/__tests__/fakes/clock'

describe('Clock', () => {
  it('resolves to the system clock from an empty context', () => {
    const before = Date.now()
    const resolved = empty().get(Clock).now()
    const after = Date.now()

    expect(resolved).toBeGreaterThanOrEqual(before)
    expect(resolved).toBeLessThanOrEqual(after)
  })

  it('resolves to an overriding test clock once added to the context', () => {
    const ctx = empty().add(Clock, testClock(1000))

    expect(ctx.get(Clock).now()).toBe(1000)
  })
})

describe('testClock', () => {
  it('starts at the given time and moves forward by adjust', () => {
    const clock = testClock(1000)

    expect(clock.now()).toBe(1000)

    clock.adjust(500)

    expect(clock.now()).toBe(1500)
  })

  it('jumps to an absolute time via setTime', () => {
    const clock = testClock(1000)

    clock.setTime(5000)

    expect(clock.now()).toBe(5000)
  })

  it('resolves a sleep(0) without any clock movement', async () => {
    const clock = testClock(0)
    const resolved: Array<true> = []

    void clock.sleep(0).then(() => resolved.push(true))
    await Promise.resolve()

    expect(resolved).toStrictEqual([true])
    expect(clock.now()).toBe(0)
  })

  it('resolves a sleep scheduled at or before the new time when adjusted forward', async () => {
    const clock = testClock(0)
    const resolved: Array<true> = []

    void clock.sleep(100).then(() => resolved.push(true))
    clock.adjust(100)
    await Promise.resolve()

    expect(resolved).toStrictEqual([true])
  })

  it('leaves a sleep pending past the new time while resolving an earlier one', async () => {
    const clock = testClock(0)
    const resolved: Array<string> = []

    void clock.sleep(100).then(() => resolved.push('early'))
    void clock.sleep(500).then(() => resolved.push('late'))
    clock.adjust(200)
    await Promise.resolve()

    expect(resolved).toStrictEqual(['early'])

    clock.adjust(400)
    await Promise.resolve()

    expect(resolved).toStrictEqual(['early', 'late'])
  })

  it('resolves multiple due sleeps in scheduled-time order, not registration order', async () => {
    const clock = testClock(0)
    const resolved: Array<string> = []

    void clock.sleep(300).then(() => resolved.push('registered-first-scheduled-last'))
    void clock.sleep(100).then(() => resolved.push('registered-second-scheduled-first'))
    clock.adjust(300)
    await Promise.resolve()

    expect(resolved).toStrictEqual([
      'registered-second-scheduled-first',
      'registered-first-scheduled-last',
    ])
  })

  it('moves backward without resolving anything when adjusted by a negative amount', async () => {
    const clock = testClock(1000)
    const resolved: Array<true> = []

    void clock.sleep(500).then(() => resolved.push(true))
    clock.adjust(-500)
    await Promise.resolve()

    expect(clock.now()).toBe(500)
    expect(resolved).toStrictEqual([])
  })

  it('completes in milliseconds when adjusted by an hour, proving no real timer is used', async () => {
    const clock = testClock(0)
    const resolved: Array<true> = []
    const start = Date.now()

    void clock.sleep(60 * 60 * 1000).then(() => resolved.push(true))
    clock.adjust(60 * 60 * 1000)
    await Promise.resolve()

    expect(resolved).toStrictEqual([true])
    expect(Date.now() - start).toBeLessThan(50)
  })
})

describe('IdGen', () => {
  it('resolves to a function producing distinct non-empty strings from an empty context', () => {
    const idGen = empty().get(IdGen)
    const first = idGen()
    const second = idGen()

    expect(first.length).toBeGreaterThan(0)
    expect(second.length).toBeGreaterThan(0)
    expect(first).not.toBe(second)
  })
})
