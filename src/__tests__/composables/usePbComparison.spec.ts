import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { usePbComparison } from '@/features/benchmarks/composables/usePbComparison'

describe('usePbComparison', () => {
  describe('first completion (no previous PB)', () => {
    it('returns first-pb status when previousBest is null', () => {
      const completionTime = ref(885)
      const previousBest = ref<number | null>(null)

      const { result } = usePbComparison(completionTime, previousBest)

      expect(result.value).toEqual({ status: 'first-pb' })
    })
  })

  describe('new PB (beat previous)', () => {
    it('returns new-pb status when completion time is faster', () => {
      const completionTime = ref(885) // 14:45
      const previousBest = ref<number | null>(930) // 15:30

      const { result } = usePbComparison(completionTime, previousBest)

      expect(result.value).toEqual({
        status: 'new-pb',
        previousTime: 930,
        improvement: 45,
      })
    })

    it('calculates improvement correctly for large time differences', () => {
      const completionTime = ref(600) // 10:00
      const previousBest = ref<number | null>(900) // 15:00

      const { result } = usePbComparison(completionTime, previousBest)

      expect(result.value).toEqual({
        status: 'new-pb',
        previousTime: 900,
        improvement: 300, // 5 minutes faster
      })
    })

    it('calculates improvement correctly for small time differences', () => {
      const completionTime = ref(884) // 14:44
      const previousBest = ref<number | null>(885) // 14:45

      const { result } = usePbComparison(completionTime, previousBest)

      expect(result.value).toEqual({
        status: 'new-pb',
        previousTime: 885,
        improvement: 1, // 1 second faster
      })
    })
  })

  describe('no PB (slower or equal)', () => {
    it('returns no-pb status when completion time is slower', () => {
      const completionTime = ref(960) // 16:00
      const previousBest = ref<number | null>(885) // 14:45

      const { result } = usePbComparison(completionTime, previousBest)

      expect(result.value).toEqual({
        status: 'no-pb',
        previousTime: 885,
      })
    })

    it('returns no-pb status when completion time is equal to PB', () => {
      const completionTime = ref(885) // 14:45
      const previousBest = ref<number | null>(885) // 14:45

      const { result } = usePbComparison(completionTime, previousBest)

      expect(result.value).toEqual({
        status: 'no-pb',
        previousTime: 885,
      })
    })
  })

  describe('reactivity', () => {
    it('updates result when completionTime changes', () => {
      const completionTime = ref(960) // Initially slower
      const previousBest = ref<number | null>(930)

      const { result } = usePbComparison(completionTime, previousBest)

      expect(result.value.status).toBe('no-pb')

      // User improves time
      completionTime.value = 885 // Now faster

      expect(result.value).toEqual({
        status: 'new-pb',
        previousTime: 930,
        improvement: 45,
      })
    })

    it('updates result when previousBest changes', () => {
      const completionTime = ref(885)
      const previousBest = ref<number | null>(null)

      const { result } = usePbComparison(completionTime, previousBest)

      expect(result.value).toEqual({ status: 'first-pb' })

      // Previous best is now available
      previousBest.value = 930

      expect(result.value).toEqual({
        status: 'new-pb',
        previousTime: 930,
        improvement: 45,
      })
    })
  })
})
